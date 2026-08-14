import type {
  ContentBlock,
  DiagramKind,
  Difficulty,
  Lesson,
  QuizQuestion,
} from "./types";

type TradeoffBlock = Extract<ContentBlock, { type: "tradeoff" }>;
type CapacityRow = { label: string; value: string };

type HldLessonConfig = {
  slug: string;
  title: string;
  subtitle: string;
  difficulty: Difficulty;
  minutes: number;
  tags: string[];
  prerequisites?: string[];
  clarify: string[];
  model: string[];
  architecture: string;
  diagram?: { kind: DiagramKind; title: string; caption: string };
  capacity: CapacityRow[];
  readPath: string;
  writePath: string;
  tradeoffs: TradeoffBlock[];
  operations: string[];
  goNotes: string[];
  answer: { opening: string; beats: string[]; closing: string };
  quiz: QuizQuestion[];
};

const q = (
  id: string,
  prompt: string,
  correct: string,
  ...wrong: [string, string, string]
): QuizQuestion => ({
  id,
  prompt,
  options: [correct, ...wrong],
  answerIndex: 0,
  explanation: correct,
});

const tradeoff = (
  title: string,
  first: TradeoffBlock["choices"][number],
  second: TradeoffBlock["choices"][number],
): TradeoffBlock => ({
  type: "tradeoff",
  title,
  choices: [first, second],
});

const makeHldLesson = (config: HldLessonConfig): Lesson => {
  const blocks: ContentBlock[] = [
    {
      type: "think",
      title: "HEAT · Frame the design",
      clarify: config.clarify,
      model: config.model,
      pitfalls: [
        "Naming technologies before quantifying requirements",
        "Drawing only the happy path and ignoring retries, lag, and partial failure",
      ],
    },
    {
      type: "prose",
      title: "Architecture and boundaries",
      body: config.architecture,
    },
  ];

  if (config.diagram) {
    blocks.push({
      type: "diagram",
      title: config.diagram.title,
      kind: config.diagram.kind,
      caption: config.diagram.caption,
    });
  }

  blocks.push(
    {
      type: "capacity",
      title: "Capacity estimation (worked assumptions)",
      rows: config.capacity,
    },
    { type: "prose", title: "Read path", body: config.readPath },
    { type: "prose", title: "Write path", body: config.writePath },
    ...config.tradeoffs,
    {
      type: "steps",
      title: "Failure modes, consistency, and scaling steps",
      items: config.operations,
    },
    {
      type: "steps",
      title: "Go-oriented service boundaries",
      items: config.goNotes,
    },
    {
      type: "answer",
      title: "Interview answer script",
      opening: config.answer.opening,
      beats: config.answer.beats,
      closing: config.answer.closing,
    },
  );

  return {
    slug: config.slug,
    track: "hld",
    title: config.title,
    subtitle: config.subtitle,
    difficulty: config.difficulty,
    minutes: config.minutes,
    tags: config.tags,
    prerequisites: config.prerequisites,
    blocks,
    quiz: config.quiz,
  };
};

