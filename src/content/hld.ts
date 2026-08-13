import type { Lesson } from "./types";

export const hldLessons: Lesson[] = [
  {
    slug: "system-design-foundations",
    track: "hld",
    title: "System Design Foundations",
    subtitle: "Requirements, capacity, APIs, and the classic building blocks.",
    difficulty: "intermediate",
    minutes: 30,
    tags: ["foundations"],
    blocks: [
      {
        type: "prose",
        title: "Interview flow",
        body: "1) Clarify functional + non-functional requirements. 2) Estimate QPS, storage, bandwidth. 3) Sketch API. 4) High-level components. 5) Deep-dive bottlenecks. 6) Failures, scaling, observability. Speak trade-offs out loud.",
      },
      {
        type: "steps",
        title: "Building blocks",
        items: [
          "Load balancer / API gateway",
          "App servers (stateless)",
          "Cache (Redis/Memcached)",
          "Database (SQL/NoSQL) + replicas",
          "Object storage / CDN",
          "Message queue / log",
          "Search index",
        ],
      },
      {
        type: "callout",
        tone: "tip",
        body: "Always ask: read vs write ratio, consistency needs, latency SLO, multi-region, and abuse cases.",
      },
    ],
    quiz: [
      {
        id: "sdf1",
        prompt: "Why prefer stateless app servers?",
        options: [
          "They use less electricity by law",
          "Horizontal scaling and easy replaceability behind a load balancer",
          "They remove the need for databases",
          "They guarantee strong consistency",
        ],
        answerIndex: 1,
        explanation: "Any instance can handle any request; scale by adding boxes.",
      },
    ],
  },
  {
    slug: "cap-consistency",
    track: "hld",
    title: "CAP, Consistency & Consensus",
    subtitle: "Trade-offs in distributed data: CP/AP, quorum, and consensus.",
    difficulty: "advanced",
    minutes: 35,
    tags: ["cap", "consistency"],
    blocks: [
      {
        type: "prose",
        title: "CAP in practice",
        body: "Under network partition you lean toward Consistency (reject/serve only primary) or Availability (serve possibly stale). Most systems offer tunable consistency: eventual, read-your-writes, quorum (R+W>N), linearizability via consensus (Raft/Paxos) for control planes / metadata.",
      },
      {
        type: "prose",
        title: "Patterns",
        body: "Single leader replication: simple reads/writes, failover complexity. Multi-leader: write availability, conflict resolution. Leaderless (Dynamo-style): quorums + vector clocks/CRDTs. Pick based on conflict tolerance.",
      },
    ],
    quiz: [
      {
        id: "cap1",
        prompt: "Raft is typically used to provide…",
        options: [
          "Best-effort UDP delivery",
          "Replicated state machine consensus for strong leadership/consistency",
          "CDN caching",
          "JSON schema validation",
        ],
        answerIndex: 1,
        explanation: "Raft elects a leader and replicates a log for consistent state machines.",
      },
    ],
  },
  {
    slug: "caching-cdn",
    track: "hld",
    title: "Caching & CDN",
    subtitle: "Where to cache, invalidation, and stampede control.",
    difficulty: "intermediate",
    minutes: 28,
    tags: ["cache", "cdn"],
    blocks: [
      {
        type: "prose",
        title: "Layers",
        body: "Browser → CDN → reverse proxy → app → Redis → DB. Each layer needs TTL and invalidation strategy. Problems: stampede (thundering herd), stampede on expiry, hot keys, cache penetration (misses for missing keys).",
      },
      {
        type: "steps",
        title: "Mitigations",
        items: [
          "Request coalescing / singleflight",
          "Probabilistic early expiration",
          "Negative caching for misses",
          "Hot key replication / local cache",
          "Write-through vs write-back vs invalidate-on-write",
        ],
      },
      {
        type: "code",
        title: "singleflight for stampede",
        language: "go",
        code: `var group singleflight.Group

func GetUser(ctx context.Context, id string) (*User, error) {
	v, err, _ := group.Do("user:"+id, func() (interface{}, error) {
		return repo.FindUser(ctx, id)
	})
	if err != nil {
		return nil, err
	}
	return v.(*User), nil
}`,
      },
    ],
    quiz: [
      {
        id: "cc1",
        prompt: "Cache stampede happens when…",
        options: [
          "TTLs are infinite",
          "Many requests concurrently miss and hit the origin for the same key",
          "CDN is disabled by law",
          "You use HTTPS",
        ],
        answerIndex: 1,
        explanation: "Coalescing/singleflight prevents duplicate origin fetches.",
      },
    ],
  },
  {
    slug: "databases-scaling",
    track: "hld",
    title: "Databases & Scaling",
    subtitle: "Indexing, replication, sharding, and when to go NoSQL.",
    difficulty: "advanced",
    minutes: 40,
    tags: ["database", "sharding"],
    blocks: [
      {
        type: "prose",
        title: "Scale ladder",
        body: "Vertical scale → indexes & query tuning → read replicas → caching → partitioning/sharding → specialized stores. Sharding needs a key that balances load and supports queries; cross-shard transactions are expensive.",
      },
      {
        type: "prose",
        title: "SQL vs NoSQL (pragmatic)",
        body: "SQL: rich queries, joins, strong transactions. Document/KV: flexible docs, easy horizontal scale for simple access patterns. Wide-column: time series / huge writes. Search engines for full-text. Often polyglot: OLTP SQL + Redis + object store + search.",
      },
      {
        type: "callout",
        tone: "note",
        body: "In Go services, prefer clear repository boundaries so storage engines can change without rewriting domain logic.",
      },
    ],
    quiz: [
      {
        id: "db1",
        prompt: "A good shard key usually…",
        options: [
          "Is constantly updated",
          "Distributes load evenly and matches primary access patterns",
          "Is a random UUID always with heavy range scans by date",
          "Is the server hostname",
        ],
        answerIndex: 1,
        explanation: "Balance + query affinity beat theoretically unique but impractical keys.",
      },
    ],
  },
  {
    slug: "messaging-queues",
    track: "hld",
    title: "Messaging & Event-Driven Design",
    subtitle: "Queues vs logs, delivery semantics, and outbox.",
    difficulty: "advanced",
    minutes: 35,
    tags: ["messaging", "events"],
    blocks: [
      {
        type: "prose",
        title: "Semantics",
        body: "At-most-once, at-least-once, exactly-once (usually effective exactly-once via idempotency). Queues (SQS/Rabbit) for task distribution; logs (Kafka) for replayable event streams. Consumer groups, DLQs, ordering keys, and backpressure matter.",
      },
      {
        type: "prose",
        title: "Transactional outbox",
        body: "Write business row + outbox row in one DB transaction; a publisher relays outbox to the broker. Avoids dual-write races between DB and queue.",
      },
      {
        type: "steps",
        title: "Go service checklist",
        items: [
          "Idempotent handlers (dedupe keys)",
          "Bounded worker pools",
          "Context deadlines on processing",
          "Metrics: lag, retries, DLQ depth",
        ],
      },
    ],
    quiz: [
      {
        id: "mq1",
        prompt: "Transactional outbox primarily solves…",
        options: [
          "TLS termination",
          "Dual-write inconsistency between DB and message broker",
          "DNS caching",
          "Frontend routing",
        ],
        answerIndex: 1,
        explanation: "Atomic DB write of state+event, then async publish.",
      },
    ],
  },
  {
    slug: "url-shortener-hld",
    track: "hld",
    title: "HLD: URL Shortener",
    subtitle: "End-to-end design: scale, storage, and redirects.",
    difficulty: "intermediate",
    minutes: 40,
    tags: ["case-study"],
    prerequisites: ["url-shortener-lld", "system-design-foundations"],
    blocks: [
      {
        type: "prose",
        title: "Scale picture",
        body: "Redirects are extremely read-heavy. Cache code→URL in Redis + CDN for custom domains. Write path: API → ID service (range-allocated counters) → primary DB. Analytics via async events. Estimate: 100B URLs × ~100 bytes ≈ tens of TB with replication overhead.",
      },
      {
        type: "steps",
        title: "Deep dives to offer",
        items: [
          "ID generation without global lock (ticket servers / Snowflake)",
          "DB sharding by code hash",
          "Cache invalidation on delete/update",
          "Abuse: spam URLs, rate limits",
          "301 vs 302 SEO/caching implications",
        ],
      },
    ],
    quiz: [
      {
        id: "ush1",
        prompt: "Why is redirect path usually cached aggressively?",
        options: [
          "Writes dominate",
          "Read QPS dominates and mappings are mostly immutable",
          "Caches replace the need for uniqueness",
          "HTTP forbids DB reads",
        ],
        answerIndex: 1,
        explanation: "Immutable mappings + huge read volume → cache/CDN wins.",
      },
    ],
  },
  {
    slug: "chat-system-hld",
    track: "hld",
    title: "HLD: Chat / Messaging",
    subtitle: "Real-time delivery, fan-out, and storage choices.",
    difficulty: "advanced",
    minutes: 45,
    tags: ["case-study", "realtime"],
    blocks: [
      {
        type: "prose",
        title: "Core challenges",
        body: "Persistent connections (WebSocket), presence, online fan-out vs offline push, group chat fan-out (write fan-out vs read fan-out), message ordering per conversation, media via object storage, multi-device sync.",
      },
      {
        type: "prose",
        title: "Fan-out strategies",
        body: "Write fan-out (push message into each member inbox) helps read-heavy feeds but hurts large groups. Read fan-out (store once, read pulls) scales groups better with more work on read. Hybrid: fan-out for small chats, pull for huge channels.",
      },
      {
        type: "steps",
        title: "Go-centric view",
        items: [
          "Connection gateway tier holds sockets; sticky sessions or conn-registry",
          "Pub/sub (Redis/NATS/Kafka) bridges gateways",
          "Message service persists then publishes",
          "Push service for offline devices",
        ],
      },
    ],
    quiz: [
      {
        id: "chat1",
        prompt: "Large group chats often prefer…",
        options: [
          "Write fan-out to millions of inboxes per message",
          "Store once and pull / hybrid fan-out",
          "Only email delivery",
          "Single global mutex",
        ],
        answerIndex: 1,
        explanation: "Avoid exploding writes for huge membership lists.",
      },
    ],
  },
  {
    slug: "rate-limiter-hld",
    track: "hld",
    title: "HLD: Distributed Rate Limiting",
    subtitle: "Global limits across many Go service instances.",
    difficulty: "advanced",
    minutes: 32,
    tags: ["rate-limit", "redis"],
    prerequisites: ["rate-limiter-lld"],
    blocks: [
      {
        type: "prose",
        title: "Distributed approaches",
        body: "Central Redis counters / token buckets with Lua for atomicity. Alternative: local limits + global async reconciliation (approximate). Edge gateway enforces coarse limits; services enforce fine-grained per-user quotas. Consistency vs latency trade-off: slightly soft limits often OK.",
      },
      {
        type: "steps",
        title: "Design talk track",
        items: [
          "Where enforced (CDN, gateway, service)",
          "Accuracy vs speed",
          "Redis hotspot keys — shard by user hash",
          "Fail open vs fail closed on Redis outage",
        ],
      },
    ],
    quiz: [
      {
        id: "rlh1",
        prompt: "Redis + Lua is popular for rate limits because…",
        options: [
          "Lua is required by HTTP",
          "Scripts execute atomically server-side for check-and-decrement",
          "It removes the need for keys",
          "It replaces TLS",
        ],
        answerIndex: 1,
        explanation: "Atomic scripts avoid racey read-modify-write across clients.",
      },
    ],
  },
  {
    slug: "news-feed-hld",
    track: "hld",
    title: "HLD: News Feed",
    subtitle: "Fan-out, ranking, and timeline storage.",
    difficulty: "advanced",
    minutes: 40,
    tags: ["case-study", "feed"],
    blocks: [
      {
        type: "prose",
        title: "Timeline design",
        body: "Push model precomputes feeds on post (good for active users with modest follow graphs). Pull model aggregates at read time (good for celebrities). Hybrid is industry norm. Ranking mixes recency, affinity, and ML features; cache top of feed.",
      },
      {
        type: "prose",
        title: "Storage",
        body: "Post service owns content. Fan-out workers write feed entries (user_id, post_id, score/ts) into Cassandra/Redis lists. Media in object storage + CDN. Soft deletes and privacy checks at serving time.",
      },
    ],
    quiz: [
      {
        id: "nf1",
        prompt: "Celebrity posts are hard for pure write fan-out because…",
        options: [
          "They use UTF-8",
          "Millions of follower inbox writes per post",
          "Caches refuse large images",
          "SQL cannot store text",
        ],
        answerIndex: 1,
        explanation: "Hybrid systems pull celebrity content instead of exploding fan-out.",
      },
    ],
  },
  {
    slug: "observability-resilience",
    track: "hld",
    title: "Observability & Resilience",
    subtitle: "SLOs, retries, circuit breakers, and graceful degradation.",
    difficulty: "intermediate",
    minutes: 30,
    tags: ["sre", "resilience"],
    blocks: [
      {
        type: "prose",
        title: "Operate what you design",
        body: "Golden signals: latency, traffic, errors, saturation. Structured logs + trace IDs (OpenTelemetry) + metrics. Resilience: timeouts, bounded retries with jitter, circuit breakers, bulkheads, deadline propagation via context in Go.",
      },
      {
        type: "code",
        title: "Retry with jitter sketch",
        language: "go",
        code: `func DoWithRetry(ctx context.Context, attempts int, fn func(context.Context) error) error {
	var err error
	for i := 0; i < attempts; i++ {
		if err = fn(ctx); err == nil {
			return nil
		}
		delay := time.Duration(math.Pow(2, float64(i))) * 50 * time.Millisecond
		delay += time.Duration(rand.Intn(50)) * time.Millisecond
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(delay):
		}
	}
	return err
}`,
      },
      {
        type: "callout",
        tone: "warn",
        body: "Retries without jitter amplify incidents. Always cap attempts and honor ctx deadlines.",
      },
    ],
    quiz: [
      {
        id: "or1",
        prompt: "Deadline propagation in Go services is typically done with…",
        options: ["Global variables", "context.Context", "GOMAXPROCS", "file locks"],
        answerIndex: 1,
        explanation: "context carries cancellation and deadlines across API boundaries.",
      },
    ],
  },
];
