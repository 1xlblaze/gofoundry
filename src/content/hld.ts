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
    subtitle: "Architecture diagram, read/write paths, and every major trade-off spelled out.",
    difficulty: "intermediate",
    minutes: 45,
    tags: ["case-study"],
    prerequisites: ["url-shortener-lld", "system-design-foundations"],
    blocks: [
      {
        type: "think",
        title: "HEAT · Hear first",
        clarify: [
          "Read vs write QPS? (typically 100:1 or more for shorteners)",
          "Custom domains? Analytics? Link expiry? Abuse/spam?",
          "Global or single-region? Latency SLO for redirects?",
        ],
        model: [
          "Separate read path (redirect) from write path (shorten)",
          "Cache immutable code→URL mappings aggressively",
          "Async analytics — never block redirect on logging",
        ],
      },
      {
        type: "diagram",
        title: "System architecture",
        kind: "url-shortener-arch",
        caption: "Etch this box diagram before naming trade-offs. Read path is cache-heavy; write path is consistency-heavy.",
      },
      {
        type: "prose",
        title: "Read path (redirect)",
        body: "GET /{code} hits a redirect tier optimized for throughput. Check CDN edge cache first (custom domains terminate at CDN). On miss, check Redis (cluster-wide hot codes). On miss again, read from DB shard by code hash, populate Redis, return 301/302 to long URL. Target: sub-50ms p99 at the edge for cached paths.",
      },
      {
        type: "prose",
        title: "Write path (shorten)",
        body: "POST /shorten validates URL, calls ID service for a unique code (or hashes long URL for idempotency), writes mapping to primary DB in the correct shard, returns short URL. Analytics event emitted async (outbox or queue) — never block the API response on Kafka/SQS.",
      },
      {
        type: "capacity",
        title: "Back-of-envelope (example scale)",
        rows: [
          { label: "Assumption", value: "100M new URLs/day, 10B redirects/day" },
          { label: "Write QPS", value: "~1.2K/s average, ~5K/s peak" },
          { label: "Read QPS", value: "~115K/s average, ~500K/s peak at edge" },
          { label: "Storage", value: "100B rows × ~150B ≈ 15TB raw + indexes + replicas" },
          { label: "Cache", value: "Redis: top 20% codes often cover 80% reads — size for hot set + TTL" },
        ],
      },
      {
        type: "tradeoff",
        title: "ID generation: counter+Base62 vs hash truncate",
        choices: [
          {
            label: "A — Monotonic counter + Base62",
            pros: [
              "Guaranteed unique, compact codes",
              "Predictable length; easy sharding by code range",
            ],
            cons: [
              "Needs coordinated ID service (ticket servers / Snowflake)",
              "Codes are guessable (enumeration risk)",
            ],
            when: "High write volume, need short opaque codes, can add rate limits for enumeration",
          },
          {
            label: "B — Hash(long URL) truncated + collision retry",
            pros: [
              "Idempotent: same long URL → same code without extra lookup",
              "No central counter bottleneck",
            ],
            cons: [
              "Collisions require retry loop",
              "Truncation increases collision probability",
              "Not ideal if you need non-guessable codes",
            ],
            when: "Idempotency matters, moderate scale, willing to handle rare collisions",
          },
        ],
      },
      {
        type: "tradeoff",
        title: "Redirect: 301 vs 302",
        choices: [
          {
            label: "A — 301 Permanent",
            pros: [
              "Browsers/CDNs cache aggressively → fewer origin hits",
              "Best for immutable mappings (most short links)",
            ],
            cons: [
              "Hard to change destination later (cache sticks)",
              "Bad if you need analytics per click at origin",
            ],
            when: "Mapping is immutable and you want maximum cache offload",
          },
          {
            label: "B — 302 Found (temporary)",
            pros: [
              "Destination can change; caches revalidate more often",
              "Better if you track every click at your redirect tier",
            ],
            cons: [
              "More origin traffic; worse CDN efficiency",
              "Higher latency on repeat visits",
            ],
            when: "Links expire, A/B destinations, or strict per-click analytics at origin",
          },
        ],
      },
      {
        type: "tradeoff",
        title: "Storage: SQL vs wide-column (Dynamo/Cassandra)",
        choices: [
          {
            label: "A — SQL (PostgreSQL) + sharding",
            pros: [
              "Strong consistency on write, familiar ops",
              "Secondary indexes if you need lookup by user_id",
            ],
            cons: [
              "Sharding by code hash is manual",
              "Hot shards if codes aren't uniformly distributed",
            ],
            when: "Moderate scale, need transactions, team knows SQL",
          },
          {
            label: "B — Wide-column / KV (DynamoDB, Cassandra)",
            pros: [
              "Horizontal scale by partition key = code",
              "Very high read/write throughput per partition",
            ],
            cons: [
              "Limited secondary queries without extra indexes",
              "Tunable consistency — must design carefully",
            ],
            when: "Massive scale, simple access pattern (get by code only)",
          },
        ],
      },
      {
        type: "tradeoff",
        title: "Cache: Redis cluster vs CDN-only",
        choices: [
          {
            label: "A — CDN + Redis",
            pros: [
              "CDN handles geographic latency; Redis handles origin shielding",
              "Two layers: edge for static redirect, Redis for dynamic miss path",
            ],
            cons: ["Two systems to operate; invalidation must touch both on delete"],
            when: "Global users, high read QPS, custom domains at CDN",
          },
          {
            label: "B — CDN only (long TTL on 301)",
            pros: ["Simpler stack", "301 + long TTL = near-zero origin for hot codes"],
            cons: [
              "Cold codes always hit origin",
              "302 breaks CDN caching benefits",
            ],
            when: "Smaller scale or mostly immutable links with 301",
          },
        ],
      },
      {
        type: "answer",
        title: "How to answer in the interview",
        opening:
          "I'll separate read and write paths, draw the architecture, then walk trade-offs with a clear pick for each.",
        beats: [
          "State read-heavy ratio → CDN + Redis + sharded DB.",
          "Pick ID strategy with uniqueness vs idempotency trade-off.",
          "301 vs 302 based on immutability and analytics needs.",
          "Mention abuse: rate limits, URL blocklists, CAPTCHA on shorten.",
          "Close with capacity numbers and what breaks first at 10× scale.",
        ],
      },
      {
        type: "steps",
        title: "Go service map (what you'd implement)",
        items: [
          "redirect-svc — GET /{code}, cache-aside, minimal logic",
          "api-svc — POST /shorten, auth, validation",
          "id-svc — Snowflake / ticket server for codes",
          "analytics-worker — consume outbox, write to columnar store",
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
    subtitle: "Architecture, fan-out trade-offs, and Go gateway design.",
    difficulty: "advanced",
    minutes: 48,
    tags: ["case-study", "realtime"],
    blocks: [
      {
        type: "think",
        title: "HEAT · Hear",
        clarify: [
          "1:1 vs groups vs channels? Max group size?",
          "Delivery guarantees: at-least-once OK?",
          "Media? Multi-device sync? Presence required?",
        ],
        model: [
          "WS gateway tier holds sockets; never put business logic only on one box",
          "Persist first, then fan-out — don't lose messages on crash",
          "Hybrid fan-out for groups vs celebrity channels",
        ],
      },
      {
        type: "diagram",
        title: "System architecture",
        kind: "chat-arch",
        caption: "Gateways are the edge of the real-time plane; pub/sub bridges multiple pods.",
      },
      {
        type: "prose",
        title: "Happy path",
        body: "Client opens WebSocket to a gateway (sticky LB or connection registry). Message service writes durable message, then publishes an event. Gateways subscribed for that conversation push to online recipients. Offline devices get a push notification via APNs/FCM. Presence is a separate high-churn store (Redis sets / heartbeats).",
      },
      {
        type: "tradeoff",
        title: "Fan-out: write-time vs read-time",
        choices: [
          {
            label: "A — Write fan-out (push into each inbox)",
            pros: ["Reads are cheap — inbox already materialised", "Great for 1:1 and small groups"],
            cons: ["Celebrity / huge groups explode write amplification", "Harder to edit/delete globally"],
            when: "Most chats are small; read QPS dominates",
          },
          {
            label: "B — Read fan-out (store once, pull on read)",
            pros: ["One write per message regardless of membership", "Scales huge channels"],
            cons: ["Reads do more work / merging", "Harder to guarantee per-user inbox semantics"],
            when: "Large broadcast channels or celebrity accounts",
          },
        ],
      },
      {
        type: "tradeoff",
        title: "Connection registry: sticky LB vs shared registry",
        choices: [
          {
            label: "A — Sticky sessions on LB",
            pros: ["Simple — user always hits same gateway", "Less infra"],
            cons: ["Uneven load; failover drops sockets", "Harder multi-region"],
            when: "Early stage, single region",
          },
          {
            label: "B — Conn registry (user → gateway)",
            pros: ["Any gateway can route via pub/sub", "Better failover and scale-out"],
            cons: ["Extra service to operate; registry must be fast"],
            when: "Many gateways, multi-AZ, need seamless reconnect",
          },
        ],
      },
      {
        type: "capacity",
        title: "Back-of-envelope (example)",
        rows: [
          { label: "Users", value: "50M MAU, 5M concurrent peak" },
          { label: "Messages", value: "2B/day ≈ 23K msg/s average, 100K/s peak" },
          { label: "Gateways", value: "~5K concurrent sockets/box → ~1K gateway pods at peak" },
          { label: "Storage", value: "Message payloads + indexes; media in object storage + CDN" },
        ],
      },
      {
        type: "answer",
        title: "How to answer",
        opening: "I'd draw gateways, message service, store, and pub/sub first — then pick fan-out based on group size.",
        beats: [
          "Persist before fan-out for durability.",
          "Hybrid: write fan-out for small chats, pull for huge channels.",
          "Call out ordering per conversation (partition key = conversation_id).",
          "Mention Go: one write goroutine per socket + hub channels.",
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
    minutes: 36,
    tags: ["rate-limit", "redis"],
    prerequisites: ["rate-limiter-lld"],
    blocks: [
      {
        type: "diagram",
        kind: "token-bucket",
        title: "Token bucket (local mental model)",
        caption: "Distributed systems wrap this algorithm in Redis/Lua or approximate local limits.",
      },
      {
        type: "tradeoff",
        title: "Enforcement location",
        choices: [
          {
            label: "A — Edge / API gateway",
            pros: ["Stops abuse early", "One place to configure coarse limits"],
            cons: ["Less business context (per-plan quotas harder)", "Not enough for fine-grained rules alone"],
            when: "DDoS / IP / API-key coarse protection",
          },
          {
            label: "B — Service-level + Redis",
            pros: ["Per-user / per-tenant rules with product context", "Accurate shared counters"],
            cons: ["Redis becomes a dependency on the hot path", "Hot keys need sharding"],
            when: "Paid plans, per-user quotas, multi-instance accuracy",
          },
        ],
      },
      {
        type: "tradeoff",
        title: "Accuracy vs availability",
        choices: [
          {
            label: "A — Fail closed (deny if Redis down)",
            pros: ["Protects downstream under outage"],
            cons: ["User-visible outage for legitimate traffic"],
            when: "Downstream is fragile / costly if flooded",
          },
          {
            label: "B — Fail open (allow if Redis down)",
            pros: ["Availability preserved"],
            cons: ["Abuse window during Redis incidents"],
            when: "Product prefers availability; add local soft limits as backup",
          },
        ],
      },
      {
        type: "answer",
        title: "How to answer",
        opening: "I'd enforce coarse limits at the edge and fine per-user quotas in Redis with Lua for atomicity.",
        beats: [
          "Draw where enforcement sits.",
          "Pick fail-open vs fail-closed explicitly.",
          "Mention hot-key sharding by user hash.",
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
    subtitle: "Architecture diagram, hybrid fan-out, and ranking trade-offs.",
    difficulty: "advanced",
    minutes: 44,
    tags: ["case-study", "feed"],
    blocks: [
      {
        type: "diagram",
        title: "System architecture",
        kind: "feed-arch",
        caption: "Push for normal users · pull for celebrities · rank offline.",
      },
      {
        type: "tradeoff",
        title: "Timeline materialisation",
        choices: [
          {
            label: "A — Pure write fan-out (push)",
            pros: ["Home feed reads are a simple timeline scan", "Predictable read latency"],
            cons: ["Celebrity posts hammer fan-out workers", "Storage multiplies by follower count"],
            when: "Follow graphs are modest and bounded",
          },
          {
            label: "B — Hybrid push + pull",
            pros: ["Avoids write amplification for huge accounts", "Industry standard approach"],
            cons: ["Read path merges two sources", "More moving parts"],
            when: "You have celebrities / viral accounts (almost always at scale)",
          },
        ],
      },
      {
        type: "tradeoff",
        title: "Ranking: chronological vs scored",
        choices: [
          {
            label: "A — Chronological",
            pros: ["Simple, transparent, cheap", "Users understand it"],
            cons: ["Misses high-quality older posts", "Spammy followees dominate"],
            when: "MVP / niche communities that want purity",
          },
          {
            label: "B — Ranked (ML / heuristics)",
            pros: ["Higher engagement", "Can demote spam"],
            cons: ["Opaque; needs features + offline training", "Harder to debug"],
            when: "Consumer social at scale",
          },
        ],
      },
      {
        type: "capacity",
        title: "Back-of-envelope",
        rows: [
          { label: "Posts", value: "500M posts/day" },
          { label: "Reads", value: "Home feed opens dominate — cache top of timeline" },
          { label: "Hot path", value: "Fan-out workers + feed store (Cassandra/Redis lists)" },
        ],
      },
      {
        type: "answer",
        opening: "I'd propose hybrid fan-out on day one if there's any chance of celebrity accounts.",
        beats: [
          "Draw post service → workers → feed store.",
          "Explain push vs pull with a concrete follower-count threshold.",
          "Ranking as offline features + light online blend.",
        ],
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
    subtitle: "Architecture, ABR pipeline, and CDN trade-offs.",
    difficulty: "advanced",
    minutes: 45,
    tags: ["case-study", "video", "cdn"],
    blocks: [
      {
        type: "diagram",
        title: "System architecture",
        kind: "video-arch",
        caption: "Upload is async and heavy · watch path should barely touch origin.",
      },
      {
        type: "prose",
        title: "Two paths",
        body: "Upload: client → upload service → object storage (raw) → queue → transcoder fleet → HLS/DASH manifests + renditions → CDN origin. Watch: player fetches manifest, then segments from the nearest CDN edge. Origin shielding prevents thundering herds on popular videos.",
      },
      {
        type: "tradeoff",
        title: "CDN: pull vs push",
        choices: [
          {
            label: "A — Pull CDN (origin fetch on miss)",
            pros: ["Simple ops", "Only popular content stays hot at edges"],
            cons: ["First viewer pays origin latency", "Need origin shield for viral content"],
            when: "Long-tail catalog, unpredictable popularity",
          },
          {
            label: "B — Push / pre-warm popular titles",
            pros: ["Predictable latency for launches", "Protects origin on premieres"],
            cons: ["Wastes edge storage on cold titles", "More pipeline complexity"],
            when: "Known blockbuster releases / live events",
          },
        ],
      },
      {
        type: "tradeoff",
        title: "Packaging: HLS vs DASH",
        choices: [
          {
            label: "A — HLS",
            pros: ["Excellent Apple / mobile support", "Ubiquitous tooling"],
            cons: ["Historically larger manifests / TS overhead (fMP4 helps)"],
            when: "Consumer mobile-first products",
          },
          {
            label: "B — DASH",
            pros: ["Flexible on Android/web", "Good CMAF interoperability"],
            cons: ["Often still dual-package for Apple"],
            when: "Web/Android heavy; or package both from same mezzanine",
          },
        ],
      },
      {
        type: "capacity",
        title: "Back-of-envelope",
        rows: [
          { label: "Uploads", value: "Heavy async GPU/CPU fleet for renditions" },
          { label: "Watch", value: "Almost all bytes from CDN; origin serves manifests + cold misses" },
          { label: "Storage", value: "Raw + 4–5 renditions ≈ multi× raw size" },
        ],
      },
      {
        type: "answer",
        opening: "I'd separate upload/transcode from watch, put CDN in front, and make analytics async.",
        beats: [
          "Draw both paths.",
          "Explain ABR segment switching.",
          "Call out signed URLs / DRM for premium.",
          "Origin shield for viral titles.",
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
    subtitle: "Geo index, atomic matching, and surge trade-offs.",
    difficulty: "advanced",
    minutes: 44,
    tags: ["case-study", "geospatial"],
    blocks: [
      {
        type: "diagram",
        title: "System architecture",
        kind: "ride-arch",
        caption: "Location writes are hot and ephemeral · trip state is durable.",
      },
      {
        type: "tradeoff",
        title: "Geo index: Redis GEO vs dedicated geo service",
        choices: [
          {
            label: "A — Redis GEO",
            pros: ["Fast to ship", "GEORADIUS built-in", "Good for city-scale fleets"],
            cons: ["Memory-bound", "Cross-region story is harder"],
            when: "Single-region / city launch",
          },
          {
            label: "B — Dedicated geo service (quadtree/S2)",
            pros: ["Tunable sharding by cell", "Clearer multi-region story"],
            cons: ["More engineering cost"],
            when: "Multi-city global scale with custom query needs",
          },
        ],
      },
      {
        type: "tradeoff",
        title: "Matching: nearest vs batch auction",
        choices: [
          {
            label: "A — Nearest available driver",
            pros: ["Low latency, simple UX", "Easy to explain"],
            cons: ["Locally optimal, not globally optimal"],
            when: "MVP and most city operations",
          },
          {
            label: "B — Batch matching window",
            pros: ["Better marketplace efficiency", "Can incorporate ETAs + ratings"],
            cons: ["Adds matching delay", "More complex fairness rules"],
            when: "Dense cities where a 2–5s batch improves outcomes",
          },
        ],
      },
      {
        type: "callout",
        tone: "warn",
        body: "Driver claim must be atomic (conditional update / Lua). Two riders matching the same driver is a classic race.",
      },
      {
        type: "answer",
        opening: "I'd split ephemeral location from durable trip state, then enforce atomic driver claim.",
        beats: [
          "Draw GPS stream → geo index → matcher → trip service.",
          "Explain geohash/GEO vs naive SQL.",
          "Surge as derived signal, not on the critical match path.",
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
        explanation: "A race between two match attempts needs a single atomic claim to avoid double-booking.",
      },
    ],
  },
  {
    slug: "payment-system-hld",
    track: "hld",
    title: "HLD: Payment Processing System",
    subtitle: "Idempotency, ledgers, and processor trade-offs.",
    difficulty: "advanced",
    minutes: 44,
    tags: ["case-study", "payments"],
    blocks: [
      {
        type: "diagram",
        title: "System architecture",
        kind: "payment-arch",
        caption: "DB txn writes ledger + outbox · worker talks to processor · webhook + reconcile close the loop.",
      },
      {
        type: "tradeoff",
        title: "Ledger: balance column vs double-entry log",
        choices: [
          {
            label: "A — Mutable balance column",
            pros: ["Simple reads", "Easy for tiny apps"],
            cons: ["Hard to audit", "Racey updates", "Bugs silently drift money"],
            when: "Never for real money at scale",
          },
          {
            label: "B — Append-only double-entry ledger",
            pros: ["Auditable", "Balances derived", "Bugs show up as imbalance"],
            cons: ["More tables/events", "Need careful idempotency"],
            when: "Any serious payments product — default choice",
          },
        ],
      },
      {
        type: "tradeoff",
        title: "Processor confirmation",
        choices: [
          {
            label: "A — Trust sync HTTP only",
            pros: ["Feels simple"],
            cons: ["Lost responses cause double-charge or wrong UI state"],
            when: "Don't — always pair with webhooks + reconcile",
          },
          {
            label: "B — Pending → webhook/settle + nightly reconcile",
            pros: ["Correct under retries", "Matches how processors work"],
            cons: ["UX must handle pending states"],
            when: "Production payments (always)",
          },
        ],
      },
      {
        type: "answer",
        opening: "I'd start with idempotency keys and a double-entry ledger before naming Stripe.",
        beats: [
          "Draw pending ledger + outbox.",
          "Explain why sync HTTP isn't enough.",
          "Webhook updates settled/failed; reconcile catches drift.",
        ],
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