export const hldLessons: Lesson[] = [
  makeHldLesson({
    slug: "system-design-foundations",
    title: "System Design Foundations",
    subtitle: "Requirements, estimates, APIs, data models, architecture, and defensible trade-offs.",
    difficulty: "intermediate",
    minutes: 50,
    tags: ["foundations", "capacity", "architecture"],
    clarify: [
      "Which three user journeys are in scope, and which features are explicitly out of scope?",
      "What are the availability, latency, durability, consistency, compliance, and regional requirements?",
      "What are daily active users, peak-to-average ratio, payload size, read/write ratio, and retention?",
    ],
    model: [
      "Move from requirements → estimates → API/data model → boxes/arrows → bottleneck deep dive.",
      "Separate the synchronous critical path from asynchronous side effects.",
      "Every stateful component needs ownership, partitioning, replication, and a failure story.",
    ],
    architecture:
      "Start with clients, DNS/edge, an API gateway, stateless Go services, the authoritative database, cache, object storage, and an event log or queue. Arrows must show request direction and identify which calls are synchronous. Define service boundaries by cohesive business ownership rather than one service per table. Keep authentication, rate limiting, observability, configuration, and deployment concerns visible as cross-cutting layers. The first diagram is intentionally simple; add shards, replicas, and specialized stores only when an estimate or access pattern justifies them.",
    capacity: [
      { label: "Users", value: "10M DAU × 20 operations/day = 200M operations/day" },
      { label: "Average / peak QPS", value: "200M ÷ 86,400 ≈ 2.3K average; design for 5× peak ≈ 12K QPS" },
      { label: "Network", value: "12K QPS × 4 KB average response ≈ 48 MB/s (≈384 Mb/s) at peak" },
      { label: "Storage growth", value: "20M writes/day × 1 KB ≈ 20 GB/day; ≈7.3 TB/year raw" },
      { label: "Replicated footprint", value: "7.3 TB × 3 replicas × ~1.3 index/metadata factor ≈ 28 TB/year" },
      { label: "SLO budget", value: "99.9% allows ~43.8 minutes/month; p99 latency target must be stated per API" },
    ],
    readPath:
      "A client resolves DNS, reaches the nearest edge, passes authentication and coarse rate limits, then a load balancer routes to any healthy stateless API instance. The service checks an optional cache, queries the authoritative store on miss, applies authorization and business rules, and returns a versioned response. Set an end-to-end deadline and divide its budget across downstream calls. Reads from replicas or caches must have an explicit staleness contract; read-your-writes may route to the leader or use version tokens.",
    writePath:
      "The API validates the request and idempotency key, executes the smallest authoritative transaction, and returns only after the promised durability level is met. Noncritical work—notifications, indexing, analytics, media transforms—starts from a transactional outbox or change stream. Consumers are idempotent because at-least-once delivery is normal. The API should return a resource identifier and state such as accepted or pending when asynchronous completion is involved.",
    tradeoffs: [
      tradeoff(
        "Synchronous composition vs asynchronous workflow",
        {
          label: "Synchronous request chain",
          pros: ["Simple request/response semantics", "Immediate error visibility and read-your-write behavior"],
          cons: ["Latency and availability multiply across dependencies", "Retries can amplify overload"],
          when: "Required validation or state changes that must finish before responding",
        },
        {
          label: "Queue-backed asynchronous workflow",
          pros: ["Absorbs bursts and isolates failures", "Independent consumer scaling and replay"],
          cons: ["Eventual completion and more operational state", "Requires idempotency, DLQ, and status APIs"],
          when: "Slow or optional side effects and workloads that tolerate pending state",
        },
      ),
      tradeoff(
        "Single service vs service decomposition",
        {
          label: "Modular monolith",
          pros: ["Simple transactions, deploys, and local debugging", "Low network and operational overhead"],
          cons: ["Scaling and release boundaries are shared", "Weak module discipline can create coupling"],
          when: "Early product or team where domain boundaries are still evolving",
        },
        {
          label: "Independent services",
          pros: ["Independent ownership, deploys, and scaling", "Fault and data boundaries can match domains"],
          cons: ["Distributed transactions, RPC failure, and observability complexity", "More infrastructure per boundary"],
          when: "Stable domain boundaries or materially different scale/compliance needs",
        },
      ),
    ],
    operations: [
      "Failure: use timeouts, bounded jittered retries only for retry-safe operations, circuit breakers, and load shedding; never retry a whole write blindly.",
      "Consistency: identify the source of truth and promise only the session/causal/strong guarantees required by each journey.",
      "Scaling 1: tune queries and indexes, scale stateless instances, and cache measured hot reads.",
      "Scaling 2: add read replicas and asynchronous work, then partition state by an access-aligned shard key.",
      "Scaling 3: isolate hot tenants/keys, add multi-region routing, and rehearse failover with explicit RPO/RTO.",
      "Operations: define SLIs for latency, errors, traffic, saturation, freshness, and queue lag; alerts consume error budget rather than raw CPU alone.",
    ],
    goNotes: [
      "Define transport DTOs separately from domain models; version public HTTP/gRPC APIs and validate at the boundary.",
      "Propagate context.Context deadlines and cancellation through every repository and RPC call; never store Context in a struct.",
      "Use bounded concurrency with errgroup/worker pools; unbounded goroutines turn downstream slowness into memory failure.",
      "Make write handlers idempotent with a unique database constraint on (caller, idempotency_key), storing the original result.",
      "Expose health separately: liveness says process is alive; readiness says it can safely receive traffic.",
    ],
    answer: {
      opening:
        "I’ll spend the first minutes fixing scope and SLOs, quantify peak traffic and storage, then draw one authoritative write path and one optimized read path.",
      beats: [
        "State assumptions and perform QPS, bandwidth, and retention arithmetic aloud.",
        "Define core APIs and access patterns before selecting stores.",
        "Draw the synchronous path, then move optional work behind an outbox and queue.",
        "Deep-dive the first estimated bottleneck and compare two concrete choices.",
        "Close with failures, consistency promises, observability, and the next scaling threshold.",
      ],
      closing:
        "The design is intentionally evolutionary: each added component answers a quantified bottleneck or required guarantee.",
    },
    quiz: [
      q("foundation-1", "Why estimate peak QPS before choosing components?", "It turns architecture choices into capacity decisions tied to expected load", "It guarantees no outages", "It selects a programming language", "It replaces requirements"),
      q("foundation-2", "What belongs on the synchronous write path?", "Only work required to uphold the response contract", "Every analytics event", "All email delivery", "Nightly reports"),
      q("foundation-3", "Why are stateless API instances easier to scale?", "Any healthy instance can serve a request behind the load balancer", "They need no data store", "They guarantee consistency", "They cannot fail"),
      q("foundation-4", "What does an idempotency key protect?", "Repeated delivery of one logical write from causing duplicate effects", "Read cache misses", "TLS expiry", "Schema migrations"),
    ],
  }),
  makeHldLesson({
    slug: "cap-consistency",
    title: "CAP, Consistency & Consensus",
    subtitle: "Precise guarantees under partitions, quorums, leader failover, and client-visible anomalies.",
    difficulty: "advanced",
    minutes: 55,
    tags: ["cap", "consistency", "consensus", "replication"],
    prerequisites: ["system-design-foundations"],
    clarify: [
      "Which operations must be linearizable, and which can tolerate stale or conflicting values?",
      "What partition or regional failure must the system survive, and what RPO/RTO is acceptable?",
      "Are clients sticky to a region, and do they require read-your-writes or monotonic reads?",
    ],
    model: [
      "CAP is a choice only while a network partition prevents all replicas from coordinating.",
      "Separate consistency models from replication topology and durability acknowledgements.",
      "Consensus orders control-plane decisions; it does not make every data query globally transactional for free.",
    ],
    architecture:
      "Model a replicated key/value service with three nodes across failure domains. A single leader accepts ordered writes and replicates a log; followers serve either stale reads or only reads that meet a commit/version threshold. A consensus majority elects one leader and commits entries once a quorum persists them. Clients discover the leader through a routing layer and retry with request IDs after redirects or ambiguous timeouts. For AP data, replicas accept local writes and resolve concurrent versions by domain-specific merge, CRDT, or last-write-wins only when that data-loss trade-off is acceptable.",
    capacity: [
      { label: "Traffic", value: "40K reads/s and 8K writes/s peak across 3 regions" },
      { label: "Replication", value: "2 KB/write × 8K/s × 2 follower copies ≈ 32 MB/s inter-replica payload before protocol overhead" },
      { label: "Quorum", value: "N=3, majority W=2 tolerates one unavailable replica for writes" },
      { label: "Latency", value: "In-region quorum ~5–20 ms; cross-ocean quorum commonly adds 80–180 ms" },
      { label: "Log retention", value: "8K writes/s × 2 KB × 86,400 ≈ 1.38 TB/day before snapshots/compression" },
      { label: "Availability goal", value: "99.99% service target; define whether stale reads count as successful" },
    ],
    readPath:
      "A linearizable read either goes through the current leader after it confirms leadership/commit position, or uses a quorum/read-index protocol. A follower read is faster and scales better but can lag; session tokens can require a replica to catch up to at least version v, providing read-your-writes. In leaderless storage, coordinators read R replicas, compare versions, return the winner/merge, and optionally repair stale replicas.",
    writePath:
      "A leader assigns a log position, appends locally, replicates to followers, and acknowledges after the configured quorum durably records the entry. A timeout is ambiguous: the write may have committed, so the client retries with the same idempotency key rather than issuing a new logical mutation. During partition, a CP side without quorum rejects writes; an AP system accepts concurrent writes and carries conflict metadata for later reconciliation.",
    tradeoffs: [
      tradeoff(
        "Partition behavior: CP vs AP",
        {
          label: "Reject minority writes (CP)",
          pros: ["One authoritative order and no divergent committed values", "Simpler invariants for locks, balances, and metadata"],
          cons: ["Affected clients lose write availability during partition", "Leader election and quorum add latency"],
          when: "Conflicts are invalid or costly: money, uniqueness, ownership, coordination",
        },
        {
          label: "Accept local writes (AP)",
          pros: ["Continues serving isolated regions", "Low-latency local mutation"],
          cons: ["Concurrent versions require merge and may surprise users", "Some invariants cannot be preserved without coordination"],
          when: "Carts, reactions, telemetry, or mergeable state where availability wins",
        },
      ),
      tradeoff(
        "Read routing: leader vs follower",
        {
          label: "Leader / quorum reads",
          pros: ["Can provide linearizable current state", "Simple client reasoning"],
          cons: ["Leader can bottleneck reads", "Higher latency and lower partition availability"],
          when: "Authorization, post-write confirmation, and correctness-critical decisions",
        },
        {
          label: "Follower / local reads",
          pros: ["Horizontal read scale and low regional latency", "Offloads leader"],
          cons: ["Replication lag exposes stale or non-monotonic results", "Needs session/version strategy"],
          when: "Feeds, catalog, analytics, and explicitly stale-tolerant endpoints",
        },
      ),
    ],
    operations: [
      "Failure: prevent split brain with quorum leases/terms and fencing tokens; an old leader must be unable to mutate downstream state.",
      "Consistency: document guarantees per API—linearizable, snapshot, read-your-writes, monotonic, causal, or eventual—not merely strong/eventual.",
      "Scaling: shard independent consensus groups; a single global Raft group serializes unrelated keys and caps throughput.",
      "Recovery: snapshot logs, rate-limit follower catch-up, and keep enough log/history to avoid full replica rebuilds during ordinary lag.",
      "Partition test: inject delayed, duplicated, reordered, and dropped messages plus clock skew; healthy-node tests cannot validate distributed guarantees.",
      "Observability: expose leader changes, term, commit/apply lag, quorum failures, conflict rate, and stale-read age.",
    ],
    goNotes: [
      "Carry idempotency/request IDs through gRPC metadata and persist dedupe results at the authoritative write boundary.",
      "Use monotonic time for in-process deadlines; do not use wall-clock timestamps to infer distributed event order.",
      "Return typed errors such as NotLeader, Unavailable, and VersionTooOld so clients retry or reroute correctly.",
      "Guard local replicated state through a single apply loop or clear mutex ownership; callbacks must not block consensus progress.",
    ],
    answer: {
      opening:
        "I’ll avoid treating CAP as a database label: I’ll name the partition, operation, and client-visible behavior we choose.",
      beats: [
        "Classify invariants and assign their required consistency level.",
        "Draw leader, quorum, commit, and follower-apply positions.",
        "Walk a timeout and a network partition from the client’s perspective.",
        "Explain session consistency for local reads and fencing after failover.",
        "Scale through independent shard consensus groups and monitor apply lag.",
      ],
      closing:
        "The correct design uses strong coordination only for invariants that need it and exposes weaker guarantees explicitly elsewhere.",
    },
    quiz: [
      q("cap-1", "When does CAP force a C-versus-A choice?", "While a network partition prevents replicas from coordinating", "During every normal request", "Only with SQL", "Only at one replica"),
      q("cap-2", "Why must a timed-out write be retried idempotently?", "It may have committed even though the acknowledgement was lost", "Timeout proves failure", "Leaders never retry", "It speeds reads"),
      q("cap-3", "What does a fencing token prevent?", "A stale former leader from continuing to mutate protected resources", "Follower reads", "Log compaction", "TLS replay"),
      q("cap-4", "How can follower reads provide read-your-writes?", "Require the follower to reach the client’s observed version/commit token", "Read any follower immediately", "Disable replication", "Use wall clocks"),
    ],
  }),
  makeHldLesson({
    slug: "caching-cdn",
    title: "Caching & CDN",
    subtitle: "Layered caches, freshness contracts, invalidation, stampedes, and edge delivery.",
    difficulty: "intermediate",
    minutes: 50,
    tags: ["cache", "cdn", "latency", "freshness"],
    prerequisites: ["system-design-foundations"],
    clarify: [
      "Which objects are immutable, user-specific, security-sensitive, or globally reusable?",
      "What staleness is acceptable, and how quickly must delete/revoke propagate?",
      "Is the bottleneck latency, database QPS, bandwidth, origin egress, or compute?",
    ],
    model: [
      "Browser → CDN → service-local cache → distributed cache → source of truth.",
      "Every layer needs a key, ownership, freshness policy, eviction policy, and miss behavior.",
      "A cache is a disposable derived view; correctness must survive a cold or failed cache.",
    ],
    architecture:
      "Static and cacheable public responses terminate at a CDN using cache keys that include only representation-changing dimensions. Dynamic requests reach stateless Go services, which may use a tiny bounded local cache and a shared Redis/Memcached tier before the database. Cache-aside keeps the database authoritative. Purge events fan out from committed writes; versioned object URLs make immutable assets cheap to cache forever. An origin shield coalesces regional CDN misses before they reach storage or application origins.",
    diagram: {
      kind: "video-arch",
      title: "Edge-to-origin cache hierarchy",
      caption: "The video delivery diagram also illustrates the general CDN principle: immutable objects flow from origin to shield to edge.",
    },
    capacity: [
      { label: "Traffic", value: "250K read QPS peak, 95% cacheable responses, 8 KB average" },
      { label: "Origin QPS", value: "95% hit rate leaves 12.5K misses/s; 99% leaves 2.5K/s—a 5× origin difference" },
      { label: "Edge bandwidth", value: "250K × 8 KB ≈ 2 GB/s (≈16 Gb/s) served across CDN POPs" },
      { label: "Hot set", value: "20M entries × (1 KB value + ~150 B overhead) ≈ 23 GB before replication/headroom" },
      { label: "Redis footprint", value: "3 replicas × 23 GB ÷ 0.7 target utilization ≈ 99 GB provisioned" },
      { label: "Freshness SLO", value: "Normal updates ≤60 s stale; security revocations target <5 s via purge/version checks" },
    ],
    readPath:
      "The CDN checks a normalized key and freshness metadata. A fresh hit returns immediately; stale-while-revalidate may serve bounded stale content while one request refreshes. On edge miss, the shield and then service repeat cache-aside. The service uses singleflight per key, queries the source of truth, applies authorization before caching at the correct scope, stores positive or short-lived negative results with randomized TTL, and returns. Miss/error metrics distinguish absent data from cache/backend failure.",
    writePath:
      "The service commits the authoritative change, then invalidates or updates derived caches. Delete-after-commit avoids exposing an uncommitted value, but concurrent stale fills require versioned values or delete-twice/ordered event handling. Immutable assets receive content-hashed names instead of invalidation. Sensitive revocation uses an explicit purge channel and may retain a small authoritative version check because CDN purge is not instantaneous.",
    tradeoffs: [
      tradeoff(
        "Cache-aside vs write-through",
        {
          label: "Cache-aside",
          pros: ["Simple and only requested values occupy cache", "Cache failure does not block authoritative writes"],
          cons: ["First read misses; invalidation races can reinsert stale data", "Application owns fill logic"],
          when: "General read-heavy application data with a reliable database",
        },
        {
          label: "Write-through",
          pros: ["Cache is warm after writes", "One update path can enforce cache representation"],
          cons: ["Cache becomes part of write latency/availability", "Cold data may be cached unnecessarily"],
          when: "Read-after-write traffic is high and cache availability is engineered",
        },
      ),
      tradeoff(
        "TTL freshness vs explicit invalidation",
        {
          label: "TTL only",
          pros: ["Operationally simple and self-healing", "No invalidation event pipeline"],
          cons: ["Staleness lasts until expiry", "Short TTLs increase origin load and synchronized misses"],
          when: "Bounded stale content such as catalogs or recommendations",
        },
        {
          label: "Event purge plus safety TTL",
          pros: ["Fast propagation and long normal TTLs", "TTL still heals dropped events"],
          cons: ["Ordering, fan-out, and purge rate limits add complexity", "Cannot promise instantaneous global purge"],
          when: "Frequently updated or revocable data",
        },
      ),
    ],
    operations: [
      "Failure: if shared cache is down, cap database fallback with concurrency limits; a total fail-open can overload and destroy the source of truth.",
      "Stampede: use singleflight, TTL jitter, stale-while-revalidate, and refresh-ahead for known hot keys.",
      "Consistency: version cache values and ignore invalidation/fill events older than the committed version.",
      "Scaling: shard by hashed key, replicate hot keys, and add bounded local caches only when invalidation fan-out remains manageable.",
      "Security: never share authenticated content across users; include tenant/locale/encoding in keys only when they change representation.",
      "Observability: measure hit rate by layer, fill latency, evictions, memory fragmentation, hot-key QPS, stale age, and origin amplification.",
    ],
    goNotes: [
      "Wrap cache access behind a typed interface returning hit, miss, and error separately; a miss is not an infrastructure error.",
      "Use singleflight with context-aware database work, but avoid allowing one short caller deadline to cancel a refresh needed by others.",
      "Encode cache values with schema/version fields; deploys must tolerate old entries until TTL expires.",
      "Bound local caches by bytes/entries and stop background refresh goroutines on service shutdown.",
    ],
    answer: {
      opening:
        "I’ll identify cacheable objects and their freshness/security contracts, estimate the origin reduction needed, then choose keys and invalidation.",
      beats: [
        "Draw the cache hierarchy and source of truth.",
        "Walk hit, miss, stale, negative, and backend-error paths separately.",
        "Handle stampede and hot keys before claiming a high hit rate.",
        "Explain write ordering and stale-fill races.",
        "Show cache-down load shedding and metrics.",
      ],
      closing:
        "The cache improves latency and cost but remains disposable; bounded staleness and origin protection are explicit design properties.",
    },
    quiz: [
      q("cache-1", "Why add TTL jitter?", "It prevents many keys from expiring and refilling at the same instant", "It guarantees strong consistency", "It encrypts values", "It sorts keys"),
      q("cache-2", "What is a cache stampede?", "Many concurrent misses for one key overwhelm the origin with duplicate fills", "An LRU eviction", "A CDN purge", "A database transaction"),
      q("cache-3", "Why use content-hashed asset URLs?", "Changed content gets a new immutable key, avoiding invalidation", "They hide the asset", "They reduce file size", "They enforce authentication"),
      q("cache-4", "Should a cache miss be treated as an infrastructure error?", "No; miss, hit, and cache failure are distinct outcomes", "Always", "Only at CDN", "Only for nil"),
    ],
  }),
  makeHldLesson({
    slug: "databases-scaling",
    title: "Databases & Scaling",
    subtitle: "Access-pattern modeling, indexes, replicas, sharding, transactions, and migrations.",
    difficulty: "advanced",
    minutes: 55,
    tags: ["database", "index", "replication", "sharding"],
    prerequisites: ["system-design-foundations", "cap-consistency"],
    clarify: [
      "What are the exact point, range, join, aggregation, and write access patterns?",
      "Which invariants require transactions, uniqueness, or referential integrity?",
      "What data volume, growth, hot-key distribution, retention, and geographic placement are expected?",
    ],
    model: [
      "Choose schema and indexes from access patterns, not from database categories.",
      "Scale in order: query/index discipline, vertical resources, cache/read replicas, then partitioning.",
      "A shard key is an API constraint: every unsupported query needs scatter-gather or another index.",
    ],
    architecture:
      "A stateless data-access service owns transactional rules and routes writes to a primary. Read replicas serve explicitly stale-tolerant queries. A connection pool caps database concurrency, and a proxy/router can map shard keys to partitions. Change data capture updates search, analytics, and caches without dual writes. Backups plus point-in-time logs provide recovery independent of replicas. Schema changes use expand/migrate/contract so old and new application versions overlap safely.",
    capacity: [
      { label: "Dataset", value: "2B rows × 700 B average ≈ 1.4 TB raw" },
      { label: "Indexes", value: "Primary + two secondary indexes estimated at ~0.8× raw ≈ 1.1 TB" },
      { label: "Replication", value: "(1.4 + 1.1) TB × 3 copies ≈ 7.5 TB before free-space headroom" },
      { label: "Traffic", value: "60K reads/s, 8K writes/s peak; 90% reads address one tenant" },
      { label: "Partition target", value: "32 shards gives ~250 writes/s average/shard, but model 10× hot-tenant skew" },
      { label: "Connections", value: "200 app pods × 20 connections = 4K sessions; use pool/proxy to protect DB limits" },
    ],
    readPath:
      "The service derives tenant/shard from authenticated identity, routes a point or bounded range query, and uses an index whose leading columns match equality and order predicates. Strong reads go to the primary or version-synchronized replica; stale-tolerant reads go to local replicas. Pagination uses a stable composite cursor such as (created_at,id), not large OFFSET scans. Cross-tenant analytics leaves OLTP through CDC into a warehouse.",
    writePath:
      "A transaction validates current version, updates related rows, and inserts an outbox record. Unique constraints—not preflight reads—enforce uniqueness under concurrency. The primary WAL replicates to followers and CDC consumers. Online migration adds nullable/new columns first, dual-reads or backfills in bounded batches, switches writes, verifies, then removes old schema in a later deploy.",
    tradeoffs: [
      tradeoff(
        "Relational vs key/document store",
        {
          label: "Relational database",
          pros: ["Transactions, constraints, joins, and mature indexing", "Flexible query evolution"],
          cons: ["Horizontal partitioning and cross-shard work require care", "Schema migration discipline"],
          when: "Rich relationships and correctness invariants dominate",
        },
        {
          label: "Key/document or wide-column store",
          pros: ["Simple partition-key scaling and high throughput", "Schema flexibility for aggregate records"],
          cons: ["Access patterns must be denormalized up front", "Cross-item transactions/queries are limited or costly"],
          when: "Huge simple key/range workloads with bounded query shapes",
        },
      ),
      tradeoff(
        "Range vs hash sharding",
        {
          label: "Range shard key",
          pros: ["Efficient ordered range scans", "Easy archival by range"],
          cons: ["Recent/sequential values create a hot shard", "Load can be uneven"],
          when: "Range locality is central and ranges can be split/rebalanced",
        },
        {
          label: "Hash shard key",
          pros: ["Usually even write distribution", "Simple deterministic routing"],
          cons: ["Range scans scatter across shards", "Tenant locality may be lost"],
          when: "Point lookups dominate and balanced throughput matters",
        },
      ),
    ],
    operations: [
      "Failure: replicas are not backups; keep encrypted snapshots and WAL, restore regularly, and measure achieved RPO/RTO.",
      "Consistency: replica lag can violate read-your-writes; pin sessions temporarily or pass a required commit/version token.",
      "Scaling: find slow query shapes first, add covering indexes carefully, cap connections, then shard only after measuring the primary bottleneck.",
      "Hot shards: split large tenants, use virtual buckets, or dedicate noisy tenants while preserving tenant authorization in routing.",
      "Rebalancing: copy, catch up via log, atomically switch routing metadata, then drain old ownership; dual writers need fencing.",
      "Observability: query latency by normalized shape, lock waits, deadlocks, buffer hit ratio, replica lag, storage growth, and shard skew.",
    ],
    goNotes: [
      "Use database/sql pools with explicit MaxOpenConns, MaxIdleConns, and ConnMaxLifetime; unlimited app concurrency is not database capacity.",
      "Keep transactions short and pass the transaction handle explicitly through repository methods.",
      "Check Rows.Err, close rows, use parameterized SQL, and distinguish no rows from infrastructure failure.",
      "Represent optimistic concurrency with a version column and require UPDATE ... WHERE id=? AND version=? to affect one row.",
    ],
    answer: {
      opening:
        "I’ll list the dominant access patterns and invariants, estimate dataset plus indexes, and start with the simplest store that satisfies both.",
      beats: [
        "Sketch keys, indexes, and transaction boundaries.",
        "Separate primary, replica, cache, CDC, and analytics responsibilities.",
        "Choose a shard key against query locality and skew.",
        "Walk replica lag, shard movement, and backup restore.",
        "Describe a zero-downtime migration and Go pool limits.",
      ],
      closing:
        "The design scales by preserving single-shard transactional paths and exporting other workloads asynchronously.",
    },
    quiz: [
      q("db-1", "Why use a database unique constraint instead of check-then-insert?", "The constraint closes the concurrency race atomically", "It makes reads stale", "It avoids indexes", "It removes transactions"),
      q("db-2", "Why can hash sharding hurt range scans?", "Adjacent keys distribute across many shards and require scatter-gather", "Hashes are sorted", "It duplicates rows", "It disables writes"),
      q("db-3", "Are replicas a backup strategy?", "No; corruption or deletion can replicate, so independent restorable backups are required", "Yes, always", "Only with caches", "Only in one region"),
      q("db-4", "Why prefer cursor pagination over large OFFSET?", "It seeks from an indexed stable boundary instead of scanning skipped rows", "It returns random order", "It requires no index", "It guarantees snapshots forever"),
    ],
  }),
  makeHldLesson({
    slug: "messaging-queues",
    title: "Messaging & Event-Driven Design",
    subtitle: "Queues, logs, outbox atomicity, delivery semantics, ordering, and backpressure.",
    difficulty: "advanced",
    minutes: 55,
    tags: ["messaging", "queue", "event-log", "outbox"],
    prerequisites: ["system-design-foundations", "databases-scaling"],
    clarify: [
      "Is this task distribution, pub/sub notification, or a replayable fact stream?",
      "What ordering scope, retention, replay, fan-out, and delivery latency are required?",
      "What duplicate, poison-message, and downstream-outage behavior is acceptable?",
    ],
    model: [
      "At-least-once transport plus idempotent effects is the practical default.",
      "Partition keys preserve order only within one partition and cap that key's parallelism.",
      "The transactional outbox makes business state and publish intent atomic.",
    ],
    architecture:
      "A command-facing Go service commits domain state and an outbox row in one database transaction. A relay reads new rows via polling or CDC and publishes immutable events to a broker. Queue consumers compete for tasks; log consumer groups independently track offsets and can replay retained history. Each consumer writes its side effect and dedupe/inbox marker atomically where possible, then acknowledges. Retry topics add delays, and a DLQ quarantines messages that exceed a bounded policy for human or automated remediation.",
    diagram: {
      kind: "outbox",
      title: "Transactional outbox and relay",
      caption: "Business row and publish intent commit together; the relay may repeat, so consumers remain idempotent.",
    },
    capacity: [
      { label: "Ingress", value: "100K events/s peak × 1.5 KB average ≈ 150 MB/s payload" },
      { label: "Retention", value: "150 MB/s × 86,400 × 7 days ≈ 90.7 TB raw" },
      { label: "Replication", value: "Replication factor 3 ≈ 272 TB plus indexes/protocol overhead" },
      { label: "Partitions", value: "At 8 MB/s safe write/partition, need ≥19; choose 48–96 for consumers and headroom" },
      { label: "Consumer work", value: "20 ms/event × 100K/s ≈ 2,000 concurrent worker-seconds at peak" },
      { label: "Lag SLO", value: "Critical events p99 end-to-end <5 s; batch analytics may tolerate minutes" },
    ],
    readPath:
      "Consumers poll or receive batches, deserialize a versioned envelope, validate schema, check an idempotency key, perform bounded work, and acknowledge only after the effect reaches its required durability. Log consumers resume from committed offsets; reprocessing after a crash is expected. Query-facing systems do not normally read the broker directly—they read a materialized projection whose freshness is measured by event timestamp/offset lag.",
    writePath:
      "The producer's transaction updates authoritative state and inserts event_id, aggregate_id, sequence, type, version, payload, and created_at into outbox. The relay publishes and later marks the row; a crash between publish and mark causes a duplicate, not loss. Broker acknowledgements follow the durability requirement. Per-aggregate sequence numbers let consumers detect gaps or stale reordering.",
    tradeoffs: [
      tradeoff(
        "Queue vs replayable log",
        {
          label: "Work queue",
          pros: ["Natural competing consumers and per-message acknowledgement", "Good retries and delayed task execution"],
          cons: ["Consumed work is not naturally replayed by new consumers", "Broad fan-out needs multiple queues"],
          when: "Emails, image jobs, webhooks, and one-time background tasks",
        },
        {
          label: "Partitioned event log",
          pros: ["Retention, replay, and independent consumer groups", "High-throughput ordered partitions"],
          cons: ["Partition and offset operations are more complex", "A hot ordering key limits parallelism"],
          when: "Domain events, CDC, analytics pipelines, and rebuildable projections",
        },
      ),
      tradeoff(
        "Delivery semantics",
        {
          label: "At-most-once",
          pros: ["No transport duplicates and low latency", "Simple fire-and-forget"],
          cons: ["Crashes can lose effects permanently", "Unsuitable for important business work"],
          when: "Loss-tolerant telemetry or transient presence hints",
        },
        {
          label: "At-least-once + idempotency",
          pros: ["No loss after durable acceptance", "Works across ordinary broker/database boundaries"],
          cons: ["Duplicates are normal and dedupe state costs storage", "Side effects need stable keys"],
          when: "Default for orders, notifications, indexing, and workflows",
        },
      ),
    ],
    operations: [
      "Failure: a consumer crash after effect but before ack replays the message; dedupe must surround the effect, not just handler entry.",
      "Poison messages: use bounded retries, exponential delay, typed permanent errors, DLQ metadata, and a redrive tool.",
      "Consistency: outbox prevents producer dual-write loss but projections remain eventually consistent; expose freshness or pending state.",
      "Scaling: add partitions and consumer instances until the downstream system, not the broker, becomes the limit; preserve per-key ordering.",
      "Backpressure: cap batch/concurrency, pause partitions, and shed optional producers rather than accumulating unbounded in-process work.",
      "Observability: publish failures, oldest outbox age, partition skew, consumer lag, retry rate, processing latency, and DLQ depth.",
    ],
    goNotes: [
      "Use a fixed worker pool tied to context cancellation; commit offsets only for completed records and understand batch partial failure.",
      "Version event envelopes and make consumers tolerate additive fields and known old versions during rolling deploys.",
      "Persist event IDs under a unique constraint with the business effect for transactional idempotency.",
      "Do not launch one unbounded goroutine per message; broker prefetch is not a substitute for application bounds.",
    ],
    answer: {
      opening:
        "I’ll first decide whether we need a competing queue or replayable log, then make the producer write atomic with an outbox.",
      beats: [
        "Quantify event rate, bytes, retention, and partition throughput.",
        "Define ordering and idempotency scope.",
        "Walk producer commit, relay duplicate, consumer crash, and replay.",
        "Explain retry, DLQ, and downstream backpressure.",
        "Close with schema evolution and lag/freshness observability.",
      ],
      closing:
        "The guarantee is effective exactly-once business behavior built from at-least-once delivery and idempotent state transitions.",
    },
    quiz: [
      q("msg-1", "What race does a transactional outbox remove?", "Committing database state but failing to publish its event, or vice versa", "Cache eviction", "DNS failure", "Follower lag"),
      q("msg-2", "Does exactly-once broker delivery alone guarantee exactly-once external effects?", "No; the consumer's side effect and acknowledgement can still fail separately", "Always", "Only for HTTP", "Only with one partition"),
      q("msg-3", "What does a partition key normally guarantee?", "Ordering for records sharing that key/partition", "Global total order at infinite scale", "No duplicates", "Constant latency"),
      q("msg-4", "Why bound consumer concurrency?", "To propagate backpressure and protect memory/downstream dependencies", "To disable retries", "To sort events", "To increase lag intentionally"),
    ],
  }),
  makeHldLesson({
    slug: "url-shortener-hld",
    title: "HLD: URL Shortener",
    subtitle: "Globally fast redirects, unique codes, durable mappings, abuse controls, and asynchronous analytics.",
    difficulty: "intermediate",
    minutes: 60,
    tags: ["case-study", "url-shortener", "cache"],
    prerequisites: ["system-design-foundations", "caching-cdn"],
    clarify: [
      "Are links immutable, editable, expiring, custom-aliased, or bound to custom domains?",
      "What redirect latency, availability, geography, and read/write ratio are required?",
      "Do analytics need exact per-click counts, and how quickly must malicious links be disabled?",
    ],
    model: [
      "Separate the latency-critical redirect plane from link creation and analytics.",
      "Code is the partition key; immutable mappings are ideal for CDN and cache-aside.",
      "Abuse detection and click logging must not make every redirect depend on a slow service.",
    ],
    architecture:
      "Clients reach a CDN/edge redirect tier that resolves domain+code. Edge and Redis cache immutable mapping records; misses route by code hash to a replicated link store. A creation API authenticates users, validates destinations, obtains collision-safe IDs, commits mappings, and publishes cache/scan events. An asynchronous safety scanner can quarantine links, while an analytics stream aggregates clicks into a columnar store. A small authoritative block/version check supports urgent takedown even when redirect content is cached.",
    diagram: {
      kind: "url-shortener-arch",
      title: "Shortener read and write planes",
      caption: "Redirects are edge/cache heavy; creation is durable and analytics remain asynchronous.",
    },
    capacity: [
      { label: "Creates", value: "100M links/day ≈ 1.16K/s average; 5× peak ≈ 5.8K/s" },
      { label: "Redirects", value: "10B/day ≈ 116K/s average; 6× peak ≈ 700K/s" },
      { label: "Mapping storage", value: "100M/day × 365 × 5 years × 500 B ≈ 9.1 TB raw" },
      { label: "Replicated/indexed", value: "9.1 TB × ~4 for replicas and indexes ≈ 36 TB" },
      { label: "Analytics ingress", value: "700K events/s × 200 B ≈ 140 MB/s peak before batching/compression" },
      { label: "Cache target", value: "99% edge+Redis hit leaves ~7K origin reads/s; p99 cached redirect <50 ms" },
    ],
    readPath:
      "GET /{code} first validates host and normalized code at the edge. A fresh mapping returns 301 for immutable destinations or 302/307 for editable/tracked destinations. On miss, the redirect service checks Redis, then the code-partitioned store, rejects expired/quarantined records, caches a versioned result with negative caching for unknown codes, and responds. It emits a best-effort/buffered click event; analytics loss policy is separate from redirect availability. Urgent block versions use short edge validation or purge.",
    writePath:
      "POST /v1/links validates scheme and length, authenticates quotas, canonicalizes only under a documented semantic policy, and claims either a generated code or a unique custom alias. A database unique constraint resolves collisions atomically. The transaction stores owner, URL, status, expiry, redirect type, and version plus an outbox event. The API returns the short URL after durable commit; safety scan, cache warm, and analytics registration run asynchronously.",
    tradeoffs: [
      tradeoff(
        "Code generation",
        {
          label: "Allocated ID → Base62",
          pros: ["Guaranteed uniqueness and compact fixed growth", "No collision reads on normal creation"],
          cons: ["ID allocation needs coordination/range leasing", "Sequential codes are enumerable without obfuscation"],
          when: "High throughput where short predictable-length codes matter",
        },
        {
          label: "Random code + unique insert",
          pros: ["No central allocator and codes are hard to enumerate", "Easy multi-region generation"],
          cons: ["Birthday collisions require retry and code length planning", "Random key distribution hurts creation-time locality"],
          when: "Opaque public codes and decentralized writers are priorities",
        },
      ),
      tradeoff(
        "Redirect status",
        {
          label: "301/308 permanent",
          pros: ["Browsers and CDNs offload repeat traffic strongly", "Lowest origin cost for immutable links"],
          cons: ["Destination changes and takedowns propagate slowly from caches", "Origin sees fewer exact click events"],
          when: "Immutable links with aggregate edge analytics",
        },
        {
          label: "302/307 temporary",
          pros: ["Destination can change and origin sees more traffic", "Takedown/freshness is easier"],
          cons: ["Higher latency and infrastructure cost", "Less browser caching"],
          when: "Editable, expiring, campaign, or strict tracking links",
        },
      ),
      tradeoff(
        "Mapping store",
        {
          label: "Sharded relational",
          pros: ["Strong unique aliases, owner queries, and transactions", "Operational familiarity"],
          cons: ["Manual shard routing and resharding", "Cross-shard owner views need an index/service"],
          when: "Moderate scale or rich management features",
        },
        {
          label: "Distributed KV/wide-column",
          pros: ["Natural point lookup by code and horizontal scale", "High regional availability options"],
          cons: ["Custom alias uniqueness and owner queries need extra design", "Tunable consistency can expose create/read races"],
          when: "Massive simple code→record access pattern",
        },
      ),
    ],
    operations: [
      "Failure: cache outage must be load-shed and origin-protected; serve bounded stale mappings where safe rather than flooding storage.",
      "Consistency: creation should read after write; route initial reads to leader or warm cache before response if replicas can lag.",
      "Takedown: long-lived 301 caches conflict with urgent blocking; use edge purge, short policy TTLs, and authoritative block versions.",
      "Scaling: CDN first, Redis by code hash second, mapping shards third; analytics partitions by code/time independently.",
      "Hot keys: replicate or pin viral codes at edges; a uniform storage shard key does not prevent cache-level hotspots.",
      "Abuse: rate-limit creation, scan destinations, maintain allow/deny reputation, protect custom domains, and audit operator actions.",
    ],
    goNotes: [
      "Keep redirect handler allocation-light; parse code, perform one cache/store lookup, and set explicit Cache-Control/Location headers.",
      "Model CreateLink with an idempotency key and unique code constraint; retry serialization/collision errors in a bounded loop.",
      "Use separate packages/interfaces for ID allocation, repository, cache, policy, and event sink so redirect tests do not require infrastructure.",
      "Batch analytics events through bounded channels; when full, apply the chosen loss/backpressure policy instead of leaking goroutines.",
    ],
    answer: {
      opening:
        "This is an extremely read-heavy key lookup, so I’ll split creation from redirect, put immutable mappings at the edge, and keep analytics off the critical path.",
      beats: [
        "Quantify codes, storage, redirect QPS, and required hit rate.",
        "Define POST create and GET redirect APIs plus mapping schema.",
        "Choose code generation and enforce uniqueness atomically.",
        "Compare 301 with 302 against editability, analytics, and takedown.",
        "Walk cache failure, viral links, abuse scanning, and 10× scaling.",
      ],
      closing:
        "The core path remains code→versioned mapping→redirect, while policy and analytics evolve independently.",
    },
    quiz: [
      q("url-1", "Why is a unique database constraint still needed for random codes?", "Concurrent creators or random collisions must be resolved atomically", "Random values never collide", "Caches enforce uniqueness", "Analytics checks it"),
      q("url-2", "Why keep click analytics asynchronous?", "Redirect latency and availability should not depend on the analytics pipeline", "Analytics cannot use HTTP", "Events are always exact", "It shortens codes"),
      q("url-3", "What is the downside of permanent redirects?", "Cached destinations and takedowns can be hard to change quickly", "They cannot use CDNs", "They always hit origin", "They forbid HTTPS"),
      q("url-4", "What is the main storage access pattern?", "Point lookup by domain and short code", "Full-table URL sorting", "Cross-code transactions", "Graph traversal"),
    ],
  }),
  makeHldLesson({
    slug: "chat-system-hld",
    title: "HLD: Chat & Messaging",
    subtitle: "Realtime connections, durable messages, ordering, fan-out, presence, sync, and media.",
    difficulty: "advanced",
    minutes: 70,
    tags: ["case-study", "chat", "realtime"],
    prerequisites: ["messaging-queues", "cap-consistency"],
    clarify: [
      "Are conversations 1:1, bounded groups, huge channels, or all three?",
      "What delivery, ordering, edit/delete, read-receipt, presence, and multi-device semantics are promised?",
      "How many concurrent sockets, messages, members per group, regions, and offline retention?",
    ],
    model: [
      "Connection gateways are ephemeral routing state; message history is durable.",
      "Assign order per conversation, persist first, then fan out at least once.",
      "Presence is high-churn and approximate; it should not share durability requirements with messages.",
    ],
    architecture:
      "Clients establish authenticated WebSocket connections through regional L4/L7 load balancers to Go gateway pods. A connection registry maps user/device to gateway and expires by heartbeat. Send commands route to a conversation-home message service, which verifies membership, deduplicates client_message_id, assigns a conversation sequence, persists the message, and publishes it. Fan-out workers deliver to online gateways and update inbox projections; offline devices receive APNs/FCM hints. History is partitioned by conversation, media uses signed object-storage uploads and CDN, and sync APIs reconcile gaps by sequence.",
    diagram: {
      kind: "chat-arch",
      title: "Realtime gateways and durable message plane",
      caption: "Gateways hold sockets; conversation services establish order and persistence before fan-out.",
    },
    capacity: [
      { label: "Users / sockets", value: "50M DAU, 5M concurrent devices at peak" },
      { label: "Messages", value: "2B/day ≈ 23K/s average; 5× peak ≈ 116K/s" },
      { label: "Gateway fleet", value: "10K sockets/pod at safe memory/FD limits → ~500 pods plus 50% headroom" },
      { label: "Text storage", value: "2B/day × 1 KB envelope ≈ 2 TB/day raw; 3 replicas ≈ 6 TB/day" },
      { label: "Fan-out", value: "Average 3 recipient devices gives ~350K realtime deliveries/s peak; groups create skew" },
      { label: "Latency SLO", value: "p99 send acknowledgement <200 ms; online delivery <500 ms; sync freshness <5 s" },
    ],
    readPath:
      "An online gateway receives a broker event keyed by conversation, checks connected recipient devices, and writes frames through one bounded writer loop per connection. On reconnect, the client sends its last sequence per conversation or global inbox cursor. The sync service reads inbox pointers and then message history, returning pages by stable sequence. A gap triggers history fetch; push notifications only signal that data exists and never carry authoritative state. Read receipts are idempotent monotonic updates to last_read_sequence.",
    writePath:
      "The client sends conversation_id, client_message_id, body/media reference, and local timestamp. The service authenticates membership, reserves/deduplicates the client ID, assigns server sequence, stores the immutable message and outbox atomically, then acknowledges with message_id and sequence. Broker delivery fans out after commit. Edits/deletes append version/tombstone events so offline devices converge; media is uploaded directly with a short-lived signed URL before the message references it.",
    tradeoffs: [
      tradeoff(
        "Connection transport",
        {
          label: "WebSocket",
          pros: ["Full-duplex low-overhead messages", "Natural typing, receipts, and server push"],
          cons: ["Long-lived connection operations and backpressure", "Proxies, mobile reconnects, and draining are complex"],
          when: "Primary interactive chat transport",
        },
        {
          label: "Long polling / SSE",
          pros: ["Simpler HTTP infrastructure and fallback behavior", "SSE works well for one-way server events"],
          cons: ["Higher overhead or no bidirectional channel", "Less efficient at millions of active clients"],
          when: "Fallback, restricted networks, or lower concurrency products",
        },
      ),
      tradeoff(
        "Fan-out strategy",
        {
          label: "Write-time inbox fan-out",
          pros: ["Fast inbox reads and explicit per-user delivery state", "Good for 1:1 and small groups"],
          cons: ["Write amplification explodes for huge channels", "Membership changes complicate historical visibility"],
          when: "Small/medium conversations",
        },
        {
          label: "Store once, merge on read",
          pros: ["One durable message regardless of audience", "Scales broadcast channels"],
          cons: ["Read path merges memberships and histories", "Harder per-user unread accounting"],
          when: "Very large channels; commonly combined with write fan-out for small chats",
        },
      ),
      tradeoff(
        "Ordering scope",
        {
          label: "Per-conversation sequencer/home",
          pros: ["Clear total order where users expect it", "Efficient partition-local history"],
          cons: ["Hot giant conversations bottleneck one partition", "Home-region failover needs fencing"],
          when: "Normal chat semantics",
        },
        {
          label: "Best-effort timestamp order",
          pros: ["Easy multi-region local writes", "No single conversation leader"],
          cons: ["Clock skew and concurrent messages reorder", "Client reconciliation becomes visible"],
          when: "Loose social comments where strict order is unnecessary",
        },
      ),
    ],
    operations: [
      "Failure: gateway loss drops sockets, not messages; clients reconnect with jitter and resume from durable sequence cursors.",
      "Consistency: messages are at-least-once delivered and deduplicated by message_id; order is guaranteed per conversation, not globally.",
      "Slow clients: use bounded outbound queues, disconnect/resync laggards, and never let one socket block a gateway event loop.",
      "Scaling: partition conversation history and broker by conversation_id; isolate huge channels with pull fan-out and dedicated partitions.",
      "Multi-region: route conversation writes to a home region, replicate history, and fence the old home on failover; presence remains region-local/approximate.",
      "Observability: active sockets, reconnect storms, send-to-persist and persist-to-deliver latency, sequence gaps, broker lag, and dropped slow clients.",
    ],
    goNotes: [
      "Use exactly one goroutine writing each WebSocket; multiple concurrent writers can corrupt framing and ordering.",
      "Bound per-connection queues and global subscriptions; account memory as sockets × buffers before choosing pod density.",
      "Propagate cancellation from disconnect, stop heartbeat timers, and unregister in defer to avoid goroutine/registry leaks.",
      "Keep gateway, message command, history query, presence, and notification APIs separate; gateways should not own durable business state.",
    ],
    answer: {
      opening:
        "I’ll separate ephemeral socket routing from durable conversation order, then walk send, fan-out, offline notification, and reconnect sync.",
      beats: [
        "Quantify concurrent sockets separately from message QPS and delivery amplification.",
        "Persist and assign per-conversation sequence before fan-out.",
        "Choose hybrid fan-out based on group-size threshold.",
        "Explain idempotent client IDs, sequence gaps, edits, and multi-device cursors.",
        "Handle gateway failure, slow clients, hot channels, and regional failover.",
      ],
      closing:
        "Clients can always reconstruct truth from ordered durable history, so realtime delivery is an optimization rather than the only copy.",
    },
    quiz: [
      q("chat-1", "Why persist before realtime fan-out?", "A gateway or broker failure must not lose an acknowledged message", "Persistence makes sockets faster", "Fan-out creates IDs", "Presence requires SQL"),
      q("chat-2", "What should a reconnecting client provide?", "A durable sequence/cursor so the server can return missed messages", "Only its IP address", "A new user ID", "The gateway pod name"),
      q("chat-3", "Why use hybrid fan-out?", "Small groups benefit from materialized inboxes while huge channels avoid write explosion", "It guarantees global order", "It removes storage", "It prevents retries"),
      q("chat-4", "How should a gateway handle a persistently slow socket?", "Bound its queue, disconnect it, and let the client resync", "Allocate unbounded memory", "Block every other socket", "Drop durable history"),
    ],
  }),
  makeHldLesson({
    slug: "rate-limiter-hld",
    title: "HLD: Distributed Rate Limiting",
    subtitle: "Hierarchical enforcement, token accounting, Redis atomicity, local fallback, and quota operations.",
    difficulty: "advanced",
    minutes: 60,
    tags: ["case-study", "rate-limit", "redis", "resilience"],
    prerequisites: ["system-design-foundations", "caching-cdn"],
    clarify: [
      "Which identities and dimensions are limited: IP, user, API key, tenant, route, or cost units?",
      "Is the rule burst, sustained rate, fixed quota, concurrency, or all of them?",
      "How accurate, globally coordinated, available, and dynamically configurable must enforcement be?",
    ],
    model: [
      "Enforce cheap coarse limits at the edge and product-aware quotas near the service.",
      "Token bucket permits bounded bursts while enforcing a long-term refill rate.",
      "Distributed check-and-update must be atomic; outage behavior is a product decision.",
    ],
    architecture:
      "Edge gateways enforce local IP and global abuse rules before expensive work. An authenticated quota service evaluates tenant/plan/route policies from a versioned configuration cache. Exact shared buckets live in a sharded Redis cluster and update through Lua/functions using server time; hot high-volume limits can lease token batches to local process buckets to remove a network round trip. Responses return Retry-After and standard limit metadata. Usage events feed billing/analytics asynchronously, while the decision path remains independent of that pipeline.",
    diagram: {
      kind: "token-bucket",
      title: "Token bucket enforcement",
      caption: "Tokens refill over time; a request atomically consumes cost or receives a retry time.",
    },
    capacity: [
      { label: "Protected traffic", value: "1M requests/s peak across regions" },
      { label: "Limiter calls", value: "Edge handles 70% locally; 300K/s require shared tenant decisions" },
      { label: "Redis operations", value: "Lua decision ~1 operation/request; 300K ops/s plus 2× headroom" },
      { label: "Key footprint", value: "20M active buckets × ~150 B ≈ 3 GB raw; plan 10–15 GB with overhead/replicas" },
      { label: "Latency budget", value: "Shared decision p99 <5 ms in region; local decision <100 μs" },
      { label: "Accuracy", value: "Exact paid quota; soft abuse controls may overshoot ≤1% during leases/failover" },
    ],
    readPath:
      "For each request, the gateway constructs a canonical policy key including tenant, route class, and limit version. It reads policy from a local immutable snapshot, computes request cost, then checks a local leased bucket or executes an atomic Redis script. The script refills from elapsed server time, caps at burst capacity, consumes if sufficient, stores state with expiry, and returns allowed, remaining, and retry-after. Multiple dimensions are evaluated in a defined order and all required decisions must pass.",
    writePath:
      "Control-plane operators update validated policy versions in a strongly consistent store. A config stream distributes immutable snapshots to gateways, which atomically swap them and retain the prior version for rollback. Runtime bucket writes occur atomically in Redis and expire after inactivity. Administrative quota adjustments and billing entitlements use audited idempotent commands; they do not directly mutate arbitrary process-local counters.",
    tradeoffs: [
      tradeoff(
        "Rate algorithm",
        {
          label: "Token bucket",
          pros: ["Supports controlled bursts and weighted request cost", "Constant state per key"],
          cons: ["Requires careful elapsed-time arithmetic", "Burst capacity may surprise users"],
          when: "Most API traffic with burst plus sustained-rate policy",
        },
        {
          label: "Sliding log/window",
          pros: ["Precise recent-window semantics", "Easy to explain for strict quotas"],
          cons: ["More memory/operations per request", "Hot keys store many timestamps or buckets"],
          when: "Low-volume strict compliance limits where precision outweighs cost",
        },
      ),
      tradeoff(
        "Shared exact vs local leased limits",
        {
          label: "Redis per request",
          pros: ["Accurate across all instances", "Immediate policy/state coordination"],
          cons: ["Adds a hot-path dependency and network latency", "Hot tenants can overload one shard"],
          when: "Billable or security-sensitive exact quotas",
        },
        {
          label: "Local buckets with token leases",
          pros: ["Very low latency and resilient to brief store outages", "Greatly reduces shared QPS"],
          cons: ["Bounded overshoot across instances", "Lease recovery and fairness are more complex"],
          when: "Huge traffic where a quantified error budget is acceptable",
        },
      ),
      tradeoff(
        "Limiter outage policy",
        {
          label: "Fail closed",
          pros: ["Protects expensive/fragile downstream systems", "No quota bypass"],
          cons: ["Limiter outage becomes customer outage", "Can block recovery/control traffic"],
          when: "Costly writes, login attack defense, or hard paid quotas",
        },
        {
          label: "Fail open with emergency local cap",
          pros: ["Preserves availability during Redis incidents", "Local cap still limits catastrophic flood"],
          cons: ["Temporary quota overshoot and abuse window", "Behavior differs during failure"],
          when: "Read APIs where availability outweighs exact accounting",
        },
      ),
    ],
    operations: [
      "Failure: define fail-open/closed per route class; reserve capacity for health, admin, and recovery traffic.",
      "Consistency: use Redis server time or bounded monotonic process time; client wall clocks enable skew and manipulation.",
      "Atomicity: multi-dimensional all-or-nothing consumption may require one co-located script or compensating/refund semantics.",
      "Scaling: shard on stable hash of policy key, isolate hot tenants, lease token batches, and cache policy snapshots locally.",
      "Config safety: validate that new global limits will not exceed Redis capacity; canary policy versions and support instant rollback.",
      "Observability: allowed/denied by policy, decision latency, Redis errors, lease overshoot, hot keys, and near-limit tenant cardinality.",
    ],
    goNotes: [
      "Represent decisions as typed Allowed, Remaining, RetryAfter, PolicyVersion, and Reason; middleware only maps them to HTTP.",
      "Use integer token units and elapsed nanoseconds/milliseconds to avoid floating-point drift in shared scripts.",
      "Load policy snapshots through atomic.Pointer or atomic.Value; request handlers should not lock a global config map.",
      "Batch/lease refresh needs singleflight and bounded fallback; always honor request context before calling Redis.",
    ],
    answer: {
      opening:
        "I’ll define identity, burst, sustained rate, accuracy, and outage policy, then layer edge protection with product-aware shared quotas.",
      beats: [
        "Quantify limiter QPS, active keys, memory, and added latency.",
        "Walk token refill and atomic consume with server time.",
        "Compare exact Redis decisions with local token leases.",
        "Choose fail behavior per endpoint rather than globally.",
        "Explain policy rollout, hot-key sharding, and metrics.",
      ],
      closing:
        "The result is hierarchical: cheap local protection absorbs volume while shared state is reserved for limits that require coordination.",
    },
    quiz: [
      q("rl-1", "Why use a server-side atomic script?", "Refill, check, and consume must not race across instances", "Scripts reduce token size", "HTTP requires Lua", "It disables expiry"),
      q("rl-2", "What do token leases trade for lower latency?", "A bounded amount of global quota overshoot", "All availability", "Policy versioning", "Authentication"),
      q("rl-3", "Why use server time for shared buckets?", "Clients/processes can have skewed or manipulated wall clocks", "Redis cannot store timestamps", "It increases burst", "It encrypts limits"),
      q("rl-4", "Should every endpoint use the same fail-open policy?", "No; choose based on downstream safety, cost, and availability requirements", "Yes, always open", "Yes, always closed", "Only GET matters"),
    ],
  }),
  makeHldLesson({
    slug: "news-feed-hld",
    title: "HLD: News Feed",
    subtitle: "Post ingestion, hybrid fan-out, candidate retrieval, ranking, freshness, and privacy.",
    difficulty: "advanced",
    minutes: 70,
    tags: ["case-study", "feed", "fan-out", "ranking"],
    prerequisites: ["messaging-queues", "databases-scaling"],
    clarify: [
      "Chronological or ranked, and which content sources/privacy rules are in scope?",
      "How large and skewed is the follower graph, and how fresh must new posts appear?",
      "Do deletes, blocks, edits, ads, and recommendations need immediate propagation?",
    ],
    model: [
      "Post storage is authoritative; home timelines and ranking candidates are rebuildable projections.",
      "Push normal authors, pull celebrity/high-fanout authors, and merge at read time.",
      "Retrieve hundreds of candidates cheaply, then rank/filter a bounded set.",
    ],
    architecture:
      "Post service stores content metadata and media references, then emits a post event. Fan-out workers read follower shards and append post IDs to per-user timeline stores for normal authors. High-fanout authors are marked pull-on-read, avoiding millions of writes. Feed service loads a user's materialized timeline, pulls recent celebrity/recommendation candidates, filters privacy/blocks/deletes, hydrates post/author data from caches, ranks candidates using online features, and returns an opaque cursor. Training and aggregate features run offline from event logs; the online ranker has a fallback heuristic.",
    diagram: {
      kind: "feed-arch",
      title: "Hybrid fan-out feed architecture",
      caption: "Normal authors push IDs to inboxes; celebrity candidates are merged during reads before filtering and ranking.",
    },
    capacity: [
      { label: "Users", value: "200M DAU; 10 feed opens/day → 2B reads/day ≈ 23K/s average, 140K/s peak" },
      { label: "Posts", value: "500M posts/day ≈ 5.8K/s average, 30K/s peak" },
      { label: "Fan-out", value: "Average 200 eligible followers → 100B timeline inserts/day; requires batching and hybrid cutoff" },
      { label: "Timeline storage", value: "100B IDs/day × 16 B ≈ 1.6 TB/day before replication/TTL" },
      { label: "Hydration", value: "140K reads/s × 50 posts = 7M post lookups/s, mostly cache/multi-get" },
      { label: "Latency/freshness", value: "Feed p99 <300 ms; normal post visible <10 s; deletes/blocks <60 s plus read-time filter" },
    ],
    readPath:
      "GET /feed?cursor=... authenticates user and reads a bounded page of precomputed timeline IDs after the cursor. It separately pulls recent posts from high-fanout followees and recommendations, deduplicates IDs, enforces visibility and block rules against current versions, hydrates content with batch cache reads, computes lightweight online features, and ranks. The response cursor encodes stable score/time/id boundaries and model/version metadata as needed; it never exposes an offset into a changing list.",
    writePath:
      "POST /posts commits immutable content metadata, audience, and outbox event; large media already resides in object storage. The fan-out pipeline classifies the author by follower count/activity, batches follower-list scans, writes idempotent timeline entries, and records lag. Edit/delete/privacy changes update the source of truth and emit invalidation/tombstone events. Read-time filtering is the correctness backstop while asynchronous cleanup removes stale projections.",
    tradeoffs: [
      tradeoff(
        "Timeline materialization",
        {
          label: "Fan-out on write",
          pros: ["Fast predictable home reads", "Ranking candidates are already user-specific"],
          cons: ["Huge write amplification and celebrity hotspots", "Delete/privacy cleanup touches many inboxes"],
          when: "Normal authors with bounded follower counts",
        },
        {
          label: "Fan-out on read",
          pros: ["One post write regardless of followers", "Fresh membership/privacy evaluation"],
          cons: ["Reads merge many sources and can be slow", "Popular readers repeatedly recompute candidates"],
          when: "Celebrity/broadcast authors or low-read followers",
        },
      ),
      tradeoff(
        "Feed order",
        {
          label: "Chronological",
          pros: ["Transparent, cheap, and stable cursor semantics", "No model infrastructure"],
          cons: ["Volume-heavy authors dominate and relevant older posts disappear", "Weak recommendation surface"],
          when: "Following-only products or MVP",
        },
        {
          label: "Ranked",
          pros: ["Can optimize relevance, diversity, and safety", "Supports recommendations and ads"],
          cons: ["Feature/model latency, opacity, and feedback loops", "Harder pagination consistency and experimentation"],
          when: "Large consumer feed with engagement/relevance goals",
        },
      ),
      tradeoff(
        "Timeline store",
        {
          label: "Redis sorted lists",
          pros: ["Very fast top-of-feed reads and score updates", "Simple cursor ranges"],
          cons: ["Memory cost is high and deep history is expensive", "Persistence/rebuild planning required"],
          when: "Recent hot window, backed by durable events",
        },
        {
          label: "Wide-column durable timeline",
          pros: ["Large append-heavy history and horizontal scale", "Natural user/time partitioning"],
          cons: ["Higher p99 than memory and compaction tuning", "Hot active users need cache"],
          when: "Durable longer timeline with Redis front cache",
        },
      ),
    ],
    operations: [
      "Failure: fan-out lag should not block posting; expose/monitor freshness and merge the author's own recent posts on read.",
      "Consistency: privacy, block, and delete rules require read-time authoritative/version filters until async removal converges.",
      "Scaling: shard timelines by user, follower lists by author+bucket, and events by author; batch multi-writes and multi-get hydration.",
      "Celebrity threshold: derive from projected fan-out cost and author frequency, then support hysteresis to avoid strategy flapping.",
      "Ranking degradation: fall back to chronological/heuristic results if feature or model service misses its deadline.",
      "Observability: fan-out lag, candidates per source, cache hit rate, hydration misses, rank latency, filtered-content rate, and feed freshness.",
    ],
    goNotes: [
      "Define CandidateSource interfaces and merge bounded result sets under one context deadline; cancel late optional sources.",
      "Use batch APIs for post hydration and follower/timeline writes to avoid RPC-per-item fan-out.",
      "Represent cursors as signed opaque versioned payloads; never let clients construct internal storage positions.",
      "Fan-out workers use idempotency key (recipient_id, post_id) and checkpoint follower buckets for safe retries.",
    ],
    answer: {
      opening:
        "I’ll make posts authoritative and timelines derived, then use hybrid fan-out because follower counts are heavily skewed.",
      beats: [
        "Quantify feed reads, post writes, and follower-driven write amplification.",
        "Walk post commit to fan-out and feed read to candidate merge/rank.",
        "Set a celebrity pull threshold and compare timeline stores.",
        "Keep privacy/delete correctness in the read path while projections converge.",
        "Explain cursoring, model fallback, fan-out lag, and hot-user scaling.",
      ],
      closing:
        "The system stays available because durable posts survive projection lag and the read path can merge/fallback safely.",
    },
    quiz: [
      q("feed-1", "Why use hybrid fan-out?", "Follower-count skew makes push efficient for normal authors but explosive for celebrities", "It guarantees strong global order", "It avoids ranking", "It stores no posts"),
      q("feed-2", "Why filter privacy and deletes at read time?", "Asynchronous inbox cleanup can lag, so current rules must still be enforced", "It improves compression", "Caches cannot delete", "Followers are immutable"),
      q("feed-3", "Why hydrate post IDs in batches?", "RPC-per-post would multiply latency and downstream QPS", "IDs contain no data", "Batches guarantee order", "It replaces caching"),
      q("feed-4", "What should happen if the ranker times out?", "Return a bounded chronological/heuristic fallback within the feed SLO", "Fail every feed request", "Retry forever", "Delete candidates"),
    ],
  }),
  makeHldLesson({
    slug: "observability-resilience",
    title: "Observability & Resilience",
    subtitle: "SLOs, telemetry pipelines, deadlines, retries, breakers, load shedding, and recovery.",
    difficulty: "intermediate",
    minutes: 50,
    tags: ["observability", "sre", "resilience", "slo"],
    prerequisites: ["system-design-foundations"],
    clarify: [
      "Which user-visible journeys need SLOs, and what latency/error/freshness thresholds define success?",
      "What failures are safe to retry, degrade, shed, or fail closed?",
      "What telemetry volume, retention, cardinality, and incident-query latency are required?",
    ],
    model: [
      "Metrics alert, traces explain request paths, and logs provide detailed evidence.",
      "An end-to-end deadline is a finite budget shared across every downstream hop.",
      "Resilience bounds failure amplification; it does not hide a permanently broken dependency.",
    ],
    architecture:
      "Applications emit structured logs to agents, metrics to regional collectors, and sampled traces through OpenTelemetry. Collectors batch, redact, and route telemetry to specialized stores; durable buffering protects short backend outages. An alerting service evaluates SLO burn rates and pages with runbook context. On the serving side, API gateways and Go services propagate deadlines, enforce concurrency limits, retry only retry-safe transient failures with jitter, trip circuit breakers, and degrade optional dependencies. Multi-zone deployment, tested backups, and automated rollback address infrastructure and release failures.",
    capacity: [
      { label: "Application load", value: "100K requests/s across 2K pods" },
      { label: "Traces", value: "1% baseline sample = 1K traces/s; tail sampling retains errors/slow requests" },
      { label: "Logs", value: "2 KB/request unfiltered would be 200 MB/s ≈ 17 TB/day—budget and sample intentionally" },
      { label: "Metrics", value: "2M active series × ~2 bytes/s compressed ≈ 4 MB/s; cardinality, not bytes, is main risk" },
      { label: "Retention", value: "Metrics 30 days, searchable logs 7 days, archive 90 days, traces 7 days by policy" },
      { label: "Error budget", value: "99.9% monthly SLO allows ~43.8 minutes equivalent total failure" },
    ],
    readPath:
      "During normal operations, dashboards query pre-aggregated metrics and exemplars link unusual points to traces, which link via trace_id to structured logs. During an incident, responders start from the user-facing SLI and narrow by region, version, dependency, and tenant—carefully avoiding unbounded high-cardinality queries. Runbooks expose recent deploys, saturation, queue lag, breaker states, and feature-flag changes. Telemetry query systems are operational dependencies but are not on the product request path.",
    writePath:
      "Request handlers record low-cardinality counters/histograms, attach trace context, and emit structured events without secrets. Local agents/collectors batch and compress; bounded disk/memory queues either shed low-priority telemetry or backpressure according to policy. Tail samplers retain rare errors and slow traces. Alert rules evaluate multi-window error-budget burn rather than page on every transient threshold crossing.",
    tradeoffs: [
      tradeoff(
        "Trace sampling",
        {
          label: "Head sampling",
          pros: ["Cheap decision at request start", "Predictable telemetry volume"],
          cons: ["May discard rare errors before outcome is known", "Low-rate endpoints can disappear"],
          when: "High-volume baseline tracing with simple budgets",
        },
        {
          label: "Tail sampling",
          pros: ["Retains errors, high latency, and interesting complete traces", "Better incident evidence"],
          cons: ["Collectors buffer entire traces and require consistent routing", "More infrastructure and memory"],
          when: "Large systems where rare bad requests matter most",
        },
      ),
      tradeoff(
        "Retry vs fast failure",
        {
          label: "Bounded retry with jitter",
          pros: ["Masks brief transient network/replica failures", "Can improve success rate within deadline"],
          cons: ["Consumes latency budget and amplifies downstream load", "Unsafe writes can duplicate effects"],
          when: "Idempotent operations with transient errors and spare deadline",
        },
        {
          label: "Circuit break / fail fast",
          pros: ["Protects a failing dependency and preserves caller resources", "Makes degradation predictable"],
          cons: ["Rejects calls that might have succeeded", "Threshold tuning and half-open probes matter"],
          when: "Sustained high failure or saturation",
        },
      ),
    ],
    operations: [
      "Failure: retry storms multiply load; cap attempts, add full jitter, honor Retry-After, and maintain one end-to-end deadline.",
      "Consistency: telemetry is usually at-least-once and eventually searchable; deduplicate audit events if exact counts matter.",
      "Scaling: aggregate metrics close to source, index only needed log fields, sample traces, and isolate tenant/query cardinality.",
      "Graceful degradation: define optional features and static/cached fallbacks before incidents; test them with dependency fault injection.",
      "Recovery: canary deploy, automated rollback, zone evacuation, backup restore drills, and capacity headroom are part of the design.",
      "Alerting: page on fast/slow error-budget burn and user impact; ticket capacity trends and noisy low-urgency symptoms.",
    ],
    goNotes: [
      "Start spans and pass context; attach bounded attributes such as route templates, not raw URLs/user IDs.",
      "Use errors.Is/As and typed retryability; do not retry every non-nil error.",
      "Use x/sync/semaphore or bounded worker pools for bulkheads, and expose queue wait separately from service time.",
      "Avoid time.After in hot retry loops when timers can be reused; always select on ctx.Done.",
    ],
    answer: {
      opening:
        "I’ll define user-facing SLIs and error budgets first, then design both the telemetry path and request-side failure containment.",
      beats: [
        "Estimate logs, metric series, traces, sampling, and retention.",
        "Draw context propagation through collectors and stores.",
        "Allocate deadlines and state exact retry conditions.",
        "Explain breakers, bulkheads, load shedding, and degraded modes.",
        "Close with burn-rate alerts and tested recovery procedures.",
      ],
      closing:
        "The system is operable because failures are bounded and every user-visible symptom can be connected to actionable evidence.",
    },
    quiz: [
      q("obs-1", "Why alert on SLO burn rate?", "It relates current errors to how quickly the user-facing error budget is being consumed", "It eliminates dashboards", "It measures CPU only", "It guarantees no false alerts"),
      q("obs-2", "Why can retries worsen an outage?", "They multiply work against an already failing or saturated dependency", "They remove deadlines", "They reduce QPS", "They disable logging"),
      q("obs-3", "What is a metric-cardinality risk?", "Unbounded label values create too many time series", "Metrics use numbers", "Histograms have buckets", "Counters increase"),
      q("obs-4", "What should happen to optional telemetry when its buffers fill?", "Apply an explicit shedding/sampling policy rather than exhausting application memory", "Spawn unlimited goroutines", "Block forever", "Crash silently"),
    ],
  }),
  makeHldLesson({
    slug: "video-streaming-hld",
    title: "HLD: Video Streaming Platform",
    subtitle: "Resumable uploads, transcoding, manifests, adaptive playback, CDN economics, and rights.",
    difficulty: "advanced",
    minutes: 70,
    tags: ["case-study", "video", "cdn", "media"],
    prerequisites: ["caching-cdn", "messaging-queues"],
    clarify: [
      "Is this on-demand upload, live streaming, or both, and what resolutions/codecs/devices are supported?",
      "What startup, rebuffer, availability, rights, DRM, moderation, and regional requirements apply?",
      "How many upload hours and viewing hours occur daily, at what average bitrates?",
    ],
    model: [
      "Separate heavy asynchronous ingest/transcode from bandwidth-heavy playback.",
      "Players fetch a small manifest then immutable media segments from CDN.",
      "Adaptive bitrate chooses the safest rendition segment by segment from measured throughput/buffer.",
    ],
    architecture:
      "An upload API issues multipart signed URLs so bytes travel directly to object storage. Completion commits video metadata and emits a transcode job. Workers probe, virus/moderation scan, transcode an encoding ladder, package CMAF/HLS/DASH segments, generate thumbnails/captions, and atomically publish a ready manifest. Playback API authorizes entitlement and returns a signed manifest URL; CDN edges serve manifests and immutable segments through an origin shield backed by object storage. QoE events stream asynchronously for startup/rebuffer/error analytics and encoding optimization.",
    diagram: {
      kind: "video-arch",
      title: "Upload, transcode, and playback planes",
      caption: "Compute-heavy ingest publishes immutable renditions; playback bytes are served primarily by CDN.",
    },
    capacity: [
      { label: "Uploads", value: "1M hours/day source video × 8 Mb/s ≈ 3.6 PB/day raw ingress" },
      { label: "Renditions", value: "Encoding ladder averages ~1.8× source bytes after codec mix ≈ 6.5 PB/day before retention policy" },
      { label: "Viewing", value: "100M viewing hours/day × 4 Mb/s average ≈ 180 PB/day delivered" },
      { label: "Peak egress", value: "10× average viewing concurrency implies multi-terabit/s; CDN is mandatory" },
      { label: "Transcode compute", value: "1M source hours/day; at 2× realtime aggregate, ~83K concurrent worker-equivalents" },
      { label: "QoE SLO", value: "Playback start p95 <2 s, rebuffer ratio <1%, manifest availability 99.99%" },
    ],
    readPath:
      "The client requests playback authorization with video/device/region. The service checks publication, entitlement, geo/age/DRM policy and signs a short-lived manifest URL. The player fetches the manifest from CDN, selects an initial conservative rendition, and downloads 2–6 second segments. CDN misses go through shield to object storage. The player estimates bandwidth and buffer, switching renditions only at segment boundaries, refreshes live manifests if applicable, and batches QoE telemetry off the playback path.",
    writePath:
      "The creator initializes upload, receives multipart URLs, sends chunks directly, and completes with checksums. The API verifies object metadata and commits an ingest record idempotently. A workflow fans out independent transcode/caption/thumbnail jobs, retries safely, validates output, and publishes the manifest only when minimum viable renditions exist. Failed optional renditions can finish later. Deletion writes a tombstone, revokes playback, purges manifests, and asynchronously expires segments under retention policy.",
    tradeoffs: [
      tradeoff(
        "CDN population",
        {
          label: "Pull CDN",
          pros: ["Only watched segments occupy edge space", "Simple for a huge long-tail catalog"],
          cons: ["First viewer pays miss latency and origin load", "Viral premieres can stampede shield/origin"],
          when: "On-demand catalogs with unpredictable popularity",
        },
        {
          label: "Pre-warm/push selected content",
          pros: ["Predictable launch latency and origin protection", "Useful for scheduled live/premiere traffic"],
          cons: ["Consumes bandwidth/storage for possibly cold segments", "Requires popularity and placement planning"],
          when: "Known releases, live events, and top regional content",
        },
      ),
      tradeoff(
        "Encoding strategy",
        {
          label: "Fixed bitrate ladder",
          pros: ["Operationally simple and outputs are predictable", "Easy device compatibility testing"],
          cons: ["Wastes bits on easy content and harms complex scenes", "Storage/compute spent on unused renditions"],
          when: "MVP or homogeneous short content",
        },
        {
          label: "Per-title/content-aware ladder",
          pros: ["Better quality per byte and CDN cost", "Avoids unnecessary renditions"],
          cons: ["Extra analysis/encoding complexity and delayed publish", "Harder capacity prediction"],
          when: "Large viewing volume where egress savings dominate compute",
        },
      ),
      tradeoff(
        "Upload processing",
        {
          label: "Synchronous transcode",
          pros: ["Simple ready/not-ready response for tiny clips", "No workflow status polling"],
          cons: ["Request timeouts and poor compute utilization", "Large files make it impossible"],
          when: "Only very small bounded media",
        },
        {
          label: "Asynchronous workflow",
          pros: ["Durable retries, elastic workers, and per-rendition progress", "Upload API remains fast"],
          cons: ["Pending state and workflow orchestration", "Duplicate job/output idempotency required"],
          when: "Normal production video ingest",
        },
      ),
    ],
    operations: [
      "Failure: publish manifests atomically only after referenced segments exist; never expose partially written playlists.",
      "Consistency: metadata may say processing while jobs converge; ready transition is monotonic and idempotent by video/version/rendition.",
      "Scaling: partition jobs by codec/resolution/GPU need, autoscale on queued media duration rather than job count, and reserve premiere capacity.",
      "Origin protection: use shield, request coalescing, immutable segment names, tiered storage, and pre-warm only predicted hot objects.",
      "Rights/security: signed short URLs, key service/DRM, geo policy, watermarking where needed, and rapid manifest revocation.",
      "Observability: upload success, queue age in media minutes, encode realtime factor, CDN hit/egress, startup time, rebuffer, and fatal player errors.",
    ],
    goNotes: [
      "Stream upload metadata/checksums; video bytes should bypass Go API servers through signed multipart object-store URLs.",
      "Make workflow task keys deterministic (video_version, rendition, segment range) so retries overwrite or reuse safe outputs.",
      "Use io.Reader/io.Writer streaming and bounded buffers; never read multi-GB objects into memory.",
      "Separate ingest command, workflow status, playback authorization, and QoE ingestion APIs with distinct scaling/SLOs.",
    ],
    answer: {
      opening:
        "I’ll separate upload/transcode from playback, quantify hours and bitrate, then design for nearly all viewing bytes to come from CDN.",
      beats: [
        "Walk resumable direct upload and idempotent workflow publication.",
        "Explain encoding ladder, manifests, segments, and player ABR.",
        "Compare pull CDN with pre-warming and fixed with per-title ladders.",
        "Handle partial transcodes, viral origin load, deletion, DRM, and regional rights.",
        "Scale compute by queued media duration and measure QoE, not only server latency.",
      ],
      closing:
        "Object storage is durable origin, CDN is the delivery plane, and manifests are the small consistency boundary joining them.",
    },
    quiz: [
      q("video-1", "Why upload directly to object storage?", "It removes huge media bytes from API servers while retaining authorized multipart control", "It skips validation", "It avoids checksums", "It transcodes instantly"),
      q("video-2", "What does adaptive bitrate change?", "The rendition selected for upcoming segments based on bandwidth and buffer", "The original upload", "The CDN provider per byte", "The video duration"),
      q("video-3", "Why publish a manifest atomically?", "Players must not receive references to missing or incomplete segments", "Manifests are large", "It increases bitrate", "It removes DRM"),
      q("video-4", "What is the best autoscaling signal for transcoders?", "Queued media duration weighted by expected processing cost", "Only job count", "HTTP QPS", "CDN cache hits"),
    ],
  }),
  makeHldLesson({
    slug: "ride-sharing-hld",
    title: "HLD: Ride-Sharing Dispatch",
    subtitle: "Location ingestion, geospatial search, atomic offers, trip state, ETA, surge, and regional cells.",
    difficulty: "advanced",
    minutes: 70,
    tags: ["case-study", "ride-sharing", "geospatial", "matching"],
    prerequisites: ["messaging-queues", "cap-consistency"],
    clarify: [
      "Are we designing rider request/dispatch only or full trip, pricing, navigation, and payment?",
      "How frequently do drivers report location, how stale may candidates be, and how large is a dispatch region?",
      "What matching fairness, cancellation, accessibility, pooling, and safety requirements apply?",
    ],
    model: [
      "Driver location is high-rate ephemeral state; trip assignment is durable correctness-critical state.",
      "Geo cells produce candidates, ETA ranks them, and a conditional claim prevents double assignment.",
      "Partition by city/region because rides are geographically local; handle border overlap explicitly.",
    ],
    architecture:
      "Driver apps stream GPS through regional gateways to a location service that validates sequence/time, map-matches, and updates an in-memory geo index with TTL. Rider requests enter a durable trip service and dispatch event. A matcher queries expanding geo cells, batch-calls ETA, filters eligibility, and sends time-bounded offers. Driver acceptance performs a compare-and-swap on driver availability and trip state, then notifies both clients through realtime/push channels. Trip events form an auditable state machine; pricing/surge reads aggregate supply-demand cells, while payments run after trip completion.",
    diagram: {
      kind: "ride-arch",
      title: "Location and dispatch architecture",
      caption: "Ephemeral GPS feeds candidate search; durable trip state and atomic driver claims establish assignments.",
    },
    capacity: [
      { label: "Drivers", value: "5M online peak, GPS every 4 s → 1.25M location updates/s" },
      { label: "Ride requests", value: "50M trips/day ≈ 580/s average; city peaks ~10× → 6K/s global" },
      { label: "Location ingress", value: "1.25M/s × 120 B ≈ 150 MB/s before protocol/replication" },
      { label: "Geo memory", value: "5M drivers × ~300 B index/state ≈ 1.5 GB raw; replicas/headroom ~6–10 GB" },
      { label: "Matching amplification", value: "6K requests/s × 50 ETA candidates ≈ 300K route estimates/s; batch/approximate first" },
      { label: "SLO", value: "Candidate search p99 <200 ms; first offer <2 s; assignment <10 s; location freshness <10 s" },
    ],
    readPath:
      "A ride request queries the rider's geo cell plus expanding neighbors for online, eligible, fresh drivers. Cheap straight-line/cell distance prunes candidates, then an ETA service batch-ranks a small set using roads/traffic. The matcher excludes drivers with active offers or trips and applies product constraints. Rider and driver read current trip state by trip_id from the durable store; location streams remain approximate and clients interpolate between updates.",
    writePath:
      "Driver GPS updates carry driver_id, device sequence, observed time, coordinates, heading, and accuracy. The location service drops stale/out-of-order updates and refreshes TTL in the owning regional cell. Ride creation writes REQUESTED plus idempotency key. Dispatch offers use expirations; acceptance runs one transaction/conditional updates from AVAILABLE→RESERVED and REQUESTED/OFFERED→MATCHED with an offer token. Every transition emits an outbox event; duplicate accepts return the existing result.",
    tradeoffs: [
      tradeoff(
        "Geo index",
        {
          label: "Redis GEO / managed in-memory index",
          pros: ["Fast launch and radius queries", "Built-in expiry/replication options"],
          cons: ["Memory/network bound at very high GPS rates", "Custom cell balancing and multi-region control are limited"],
          when: "City-scale MVP or moderate fleet",
        },
        {
          label: "Dedicated S2/H3 cell service",
          pros: ["Explicit partition ownership and tuned in-memory structures", "Natural regional/cell streaming"],
          cons: ["Significant implementation and operational complexity", "Rebalancing/border correctness are yours"],
          when: "Global high-rate fleet and custom dispatch requirements",
        },
      ),
      tradeoff(
        "Matching policy",
        {
          label: "Sequential nearest-driver offers",
          pros: ["Simple, fast first offer, and easy driver UX", "Low compute per request"],
          cons: ["Locally optimal and can increase fleet-wide pickup time", "Repeated rejections add tail latency"],
          when: "Sparse markets or MVP",
        },
        {
          label: "Short batch/auction matching",
          pros: ["Optimizes across riders/drivers and fairness constraints", "Better dense-market utilization"],
          cons: ["Adds a deliberate 1–5 second window", "Complex objective and explanation"],
          when: "Dense cities where global efficiency outweighs a small delay",
        },
      ),
      tradeoff(
        "Offer consistency",
        {
          label: "Single exclusive offer",
          pros: ["No competing accepts and simple assignment", "Predictable driver experience"],
          cons: ["Slow/rejecting drivers increase rider wait", "Lower matching parallelism"],
          when: "High driver responsiveness",
        },
        {
          label: "Limited parallel offers + atomic winner",
          pros: ["Reduces match tail latency", "Tolerates offline/stale candidates"],
          cons: ["Losing drivers see withdrawn offers", "Atomic claim and fairness rules are essential"],
          when: "High rejection/timeout markets with carefully bounded fan-out",
        },
      ),
    ],
    operations: [
      "Failure: GPS loss lets TTL expire driver availability; trip state remains durable and clients show last-known location with age.",
      "Consistency: driver/trip claim requires linearizable conditional writes or one partition owner; geo presence can be eventual.",
      "Scaling: partition by operational region and S2/H3 cell, replicate border cells, and keep a driver owned by exactly one writer epoch.",
      "Hot events: stadiums create dense cells and dispatch bursts; split subcells, cap candidate scans, preposition capacity, and queue fairly.",
      "State machine: validate legal transitions, persist actor/time/reason, and reconcile driver availability against active trips.",
      "Observability: GPS freshness, cell skew, candidate counts, ETA latency/error, offer acceptance, match time, claim conflicts, and cancellations.",
    ],
    goNotes: [
      "Use streaming RPC with bounded per-driver update coalescing; newest GPS supersedes queued older updates.",
      "Model trip transitions as explicit commands with expected version, not ad hoc field updates.",
      "Batch ETA requests and impose a sub-deadline; fall back to approximate distance if the route service is slow.",
      "Keep location, dispatch, trip, pricing, and notification boundaries separate because their consistency and scale differ.",
    ],
    answer: {
      opening:
        "I’ll separate million-per-second ephemeral GPS from low-rate durable trip transitions, then make the final driver claim atomic.",
      beats: [
        "Estimate location ingestion, geo memory, ride QPS, and ETA amplification.",
        "Walk GPS update, candidate expansion, ETA ranking, offer, and conditional acceptance.",
        "Compare managed GEO with cell ownership and sequential with batch matching.",
        "Handle stale locations, double accepts, cell borders, stadium hotspots, and failover fencing.",
        "Close with trip state machine, surge as derived data, and safety observability.",
      ],
      closing:
        "Approximate location finds candidates quickly; one strongly consistent transition determines the real assignment.",
    },
    quiz: [
      q("ride-1", "Why keep GPS state separate from trip state?", "GPS is high-churn and approximate while assignment must be durable and consistent", "GPS cannot be stored", "Trips never update", "They use different clients"),
      q("ride-2", "What prevents two riders from winning the same driver?", "A conditional atomic AVAILABLE→RESERVED claim tied to the offer", "Nearest-distance sorting", "A cache TTL", "Push notification"),
      q("ride-3", "Why prune before calling ETA routing?", "Detailed routes for every nearby driver would multiply expensive computation", "ETA cannot batch", "Distance is exact", "Cells provide payment"),
      q("ride-4", "What happens when driver GPS stops?", "Its geo availability expires by TTL while durable trip state remains", "The trip is deleted", "Every rider retries GPS", "The cell becomes permanent"),
    ],
  }),
  makeHldLesson({
    slug: "payment-system-hld",
    title: "HLD: Payment Processing System",
    subtitle: "Idempotent intents, double-entry ledgers, processor uncertainty, webhooks, reconciliation, and compliance.",
    difficulty: "advanced",
    minutes: 75,
    tags: ["case-study", "payments", "ledger", "idempotency"],
    prerequisites: ["cap-consistency", "messaging-queues", "databases-scaling"],
    clarify: [
      "Are we processing card charges only, or also wallets, refunds, payouts, FX, and marketplace splits?",
      "Who is merchant of record, which currencies/regions, and what PCI/fraud/regulatory boundaries apply?",
      "What guarantees do clients expect under retries, timeouts, duplicate webhooks, and processor outages?",
    ],
    model: [
      "A payment intent is a state machine; an API timeout never proves the processor did nothing.",
      "Money movement is recorded as immutable balanced ledger postings, not a mutable balance alone.",
      "Idempotency, webhooks, polling, and reconciliation close different uncertainty windows.",
    ],
    architecture:
      "Clients create payment intents through an authenticated API with idempotency keys. The payment service stores intent and request result, invokes a tokenized external processor through a connector, and records pending/authorized/captured/failed transitions. A ledger service atomically writes double-entry postings for economic events. Processor webhooks enter a verified idempotent inbox; a reconciliation service compares processor settlement reports with internal intents/ledger and opens exceptions. Fraud/risk evaluates before irreversible operations. An outbox drives receipts and merchant notifications; raw card data is isolated in a PCI vault/provider.",
    diagram: {
      kind: "payment-arch",
      title: "Intent, processor, ledger, and reconciliation",
      caption: "Synchronous responses can be ambiguous; durable state, webhooks, and reconciliation converge on financial truth.",
    },
    capacity: [
      { label: "Transactions", value: "100M payment operations/day ≈ 1.16K/s average; 10× peak ≈ 11.6K/s" },
      { label: "Ledger writes", value: "Average 4 postings/operation → ~46K postings/s peak" },
      { label: "Storage", value: "100M/day × (intent 1 KB + postings 2 KB + audit 1 KB) ≈ 400 GB/day raw" },
      { label: "Processor calls", value: "11.6K/s peak, but provider/account rate limits require routing, queues, and backpressure" },
      { label: "Latency", value: "Intent API p99 <500 ms excluding customer authentication; pending is a valid response" },
      { label: "Correctness", value: "Zero tolerated duplicate economic effect; reconciliation exceptions tracked to closure" },
    ],
    readPath:
      "GET /payment-intents/{id} reads the intent state and latest version, scoped to merchant/customer. Balance queries read materialized account balances derived transactionally from immutable postings or from a versioned projection, with ledger entries available for audit. Clients poll or receive signed merchant webhooks and treat pending as normal. Financial reports use settled ledger dates and processor reconciliation, not only API request timestamps.",
    writePath:
      "POST with merchant+idempotency_key first inserts or returns the stored request fingerprint/result. The service validates amount/currency, runs risk, writes intent PENDING and outbox, then calls the processor with a stable provider idempotency key. A success response conditionally transitions state and posts balanced ledger entries; a timeout stays PENDING/UNKNOWN and triggers status lookup, never a new charge. Verified webhooks dedupe provider event ID and apply legal monotonic transitions. Refunds are new linked intents/postings, not edits to history.",
    tradeoffs: [
      tradeoff(
        "Financial state",
        {
          label: "Mutable balance only",
          pros: ["Simple point reads", "Few rows for prototypes"],
          cons: ["Weak auditability and hard correction history", "Concurrency bugs silently create drift"],
          when: "Not appropriate as the sole source for real money",
        },
        {
          label: "Double-entry append-only ledger",
          pros: ["Every transaction balances and is auditable", "Corrections are explicit reversals"],
          cons: ["More schema, postings, and accounting concepts", "Materialized balance/reconciliation needed"],
          when: "Default for production financial systems",
        },
      ),
      tradeoff(
        "Processor integration",
        {
          label: "Synchronous result as truth",
          pros: ["Simple happy-path UI", "Immediate final response when provider is healthy"],
          cons: ["Lost responses create UNKNOWN outcomes", "Cannot handle delayed authentication/settlement correctly"],
          when: "Never as the only truth source",
        },
        {
          label: "Intent + webhook/poll + reconcile",
          pros: ["Converges despite timeout, duplicate, and delayed provider events", "Explicit pending UX"],
          cons: ["More states and asynchronous operations", "Webhook security and out-of-order handling"],
          when: "Production processor integration",
        },
      ),
      tradeoff(
        "Processor topology",
        {
          label: "Single processor",
          pros: ["Simpler integration, reconciliation, and commercial operations", "Consistent token model"],
          cons: ["Provider outage/rate limit is systemic", "Less regional/payment-method coverage"],
          when: "Early product with acceptable provider dependence",
        },
        {
          label: "Multi-processor orchestration",
          pros: ["Regional methods, cost routing, and resilience", "Merchant failover options"],
          cons: ["Tokens, behavior, disputes, and reconciliation differ", "Retrying across providers risks double charge"],
          when: "Large global volume with carefully fenced routing before submission",
        },
      ),
    ],
    operations: [
      "Failure: processor timeout produces UNKNOWN/PENDING; query with the same provider key before any resubmission.",
      "Consistency: intent state and ledger postings require transactional/serialized transitions; notifications and reports can lag.",
      "Ordering: webhook events may duplicate and arrive out of order; validate allowed transitions and compare provider versions/timestamps cautiously.",
      "Scaling: shard merchants/accounts while keeping one transaction's postings co-located; sequence account postings and isolate hot merchants.",
      "Reconciliation: ingest settlement files/API records, match by provider IDs/amount/currency, and route unmatched/different items to an exception workflow.",
      "Security: tokenize PAN, minimize PCI scope, encrypt secrets, sign webhooks, separate duties, audit access, and never log sensitive payment data.",
      "Observability: approval/decline by reason, UNKNOWN age, idempotency conflicts, webhook lag, ledger imbalance (must be zero), and reconcile exceptions.",
    ],
    goNotes: [
      "Represent money as integer minor units plus ISO currency; never float64, and validate currency-specific scale.",
      "Persist an idempotency request hash and original response; reject reuse of the same key with different parameters.",
      "Use explicit state-transition methods with optimistic version checks and transactional ledger writes.",
      "Connector interfaces normalize transport but preserve provider-specific IDs/status/raw evidence for audit and reconciliation.",
      "Redact structured logs by construction and keep PCI-bearing types out of general service packages.",
    ],
    answer: {
      opening:
        "I’ll start with idempotent payment intents and an append-only double-entry ledger, then design explicitly for ambiguous processor outcomes.",
      beats: [
        "Quantify operation and posting rates; define amount/currency and state machine.",
        "Walk create, risk, provider timeout, webhook, ledger posting, and client status.",
        "Explain why timeout stays pending and why refunds are reversing/new entries.",
        "Compare one versus multiple processors without unsafe cross-provider retries.",
        "Close with reconciliation, PCI boundary, audit, and zero-imbalance monitoring.",
      ],
      closing:
        "No network response alone moves money twice: stable identities and balanced durable transitions establish the financial record.",
    },
    quiz: [
      q("pay-1", "What should a service do after an ambiguous processor timeout?", "Keep the intent pending/unknown and query using the same provider idempotency key", "Submit a fresh charge immediately", "Mark success", "Delete the intent"),
      q("pay-2", "Why use double-entry postings?", "Each economic event has balanced debits and credits that can be audited", "It halves storage", "It avoids transactions", "It uses floating point"),
      q("pay-3", "What should happen if one idempotency key is reused with different parameters?", "Reject it as a conflict rather than returning or creating a different payment", "Create both", "Ignore amount", "Change the key server-side"),
      q("pay-4", "Why is reconciliation still needed?", "Provider and internal records can diverge despite APIs/webhooks, so independent comparison catches exceptions", "It improves CDN hits", "It replaces the ledger", "It creates cards"),
    ],
  }),
  makeHldLesson({
    slug: "search-autocomplete-hld",
    title: "HLD: Search Autocomplete",
    subtitle: "Low-latency prefix serving, offline builds, streaming trends, personalization, safety, and rollout.",
    difficulty: "intermediate",
    minutes: 60,
    tags: ["case-study", "search", "autocomplete", "ranking"],
    prerequisites: ["tries-and-bitmask", "caching-cdn"],
    clarify: [
      "Prefix-only or typo tolerant, global or personalized, and which languages/locales?",
      "What latency, freshness, safety, privacy, and update-frequency targets apply?",
      "How many unique queries, requests per keystroke, result count, and regions?",
    ],
    model: [
      "Precompute top candidates per prefix; never scan the corpus on each keystroke.",
      "Serve immutable index snapshots from memory and atomically swap versions.",
      "Blend a small realtime trend/personal layer into safe global candidates.",
    ],
    architecture:
      "Clients debounce and cancel stale autocomplete requests at the edge. Regional stateless serving replicas load a compressed trie/FST snapshot whose prefix states reference top-K global candidate IDs. A small in-memory trend index and privacy-safe recent-user store contribute additional candidates. The service merges, filters policy/locale, lightly reranks, and returns in single-digit milliseconds. Offline pipelines aggregate consented query logs, normalize language, remove low-frequency/private/unsafe terms, score by frequency/recency/quality, build and validate a versioned snapshot, then roll it out canary and atomically swap.",
    capacity: [
      { label: "Traffic", value: "200M search users × 20 sessions/day × 5 emitted prefixes ≈ 20B requests/day" },
      { label: "QPS", value: "≈231K/s average; 4× peak ≈ 925K/s across regions" },
      { label: "Bandwidth", value: "925K/s × 1 KB response ≈ 925 MB/s, edge compression/cache matters" },
      { label: "Corpus", value: "500M accepted unique queries × ~40 B text/metadata ≈ 20 GB before trie/FST overhead" },
      { label: "Serving memory", value: "Compressed shard/snapshot ~30–80 GB per locale family; replicate regionally" },
      { label: "SLO", value: "Service p99 <20 ms, end-to-end <100 ms; global index freshness <1 h, trends <2 min" },
    ],
    readPath:
      "The client waits roughly 80–150 ms after typing, cancels older requests, and sends normalized prefix plus locale and opaque user context. Edge caching handles anonymous common prefixes. A regional server traverses the FST/trie in O(prefix bytes/runes), fetches precomputed candidates, merges a bounded trend and recent-history set, applies safety/availability filters, reranks perhaps 50 items, and returns top 10 with snapshot version. Empty/very short prefixes use stricter thresholds to avoid huge, sensitive candidate sets.",
    writePath:
      "Accepted final searches produce consented, privacy-filtered events rather than every raw keystroke. Batch jobs aggregate counts with minimum-frequency thresholds, decayed recency, locale, quality, and block lists. Builders produce deterministic immutable artifacts, run quality/safety and memory/latency tests, upload to object storage, and publish a signed manifest. Replicas download, checksum, memory-map/load, warm, then atomically switch pointers; rollback selects the previous manifest. Trends update a bounded side index with aggressive expiry.",
    tradeoffs: [
      tradeoff(
        "Serving structure",
        {
          label: "Trie with top-K per node",
          pros: ["Simple O(prefix length) lookup", "Straightforward incremental reasoning"],
          cons: ["Pointer-heavy memory and duplicated top-K lists", "Large multilingual alphabets are expensive"],
          when: "Moderate corpus or implementation simplicity",
        },
        {
          label: "Compressed FST/DAWG",
          pros: ["Excellent memory sharing/compression and cache locality", "Large read-only corpus fits fewer machines"],
          cons: ["Complex build/update pipeline", "Usually immutable rather than in-place update"],
          when: "Very large global corpus with snapshot deployment",
        },
      ),
      tradeoff(
        "Index freshness",
        {
          label: "Frequent full snapshots",
          pros: ["One simple immutable serving path", "Deterministic rollback and consistency"],
          cons: ["Build/network cost and freshness floor", "Large rollouts consume memory headroom"],
          when: "Hourly global popularity updates",
        },
        {
          label: "Base snapshot + realtime delta",
          pros: ["Captures breaking trends in minutes", "Small incremental stream"],
          cons: ["Merge complexity and abuse sensitivity", "Delta must be bounded/expired"],
          when: "Products where current events materially affect suggestions",
        },
      ),
      tradeoff(
        "Personalization",
        {
          label: "Server-side recent-history blend",
          pros: ["Consistent across devices and easy to rank centrally", "Can combine account preferences"],
          cons: ["Privacy, storage, and request-key cache fragmentation", "Adds a dependency"],
          when: "Signed-in opt-in users with cross-device value",
        },
        {
          label: "Client-side local blend",
          pros: ["Strong privacy and no server history lookup", "Works offline and adds no serving latency"],
          cons: ["Logic differs by client and no cross-device sync", "Harder centralized quality evaluation"],
          when: "Privacy-first or simple recent searches",
        },
      ),
    ],
    operations: [
      "Failure: keep the previous snapshot loaded until the new one validates; if personalization/trends fail, serve global candidates.",
      "Consistency: one response uses one immutable snapshot pointer; eventual index freshness is reported by version/build time.",
      "Scaling: shard by locale/prefix only if a full compressed snapshot no longer fits; replicate hot locales and edge-cache anonymous prefixes.",
      "Hot keys: empty and one-character prefixes dominate; require debounce/minimum length, precompute aggressively, and rate-limit abuse.",
      "Safety/privacy: minimum-count thresholds, normalization, PII detection, block lists, child-safety rules, and no raw query logging by default.",
      "Observability: p50/p99 by prefix length/locale, zero-result rate, index version spread, memory, canceled requests, unsafe-filter rate, and CTR quality.",
    ],
    goNotes: [
      "Load a new immutable Index behind an interface, validate it, then swap an atomic.Pointer; readers avoid locks and see one version.",
      "Use bounded candidate slices and preallocated buffers; a per-keystroke endpoint cannot tolerate allocation-heavy scans.",
      "Propagate cancellation because users type again quickly; stop personalization work when the request context is done.",
      "Keep build pipeline artifact schemas versioned and make old serving binaries reject unsupported formats safely.",
    ],
    answer: {
      opening:
        "Autocomplete is a read-only latency problem, so I’ll precompute safe top-K prefix candidates and deploy immutable regional snapshots.",
      beats: [
        "Estimate requests from keystrokes, bandwidth, corpus memory, and p99 budget.",
        "Walk prefix lookup, bounded merge, filter, and rerank.",
        "Compare trie with FST and snapshot-only with realtime delta.",
        "Explain atomic rollout/rollback and degradation without personalization.",
        "Address short-prefix hotspots, privacy, trends abuse, and client debounce.",
      ],
      closing:
        "The serving path remains O(prefix length plus a small candidate set); expensive learning and aggregation stay offline.",
    },
    quiz: [
      q("ac-1", "Why precompute top-K candidates per prefix state?", "It avoids scanning and ranking a large corpus on every keystroke", "It guarantees perfect relevance", "It removes normalization", "It stores user passwords"),
      q("ac-2", "Why keep the old index during rollout?", "A failed or corrupt new snapshot can be rejected or rolled back without outage", "It doubles QPS", "It sorts prefixes", "It is required by HTTP"),
      q("ac-3", "What should happen if realtime trends fail?", "Serve the immutable global snapshot with reduced freshness", "Fail every request", "Return raw logs", "Rebuild synchronously"),
      q("ac-4", "Why are one-character prefixes dangerous?", "They are extremely hot and match huge candidate spaces", "They cannot be UTF-8", "They always contain PII", "They bypass caches"),
    ],
  }),
  makeHldLesson({
    slug: "notification-system-hld",
    title: "HLD: Notification System",
    subtitle: "Preferences, templates, fan-out, channel providers, scheduling, deduplication, and delivery feedback.",
    difficulty: "advanced",
    minutes: 65,
    tags: ["case-study", "notifications", "email", "push"],
    prerequisites: ["messaging-queues", "rate-limiter-hld"],
    clarify: [
      "Which channels—push, email, SMS, in-app, webhook—and which transactional versus marketing guarantees?",
      "What preferences, quiet hours, locale, scheduling, priority, batching, and legal opt-out rules apply?",
      "Is success provider acceptance, device delivery, user read, or business conversion?",
    ],
    model: [
      "Accept intent durably, resolve recipients/preferences/templates, then deliver through channel-specific queues.",
      "At-least-once events require one notification identity and idempotent provider sends where supported.",
      "Transactional traffic gets isolated capacity from bulk campaigns.",
    ],
    architecture:
      "Product services publish notification intents through an API/outbox. An orchestrator validates schema, stores notification_id and audience, resolves user preferences/locale/quiet hours, renders a versioned template, and expands recipients in bounded batches. A priority scheduler writes channel jobs to isolated queues. Email, SMS, push, in-app, and webhook workers enforce channel/provider limits, choose a provider, send with stable keys, and record attempts. Provider callbacks update delivered/bounced/failed states; a preference service owns consent and suppression lists. Campaign analytics consume events independently.",
    diagram: {
      kind: "chat-arch",
      title: "Fan-out to realtime and offline channels",
      caption: "The chat-style gateway diagram maps naturally to notification routing: durable events fan out through channel-specific delivery edges.",
    },
    capacity: [
      { label: "Volume", value: "5B notifications/day ≈ 58K/s average; campaigns peak at 500K/s intents" },
      { label: "Fan-out", value: "One campaign may target 100M users; expand in resumable batches, never one transaction" },
      { label: "Payload/events", value: "500K/s × 1 KB job ≈ 500 MB/s burst before broker compression/batching" },
      { label: "Providers", value: "Email 200K/s, push 300K/s, SMS 20K/s aggregate contracted limits" },
      { label: "State", value: "5B/day × 500 B attempt metadata ≈ 2.5 TB/day; apply retention/tiering" },
      { label: "SLO", value: "Transactional p99 accepted <200 ms and delivered <30 s; campaign completion in hours" },
    ],
    readPath:
      "Users read in-app notifications from a per-user timeline ordered by creation/id with unread cursor/count projection. Support and product services query notification_id to see intent, rendered template version, attempts, provider IDs, and terminal state. Preferences are read through a strongly consistent or read-your-writes path for user changes; workers cache versioned preference snapshots briefly but must honor suppression updates within the compliance SLO.",
    writePath:
      "POST /notifications with idempotency key stores intent and returns accepted without waiting for providers. The orchestrator chooses recipients and writes deterministic jobs such as (notification_id,user_id,channel). Workers recheck current preference/suppression, render or use frozen content according to campaign semantics, acquire provider/tenant rate tokens, send, and atomically record provider request ID. Retries preserve the same logical key. Callbacks verify signatures and dedupe event IDs before state transitions.",
    tradeoffs: [
      tradeoff(
        "Rendering time",
        {
          label: "Render at enqueue",
          pros: ["Delivery workers are simple and deterministic", "Template changes cannot alter queued content"],
          cons: ["Large fan-out stores duplicated rendered bodies", "Late preference/profile updates are missed"],
          when: "Compliance-sensitive exact campaign content or small transactional volume",
        },
        {
          label: "Render at delivery",
          pros: ["Uses latest profile/preferences and stores compact jobs", "Supports channel fallback dynamically"],
          cons: ["Template/profile dependencies enter the delivery path", "Retries across template changes need version pinning"],
          when: "High fan-out with versioned templates and resilient profile access",
        },
      ),
      tradeoff(
        "Provider strategy",
        {
          label: "Single provider per channel",
          pros: ["Simple integration, deliverability tuning, and reconciliation", "Higher volume concentration"],
          cons: ["Provider outage/rate limit blocks the channel", "Regional coverage may be weak"],
          when: "Early scale with acceptable dependency risk",
        },
        {
          label: "Multi-provider routing",
          pros: ["Failover, regional reach, and cost optimization", "Can isolate sender reputations"],
          cons: ["Duplicate risk on ambiguous failover", "Callbacks/status vocabularies differ"],
          when: "Critical global delivery with provider-specific idempotency/fencing",
        },
      ),
      tradeoff(
        "Preference enforcement",
        {
          label: "Snapshot at campaign start",
          pros: ["Reproducible audience and efficient fan-out", "No preference lookup per delivery"],
          cons: ["Recent opt-outs may still receive messages", "Unsafe for strict compliance"],
          when: "Non-sensitive internal notifications with a defined snapshot contract",
        },
        {
          label: "Recheck immediately before send",
          pros: ["Honors current opt-outs and quiet hours", "Correct compliance boundary"],
          cons: ["Adds read load and latency", "Cache invalidation/versioning required"],
          when: "Marketing email/SMS and regulated preferences",
        },
      ),
    ],
    operations: [
      "Failure: provider timeout is ambiguous; query status or retry with the same provider key before switching providers.",
      "Consistency: user opt-out and suppression must beat stale campaign state; recheck/version at final delivery boundary.",
      "Scaling: split queues by priority/channel/region, batch audience expansion, shard by recipient, and isolate noisy tenants/campaigns.",
      "Backpressure: pause bulk campaigns when transactional queue age rises; reserve provider quota and workers for critical traffic.",
      "Retries: classify permanent addresses/opt-outs from transient provider failures; use delayed queues, caps, and DLQ inspection.",
      "Observability: intent-to-send/deliver latency, provider acceptance/bounce, preference suppression, queue age, dedupe, and campaign progress.",
    ],
    goNotes: [
      "Define a channel Adapter interface but preserve provider-specific IDs and error categories for status lookup and safe retries.",
      "Use deterministic JobID and a unique attempt transition; do not assume broker exactly-once semantics.",
      "Bound template rendering and provider call concurrency independently with per-tenant fairness.",
      "Treat templates as versioned data with typed variables validated before acceptance; escape output for each channel.",
    ],
    answer: {
      opening:
        "I’ll make notification intent durable first, then separate preference/rendering orchestration from channel delivery and provider feedback.",
      beats: [
        "Classify transactional versus campaign SLOs and estimate fan-out/provider limits.",
        "Walk intent, recipient expansion, preference check, template, queue, send, and callback.",
        "Isolate priority capacity and compare rendering/provider choices.",
        "Explain idempotency under timeout and final opt-out enforcement.",
        "Close with retries, DLQ, campaign progress, and delivery semantics.",
      ],
      closing:
        "The API promises durable acceptance; channel-specific status and user-visible delivery converge asynchronously without sacrificing consent.",
    },
    quiz: [
      q("notify-1", "Why recheck preferences before marketing delivery?", "A user may opt out after campaign expansion, and current consent must win", "It improves template grammar", "Queues cannot store users", "Providers require SQL"),
      q("notify-2", "Why isolate transactional and campaign queues?", "Bulk fan-out must not consume the latency/capacity reserved for urgent messages", "They use different bytes", "Campaigns never retry", "Transactions have no templates"),
      q("notify-3", "What does provider acceptance mean?", "The provider accepted responsibility; it may not prove device delivery or user read", "The user read it", "Billing completed", "The email is correct"),
      q("notify-4", "How should ambiguous provider timeout be handled?", "Reuse stable identity and check/retry safely before failover", "Send through every provider", "Mark delivered", "Delete the attempt"),
    ],
  }),
  makeHldLesson({
    slug: "file-storage-hld",
    title: "HLD: Cloud File Storage",
    subtitle: "Multipart upload, metadata, chunks, versions, sharing, sync, deduplication, and lifecycle.",
    difficulty: "advanced",
    minutes: 70,
    tags: ["case-study", "file-storage", "object-storage", "sync"],
    prerequisites: ["databases-scaling", "caching-cdn"],
    clarify: [
      "Is this object upload/download, a hierarchical drive, Dropbox-style sync, or all three?",
      "What file-size limits, versioning, sharing, consistency, durability, malware scan, and regional rules apply?",
      "Do concurrent edits require locks, last-writer-wins, conflict copies, or collaborative merge?",
    ],
    model: [
      "Metadata is strongly controlled and small; file bytes are immutable objects/chunks in durable blob storage.",
      "Upload to temporary objects, verify, then atomically commit a metadata version.",
      "Sync clients consume an ordered per-user/namespace change log and reconcile from cursors.",
    ],
    architecture:
      "A metadata service stores tenant/user namespace, file IDs, paths, versions, ACLs, manifests, and quotas in a transactional database. Upload service creates sessions and signed multipart URLs so clients send chunks directly to object storage. Completion validates checksums/size/quota, writes an immutable file version manifest, and atomically updates the namespace plus change log. Async workers scan malware, extract previews, deduplicate/compact, and apply lifecycle policies. Download service authorizes metadata and issues short-lived CDN/object URLs. Sync service streams change-log entries after a client cursor; sharing uses capability links or ACL principals with revocation versions.",
    diagram: {
      kind: "video-arch",
      title: "Blob ingest and CDN delivery architecture",
      caption: "As with video, large bytes bypass APIs into object storage and downloads flow through CDN; metadata commits publication.",
    },
    capacity: [
      { label: "Users / files", value: "100M users × 10K files average = 1T metadata entries at maturity" },
      { label: "Upload volume", value: "50 PB/day, average 8 MB object; multipart sessions dominate large-file reliability" },
      { label: "Download volume", value: "200 PB/day delivered, target >95% of public/shared bytes through CDN" },
      { label: "Metadata writes", value: "2B changes/day ≈ 23K/s average, 5× peak ≈ 116K/s" },
      { label: "Durability", value: "Target 11 nines for committed blobs via erasure coding/replication plus checksum scrubbing" },
      { label: "SLO", value: "Metadata p99 <200 ms; upload completion <2 s after bytes; sync propagation <5 s" },
    ],
    readPath:
      "List/search requests authorize tenant and path/file IDs, read a stable metadata page by cursor, and return versions/status. Download first checks ACL/share-link version and malware state, then signs a short-lived URL for the exact immutable object/version; CDN range requests support resume and media preview. Sync requests send last cursor, receive ordered namespace changes and tombstones, and periodically perform a snapshot if the cursor expired. File content is never proxied through metadata servers.",
    writePath:
      "Client creates an upload session with expected size/checksum/path and receives part URLs. Parts upload independently with per-part checksums and resumable status. Complete verifies the assembled object, enforces quota, then in one metadata transaction creates version, conditionally updates the file's expected prior version, writes path/index changes and a change-log entry. A conflict creates a conflict copy or returns version conflict by product contract. Delete writes a tombstone and decrements logical references; physical blobs are garbage-collected only after retention and no manifests reference them.",
    tradeoffs: [
      tradeoff(
        "Blob layout",
        {
          label: "Whole immutable object per version",
          pros: ["Simple object-store integration and lifecycle", "Excellent CDN/range-read behavior"],
          cons: ["Small edits re-upload/store full large files", "Cross-version dedupe is limited"],
          when: "General cloud drive with mostly whole-file updates",
        },
        {
          label: "Content-defined chunking",
          pros: ["Cross-file/version dedupe and efficient delta sync", "Resume/reuse unchanged chunks"],
          cons: ["Complex manifests, GC, privacy, and tiny-object overhead", "Randomized encryption conflicts with dedupe"],
          when: "Desktop backup/sync where repeated large versions justify complexity",
        },
      ),
      tradeoff(
        "Namespace partitioning",
        {
          label: "Partition by tenant/user",
          pros: ["Most list/sync/ACL operations stay local", "Strong isolation and quota ownership"],
          cons: ["Huge tenants become hot/large partitions", "Cross-tenant sharing needs references"],
          when: "Default SaaS drive access pattern",
        },
        {
          label: "Partition by file ID hash",
          pros: ["Even point-read/write distribution", "Handles giant tenants better"],
          cons: ["Folder listing and sync scatter", "Transactional renames across directories are harder"],
          when: "Object API dominated by file-ID point operations",
        },
      ),
      tradeoff(
        "Conflict handling",
        {
          label: "Optimistic version + conflict copy",
          pros: ["Offline clients keep work and sync remains available", "No long-held lock"],
          cons: ["Users must resolve divergent copies", "Rename/path conflicts need rules"],
          when: "Consumer file sync and offline editing",
        },
        {
          label: "Exclusive checkout/lock",
          pros: ["Prevents concurrent overwrite and simplifies applications", "Clear owner"],
          cons: ["Stale locks and offline clients hurt availability", "Poor collaboration experience"],
          when: "Specialized binary workflows requiring single editor",
        },
      ),
    ],
    operations: [
      "Failure: orphaned multipart uploads and uncommitted blobs expire by lifecycle; only metadata-committed versions are visible.",
      "Consistency: metadata transaction publishes one version atomically; blob storage must provide read-after-write for the finalized object or publication waits.",
      "Scaling: shard namespace/change logs by tenant plus bucket for giant tenants; blob storage and CDN scale independently.",
      "Garbage collection: mark referenced manifests/chunks, honor retention/legal hold, then sweep with grace periods; never delete on one failed metadata read.",
      "Integrity: end-to-end checksums, background scrubbing, repair from redundant fragments, and restore drills validate durability claims.",
      "Security: envelope encryption, tenant-scoped keys where required, short signed URLs, ACL version checks, malware quarantine, and audited sharing.",
      "Observability: upload completion failures, orphan bytes, checksum mismatch, metadata shard skew, sync lag, CDN hit/egress, and GC reclaimed bytes.",
    ],
    goNotes: [
      "Stream hashes with io.TeeReader and multipart SDKs; never buffer a full file in process memory.",
      "Use explicit expectedVersion on metadata mutations and return typed conflicts for client reconciliation.",
      "Signed URL creation belongs behind an object-store interface; metadata services authorize exact tenant/file/version/action.",
      "Sync APIs use opaque monotonic cursors and bounded pages; clients must handle cursor expiry with snapshot restart.",
    ],
    answer: {
      opening:
        "I’ll split strongly consistent namespace metadata from immutable bulk bytes, then make upload completion the atomic publication point.",
      beats: [
        "Estimate metadata count separately from upload/download petabytes.",
        "Walk multipart upload, checksums, completion transaction, scan, download, and sync cursor.",
        "Compare whole objects with chunk dedupe and choose based on update patterns.",
        "Explain optimistic conflicts, tombstones, reference-safe GC, and sharing revocation.",
        "Close with integrity scrubbing, regional placement, quotas, and CDN.",
      ],
      closing:
        "Immutable bytes provide durable scale; versioned metadata supplies names, permissions, atomic visibility, and sync order.",
    },
    quiz: [
      q("file-1", "Why upload bytes directly to object storage?", "API/metadata servers avoid carrying massive payload bandwidth and memory", "It skips authorization", "It removes metadata", "It prevents retries"),
      q("file-2", "When does a file version become visible?", "After verified bytes and an atomic metadata/version commit", "After the first part", "Before checksums", "When CDN sees it"),
      q("file-3", "Why delay physical deletion after a tombstone?", "Versions, retention, legal holds, retries, or deduplicated manifests may still reference bytes", "Object stores cannot delete", "It improves upload speed", "Paths require it"),
      q("file-4", "What enables incremental client sync?", "An ordered per-namespace change log consumed from an opaque cursor", "Listing all blobs every second", "CDN purge events", "Random hashes only"),
    ],
  }),
  makeHldLesson({
    slug: "multi-tenant-saas-hld",
    title: "HLD: Multi-Tenant SaaS Platform",
    subtitle: "Tenant isolation, identity, data placement, noisy-neighbor controls, customization, billing, and migrations.",
    difficulty: "advanced",
    minutes: 70,
    tags: ["case-study", "saas", "multi-tenancy", "isolation"],
    prerequisites: ["databases-scaling", "rate-limiter-hld", "observability-resilience"],
    clarify: [
      "What tenant sizes, plans, custom domains, regions, compliance, data residency, and BYOK needs exist?",
      "Is isolation logical, schema-level, database-level, account-level, or selectable by tier?",
      "How are users mapped to tenants, roles, SSO/SCIM, quotas, metering, and support access?",
    ],
    model: [
      "Tenant identity is request context and must participate in authorization, keys, queries, quotas, logs, and jobs.",
      "Use pooled infrastructure by default and promote exceptional tenants to dedicated cells without changing product APIs.",
      "A cell limits blast radius by bundling app capacity, cache, queues, and data shards for a tenant subset.",
    ],
    architecture:
      "DNS/custom domains reach an edge that resolves tenant and identity provider. An auth service validates OIDC/SAML and produces user, tenant, roles, and session claims; authorization services evaluate resource/action policies. A tenant router maps tenant_id to a regional cell. Each cell contains stateless Go services, tenant-keyed caches/queues, and sharded relational storage with row-level/application isolation. Control plane owns tenant lifecycle, plan, placement, feature flags, domains, SSO config, encryption keys, and migrations. Usage events flow through a metering ledger to billing. Large/regulatory tenants can receive dedicated databases or cells under the same routing contract.",
    capacity: [
      { label: "Tenants", value: "1M tenants: 99% small, 0.9% medium, 0.1% enterprise; design for extreme skew" },
      { label: "Users/traffic", value: "100M seats, 10M concurrent, 500K requests/s peak" },
      { label: "Data", value: "Average 5 GB/tenant suggests 5 PB, but enterprise tenants may exceed 100 TB each" },
      { label: "Cells", value: "100 cells × ~10K normal tenants; dedicated cells for largest/compliance tenants" },
      { label: "Metering", value: "2B usage events/day ≈ 23K/s average, 10× billing-period bursts" },
      { label: "Isolation SLO", value: "No cross-tenant disclosure; per-cell 99.99% availability, tenant move RPO≈0 and controlled RTO" },
    ],
    readPath:
      "A request resolves custom host to tenant, authenticates a session bound to that tenant, and constructs immutable TenantContext. The router selects the tenant's cell from cached versioned placement. Every cache key, repository query, search filter, object prefix, and downstream token includes tenant identity. Authorization checks actor, action, resource tenant, and role/policy. Reads use plan-aware limits and tenant-specific feature/config snapshots. Support impersonation requires explicit grants, reason, expiry, and audit banners.",
    writePath:
      "Tenant-scoped commands carry tenant_id from trusted auth context—not request body alone—plus idempotency and expected version. The service enforces quota, sets database tenant context or explicit predicate, commits domain state and usage/outbox atomically, and returns. Provisioning is a saga: reserve tenant ID/domain, choose region/cell, create data/key/config, initialize admin, and compensate safely on failure. Tenant moves use snapshot copy, CDC catch-up, brief fenced cutover of routing epoch, verification, and delayed source cleanup.",
    tradeoffs: [
      tradeoff(
        "Data isolation",
        {
          label: "Shared tables with tenant_id",
          pros: ["Highest utilization and simplest fleet operations", "Easy aggregate schema migration"],
          cons: ["Every query must enforce tenant predicate; noisy neighbors share resources", "Per-tenant restore/export is harder"],
          when: "Large population of small/medium tenants with strong guardrails",
        },
        {
          label: "Database/schema per tenant",
          pros: ["Strong blast-radius and operational isolation", "Per-tenant backup/restore/customization"],
          cons: ["Connection, migration, and catalog explosion", "Poor utilization for tiny tenants"],
          when: "Enterprise/compliance tier or a small tenant count",
        },
      ),
      tradeoff(
        "Deployment topology",
        {
          label: "One global pooled fleet",
          pros: ["Maximum utilization and simple routing", "Few deployments"],
          cons: ["Large blast radius and difficult residency isolation", "Noisy neighbors affect everyone"],
          when: "Early scale or homogeneous region requirements",
        },
        {
          label: "Cell-based architecture",
          pros: ["Bounded blast radius, regional placement, and incremental rollouts", "Tenant moves isolate hotspots"],
          cons: ["Fleet/control-plane complexity and capacity fragmentation", "Cross-cell features require explicit design"],
          when: "Large SaaS with many tenants and reliability/compliance tiers",
        },
      ),
      tradeoff(
        "Customization",
        {
          label: "Shared schema + metadata/feature flags",
          pros: ["One maintainable product and migration path", "Safe bounded per-tenant differences"],
          cons: ["Cannot support arbitrary tenant code/schema", "Flag combinations require testing"],
          when: "Default SaaS product customization",
        },
        {
          label: "Tenant-specific forks/plugins",
          pros: ["Maximum enterprise flexibility", "Can meet unusual integrations"],
          cons: ["Security, upgrade, support, and test matrix explode", "Forks block platform evolution"],
          when: "Only sandboxed extension points with strict contracts—not codebase forks",
        },
      ),
    ],
    operations: [
      "Failure: cells cap impact; placement cache retains last known routes, but routing epochs fence writes during tenant moves.",
      "Consistency: tenant control-plane updates are versioned; data-plane requests carry placement/config version when stale routing could write twice.",
      "Isolation: database row policies plus application predicates, tenant-prefixed cache/object keys, per-tenant encryption context, and automated leakage tests.",
      "Noisy neighbors: weighted concurrency, per-tenant rate/queue/storage quotas, fair scheduling, query budgets, and promotion to dedicated shards/cells.",
      "Scaling: rebalance whole tenants first, bucket giant tenant data when necessary, and keep cross-tenant analytics in a separate governed warehouse.",
      "Migrations: schema rollout is expand/backfill/contract per cell with progress and pause; never iterate synchronously across 1M tenants.",
      "Observability: every signal includes bounded tenant tier/cell—not arbitrary tenant ID in metrics; searchable logs/traces support sampled tenant diagnosis.",
      "Compliance: data residency, retention, export/delete, key rotation/BYOK, SSO lifecycle, support audit, and backup restore are tenant-aware workflows.",
    ],
    goNotes: [
      "Create TenantContext only after authentication and pass it explicitly; repository methods require tenant ID in their type/signature.",
      "Use database transaction hooks/SET LOCAL or generated query helpers to prevent accidental unscoped access; test that missing scope fails closed.",
      "Apply per-tenant semaphores and weighted worker queues, not only global limits; clear them when idle to bound cardinality.",
      "Keep control-plane Tenant, Placement, Plan, and Config APIs versioned and cached; data-plane handlers must define stale-config behavior.",
      "Tag logs/traces with tenant only under privacy/cardinality policy; hash or sample high-cardinality identifiers.",
    ],
    answer: {
      opening:
        "I’ll treat tenant identity and isolation as the primary invariant, use pooled cells for efficiency, and preserve a path to dedicated placement.",
      beats: [
        "Quantify tenant-size skew rather than designing for an average tenant.",
        "Walk host/SSO resolution, tenant routing, authorization, scoped read, and metered write.",
        "Compare shared rows, databases, and cells against isolation and operations.",
        "Explain noisy-neighbor limits, tenant migration with fencing, and per-tenant restore.",
        "Close with control/data plane separation, compliance workflows, and leakage testing.",
      ],
      closing:
        "One routing and API model supports pooled and dedicated tenants, while every data path fails closed without an authenticated tenant scope.",
    },
    quiz: [
      q("saas-1", "Why must tenant identity come from trusted auth context?", "A caller-controlled body parameter could otherwise access another tenant", "Bodies cannot contain strings", "It improves compression", "Databases assign users"),
      q("saas-2", "What is the main benefit of cells?", "They bound failure/noisy-neighbor blast radius and support regional tenant placement", "They eliminate databases", "They provide global transactions", "They remove routing"),
      q("saas-3", "Why is database-per-tenant poor for millions of tiny tenants?", "Connections, migrations, backups, and catalogs create huge operational overhead", "It has weak isolation", "It cannot use SQL", "It forces one region"),
      q("saas-4", "How should a tenant move avoid writes to both old and new owners?", "Use a routing epoch/fencing token during catch-up and cutover", "Rely on DNS TTL only", "Copy once and hope", "Disable idempotency"),
    ],
  }),
];
