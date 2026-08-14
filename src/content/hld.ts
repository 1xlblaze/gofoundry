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
        type: "diagram",
        kind: "outbox",
        title: "Outbox etch",
        caption: "One DB transaction for state + outbox row — then relay.",
      },
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
  {
    slug: "video-streaming-hld",
    track: "hld",
    title: "HLD: Video Streaming Platform",
    subtitle: "Upload pipeline, transcoding, adaptive bitrate, and CDN delivery.",
    difficulty: "advanced",
    minutes: 42,
    tags: ["case-study", "video", "cdn"],
    blocks: [
      {
        type: "prose",
        title: "Two very different paths: upload vs watch",
        body: "Upload path: client → upload service → object storage (raw) → async transcoding pipeline (multiple resolutions/bitrates, thumbnail extraction) → manifest generation (HLS/DASH) → CDN origin. Watch path: client requests a manifest, then fetches video segments from the nearest CDN edge — the origin (your servers) is barely touched after the first cache fill.",
      },
      {
        type: "steps",
        title: "Transcoding pipeline",
        items: [
          "Raw upload lands in object storage, triggers an event (S3 event / Pub/Sub)",
          "Worker fleet pulls transcoding jobs from a queue — parallelize per resolution",
          "Adaptive bitrate: produce 240p/480p/720p/1080p renditions + an HLS/DASH manifest",
          "Store renditions in object storage behind a CDN; original stays in cold storage",
        ],
      },
      {
        type: "prose",
        title: "Adaptive bitrate streaming",
        body: "The player periodically measures throughput and switches renditions (segment-by-segment) via the manifest — this is why a slow connection shows lower quality instead of buffering. Segments are typically 2-10 seconds so switches are fast and cache-friendly.",
      },
      {
        type: "steps",
        title: "Deep dives interviewers probe",
        items: [
          "Why CDN pull vs push for cold content, and origin shielding for thundering herd",
          "Resumable/chunked uploads for large files (avoid re-uploading on failure)",
          "View count / analytics as an async, eventually-consistent pipeline",
          "DRM / signed URLs for access control on premium content",
        ],
      },
    ],
    quiz: [
      {
        id: "vs1",
        prompt: "Why does the watch path rarely hit your origin servers after the first request?",
        options: [
          "Videos are small",
          "CDN edge caches serve subsequent viewers directly, only pulling from origin on cache miss",
          "Origin servers auto-scale to infinity",
          "Video is never cached",
        ],
        answerIndex: 1,
        explanation: "CDN caching is the entire point — origin only pays the cost once per edge per file.",
      },
    ],
  },
  {
    slug: "ride-sharing-hld",
    track: "hld",
    title: "HLD: Ride-Sharing Dispatch",
    subtitle: "Geospatial indexing, real-time matching, and surge pricing signals.",
    difficulty: "advanced",
    minutes: 40,
    tags: ["case-study", "geospatial"],
    blocks: [
      {
        type: "prose",
        title: "Core problem: match riders to nearby drivers, fast",
        body: "Drivers stream location updates every few seconds over a persistent connection. The location service indexes drivers with a geospatial structure (geohash or quadtree/Redis GEO) so 'nearest available driver' queries run in milliseconds instead of scanning the whole fleet.",
      },
      {
        type: "steps",
        title: "Core components",
        items: [
          "Location ingestion service — high write throughput, short-lived data",
          "Geospatial index (Redis GEO / quadtree) for nearest-driver queries",
          "Matching service — assigns driver, handles accept/reject/timeout",
          "Trip service — durable state machine (Requested → Matched → InProgress → Completed)",
          "Pricing service — surge multiplier from live supply/demand ratio per zone",
        ],
      },
      {
        type: "prose",
        title: "Why geohash / quadtree over a plain SQL query",
        body: "A naive 'find drivers within 2km' with a SQL WHERE on lat/lng requires scanning many rows or a poor B-tree fit. Geohashing buckets nearby coordinates into shared prefixes so a range query on the geohash string approximates a radius search; Redis GEO commands do this natively with sorted sets under the hood.",
      },
      {
        type: "answer",
        opening: "I'd split location writes (high volume, ephemeral) from trip state (durable, low volume) into different stores.",
        beats: [
          "Draw driver location stream → geospatial index → matcher.",
          "Discuss race condition: two riders matched to the same driver — need atomic claim (Lua script / conditional write).",
          "Surge pricing as a derived, eventually-consistent signal, not blocking the matching path.",
        ],
      },
    ],
    quiz: [
      {
        id: "rs1",
        prompt: "Why must driver-claim during matching be atomic?",
        options: [
          "It's not important",
          "Two concurrent match attempts could otherwise assign the same driver to two riders",
          "Atomicity only matters for payments",
          "Drivers can serve multiple riders simultaneously",
        ],
        answerIndex: 1,
        explanation: "A race between two match attempts needs a single atomic claim (e.g. conditional update) to avoid double-booking.",
      },
    ],
  },
  {
    slug: "payment-system-hld",
    track: "hld",
    title: "HLD: Payment Processing System",
    subtitle: "Idempotency, double-entry ledgers, and reconciliation with external processors.",
    difficulty: "advanced",
    minutes: 40,
    tags: ["case-study", "payments"],
    blocks: [
      {
        type: "prose",
        title: "Money demands idempotency and auditability above all",
        body: "Every payment mutation carries a client-generated idempotency key so retried requests (network blips, client retries) never double-charge. Internally, balances are derived from an append-only, double-entry ledger — never mutate a balance column directly; every movement is a pair of debit/credit ledger rows that must sum to zero.",
      },
      {
        type: "diagram",
        kind: "outbox",
        title: "Ledger write + async settlement etch",
        caption: "Write the ledger entry and outbox event in one DB transaction, then relay to the payment processor.",
      },
      {
        type: "steps",
        title: "Core flow",
        items: [
          "Client sends charge request with Idempotency-Key header",
          "API checks: has this key been seen? If so, return the stored result — don't reprocess",
          "Write a pending ledger entry + outbox event in one transaction",
          "Worker calls the external processor (Stripe/etc.), then updates ledger to settled/failed",
          "Reconciliation job compares your ledger against the processor's statement nightly",
        ],
      },
      {
        type: "callout",
        tone: "warn",
        body: "Never trust a synchronous HTTP response alone for payment state — the request can succeed but the response can be lost. Webhooks from the processor plus reconciliation are the source of truth.",
      },
      {
        type: "prose",
        title: "Why double-entry",
        body: "Every transaction records at least two ledger rows (e.g. debit user wallet, credit platform revenue) that net to zero. This makes the total system balance auditable at any point in time and makes bugs visible immediately (the ledger stops summing to zero) rather than silently drifting.",
      },
    ],
    quiz: [
      {
        id: "pay1",
        prompt: "An idempotency key primarily protects against…",
        options: [
          "SQL injection",
          "Duplicate processing when a client retries the same logical request",
          "Currency conversion errors",
          "Slow database queries",
        ],
        answerIndex: 1,
        explanation: "Idempotency keys let the server recognize and safely no-op a retried request instead of double-charging.",
      },
    ],
  },
  {
    slug: "search-autocomplete-hld",
    track: "hld",
    title: "HLD: Search Autocomplete",
    subtitle: "Trie/FST-backed suggestions, ranking, and low-latency serving at the edge.",
    difficulty: "intermediate",
    minutes: 34,
    tags: ["case-study", "search"],
    prerequisites: ["tries-and-bitmask"],
    blocks: [
      {
        type: "prose",
        title: "Precompute, don't compute per keystroke",
        body: "Autocomplete must respond in single-digit milliseconds on every keystroke. The serving structure is a trie (or a compressed FST) built offline from query logs, with each node caching its top-K most frequent completions — so a lookup is O(prefix length), not a live ranking computation.",
      },
      {
        type: "steps",
        title: "Pipeline",
        items: [
          "Offline: aggregate query logs, compute frequency/recency-weighted scores per query",
          "Build a trie where each node stores precomputed top-K children by score",
          "Serve the trie from in-memory replicas behind a load balancer — read-only, easy to scale horizontally",
          "Periodically rebuild and hot-swap the trie (e.g. hourly) without downtime",
        ],
      },
      {
        type: "prose",
        title: "Personalization without blowing up latency",
        body: "Global top-K suggestions come from the shared trie. A thin personalization layer (recent searches, location) re-ranks or blends in a handful of candidates client-side or in a fast in-memory per-user cache — heavy personalization models run offline, not on the critical path.",
      },
      {
        type: "callout",
        tone: "tip",
        body: "Debounce client-side keystroke requests (e.g. 100-150ms) to avoid firing a request per character and overwhelming the service under normal typing speed.",
      },
    ],
    quiz: [
      {
        id: "ac1",
        prompt: "Why precompute top-K suggestions per trie node instead of ranking at request time?",
        options: [
          "Precomputation is always more accurate",
          "It turns a request into O(prefix length) lookup instead of scanning and ranking candidates live, which is required for single-digit-ms latency",
          "Tries cannot store scores",
          "It removes the need for a trie",
        ],
        answerIndex: 1,
        explanation: "Autocomplete's latency budget rules out any live ranking computation over many candidates per keystroke.",
      },
    ],
  },
];
