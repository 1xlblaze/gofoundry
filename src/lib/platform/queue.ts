import type { DiagnosticMode, DiagnosticStreamEvent } from "./types";

export type QueueJobPayload = {
  jobId: string;
  problemId: string;
  code: string;
  modes: DiagnosticMode[];
};

type QueueHandler = (payload: QueueJobPayload) => Promise<void>;

const STREAM_KEY = "gofoundry:diagnostics";
const GROUP = "gofoundry-workers";
const CONSUMER = `worker-${process.pid}`;

type RedisStreamsClient = {
  xAdd: (key: string, id: string, fields: Record<string, string>) => Promise<string>;
  xReadGroup: (
    group: string,
    consumer: string,
    streams: { key: string; id: string }[],
    count: number,
    blockMs: number,
  ) => Promise<Array<{ id: string; message: Record<string, string> }> | null>;
  xGroupCreate: (key: string, group: string, id: string, mkStream: boolean) => Promise<void>;
  xAck: (key: string, group: string, id: string) => Promise<void>;
  ping?: () => Promise<string>;
};

let redisClient: RedisStreamsClient | null = null;

const memoryQueue: QueueJobPayload[] = [];
let memoryConsumer: QueueHandler | null = null;

function hasUpstashRestConfig(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );
}

export function isRedisConfigured(): boolean {
  return Boolean(process.env.REDIS_URL) || hasUpstashRestConfig();
}

export function getRedisBackend(): "upstash" | "tcp" | "memory" {
  if (hasUpstashRestConfig()) return "upstash";
  if (process.env.REDIS_URL) return "tcp";
  return "memory";
}

async function ensureConsumerGroup(client: RedisStreamsClient) {
  try {
    await client.xGroupCreate(STREAM_KEY, GROUP, "0", true);
  } catch {
    // Group already exists
  }
}

async function createUpstashClient(): Promise<RedisStreamsClient> {
  const { Redis } = await import("@upstash/redis");
  const client = Redis.fromEnv();

  const adapter: RedisStreamsClient = {
    ping: async () => String(await client.ping()),
    xGroupCreate: async (key, group, id, mkStream) => {
      await client.xgroup(key, {
        type: "CREATE",
        group,
        id,
        options: { MKSTREAM: mkStream },
      });
    },
    xAdd: async (key, id, fields) => client.xadd(key, id, fields),
    xReadGroup: async (group, consumer, streams, count, _blockMs) => {
      const stream = streams[0];
      if (!stream) return null;

      const result = await client.xreadgroup(
        group,
        consumer,
        stream.key,
        stream.id,
        { count },
      );

      if (!result || !Array.isArray(result) || result.length === 0) return null;

      const entries: Array<{ id: string; message: Record<string, string> }> = [];
      for (const item of result) {
        if (!Array.isArray(item) || item.length < 2) continue;
        const [id, rawFields] = item;
        if (typeof id !== "string" || !rawFields || typeof rawFields !== "object") continue;
        const message: Record<string, string> = {};
        for (const [field, value] of Object.entries(rawFields as Record<string, unknown>)) {
          message[field] = String(value);
        }
        entries.push({ id, message });
      }

      return entries.length > 0 ? entries : null;
    },
    xAck: async (key, group, id) => {
      await client.xack(key, group, id);
    },
  };

  await ensureConsumerGroup(adapter);
  return adapter;
}

async function createTcpClient(): Promise<RedisStreamsClient> {
  const { createClient } = await import("redis");
  const client = createClient({ url: process.env.REDIS_URL });
  await client.connect();

  const adapter: RedisStreamsClient = {
    ping: async () => String(await client.ping()),
    xAdd: async (key, id, fields) => client.xAdd(key, id, fields),
    xGroupCreate: async (key, group, id, mkStream) => {
      await client.xGroupCreate(key, group, id, { MKSTREAM: mkStream });
    },
    xReadGroup: async (group, consumer, streams, count, blockMs) => {
      const result = await client.xReadGroup(
        group,
        consumer,
        streams.map((s) => ({ key: s.key, id: s.id })),
        { COUNT: count, BLOCK: blockMs },
      );
      if (!result) return null;
      const entries: Array<{ id: string; message: Record<string, string> }> = [];
      for (const stream of result) {
        for (const msg of stream.messages) {
          entries.push({ id: msg.id, message: msg.message as Record<string, string> });
        }
      }
      return entries;
    },
    xAck: async (key, group, id) => {
      await client.xAck(key, group, id);
    },
  };

  await ensureConsumerGroup(adapter);
  return adapter;
}

async function getRedis(): Promise<RedisStreamsClient | null> {
  if (!isRedisConfigured()) return null;
  if (redisClient) return redisClient;

  redisClient = hasUpstashRestConfig()
    ? await createUpstashClient()
    : await createTcpClient();

  return redisClient;
}

export async function pingRedis(): Promise<"ok" | "error" | "not_configured"> {
  if (!isRedisConfigured()) return "not_configured";
  try {
    const client = await getRedis();
    if (!client?.ping) return "ok";
    await client.ping();
    return "ok";
  } catch {
    return "error";
  }
}

export async function enqueueDiagnosticJob(payload: QueueJobPayload): Promise<void> {
  const redis = await getRedis();
  if (redis) {
    await redis.xAdd(STREAM_KEY, "*", {
      jobId: payload.jobId,
      problemId: payload.problemId,
      code: payload.code,
      modes: JSON.stringify(payload.modes),
    });
    return;
  }

  memoryQueue.push(payload);
  if (memoryConsumer) {
    const job = memoryQueue.shift();
    if (job) await memoryConsumer(job);
  }
}

export async function startQueueConsumer(handler: QueueHandler): Promise<void> {
  const redis = await getRedis();
  if (!redis) {
    memoryConsumer = handler;
    while (memoryQueue.length > 0) {
      const job = memoryQueue.shift();
      if (job) await handler(job);
    }
    return;
  }

  const poll = async () => {
    while (true) {
      const messages = await redis.xReadGroup(
        GROUP,
        CONSUMER,
        [{ key: STREAM_KEY, id: ">" }],
        1,
        getRedisBackend() === "upstash" ? 0 : 5000,
      );
      if (!messages) {
        if (getRedisBackend() === "upstash") {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        continue;
      }
      for (const msg of messages) {
        const payload: QueueJobPayload = {
          jobId: msg.message.jobId,
          problemId: msg.message.problemId,
          code: msg.message.code,
          modes: JSON.parse(msg.message.modes) as DiagnosticMode[],
        };
        await handler(payload);
        await redis.xAck(STREAM_KEY, GROUP, msg.id);
      }
    }
  };

  void poll();
}

export type PersistedJob = {
  id: string;
  problemId: string;
  code: string;
  modes: DiagnosticMode[];
  status: string;
  events: DiagnosticStreamEvent[];
};

const persistedJobs = new Map<string, PersistedJob>();

export function cacheJob(job: PersistedJob) {
  persistedJobs.set(job.id, job);
}

export function getCachedJob(id: string): PersistedJob | undefined {
  return persistedJobs.get(id);
}

export function appendJobEvent(id: string, event: DiagnosticStreamEvent) {
  const job = persistedJobs.get(id);
  if (job) {
    job.events.push(event);
    if (event.event === "COMPLETE") job.status = "completed";
  }
}
