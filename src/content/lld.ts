import type { Lesson } from "./types";

export const lldLessons: Lesson[] = [
  {
    slug: "solid-in-go",
    track: "lld",
    title: "SOLID in Go",
    subtitle: "Applying SOLID with packages, interfaces, and composition.",
    difficulty: "intermediate",
    minutes: 30,
    tags: ["solid", "design"],
    blocks: [
      {
        type: "prose",
        title: "Go-flavored SOLID",
        body: "S: one reason to change per type/package. O: extend via new types satisfying interfaces, not giant switch edits. L: behave as the interface promises. I: small interfaces (segregate). D: depend on abstractions at boundaries (Store, Clock, Publisher).",
      },
      {
        type: "code",
        title: "Dependency inversion at the edge",
        language: "go",
        code: `type Clock interface{ Now() time.Time }

type OrderService struct {
	store Store
	clock Clock
	bus   Publisher
}

func (s *OrderService) Place(ctx context.Context, cmd PlaceOrder) error {
	o := Order{ID: newID(), At: s.clock.Now(), Items: cmd.Items}
	if err := s.store.Save(ctx, o); err != nil {
		return err
	}
	return s.bus.Publish(ctx, OrderPlaced{ID: o.ID})
}`,
      },
      {
        type: "callout",
        tone: "tip",
        body: "Do not interface everything. Abstract where you need tests or multiple implementations; keep internals concrete.",
      },
    ],
    quiz: [
      {
        id: "solid1",
        prompt: "Interface segregation in Go usually means…",
        options: [
          "One mega interface for the app",
          "Many small interfaces defined near consumers",
          "No interfaces at all",
          "Interfaces only in /pkg",
        ],
        answerIndex: 1,
        explanation: "Small, consumer-defined interfaces keep deps narrow.",
      },
    ],
  },
  {
    slug: "strategy-factory-observer",
    track: "lld",
    title: "Strategy, Factory & Observer",
    subtitle: "Classic patterns mapped to idiomatic Go.",
    difficulty: "intermediate",
    minutes: 28,
    tags: ["patterns"],
    blocks: [
      {
        type: "prose",
        title: "Patterns without ceremony",
        body: "Strategy = interface with interchangeable implementations. Factory = constructor functions / registries. Observer = callbacks or channels / event bus. Prefer functions and interfaces over class hierarchies.",
      },
      {
        type: "code",
        title: "Strategy + simple factory registry",
        language: "go",
        code: `type Hasher interface{ Sum([]byte) string }

type MD5 struct{}
func (MD5) Sum(b []byte) string { return fmt.Sprintf("%x", md5.Sum(b)) }

type SHA256 struct{}
func (SHA256) Sum(b []byte) string { return fmt.Sprintf("%x", sha256.Sum256(b)) }

func NewHasher(name string) (Hasher, error) {
	switch name {
	case "md5":
		return MD5{}, nil
	case "sha256":
		return SHA256{}, nil
	default:
		return nil, fmt.Errorf("unknown hasher %q", name)
	}
}`,
      },
    ],
    quiz: [
      {
        id: "pat1",
        prompt: "Strategy pattern in Go is typically…",
        options: [
          "Inheritance trees",
          "An interface with pluggable implementations",
          "Global mutable function pointers only",
          "A Kubernetes CRD",
        ],
        answerIndex: 1,
        explanation: "Swap behaviors by injecting different interface implementations.",
      },
    ],
  },
  {
    slug: "rate-limiter-lld",
    track: "lld",
    title: "LLD: Rate Limiter",
    subtitle: "Token bucket and sliding window designs in Go.",
    difficulty: "intermediate",
    minutes: 35,
    tags: ["rate-limit", "concurrency"],
    blocks: [
      {
        type: "diagram",
        kind: "token-bucket",
        title: "Limiter etch",
        caption: "Capacity = burst. Refill rate = sustained QPS.",
      },
      {
        type: "answer",
        opening: "I'd clarify key granularity, burst vs smooth, and single-node vs Redis.",
        beats: [
          "Draw token bucket with capacity and refill.",
          "Discuss mutex / Redis+Lua for distributed.",
          "Fail-open vs fail-closed on dependency loss.",
        ],
      },
      {
        type: "prose",
        title: "Requirements",
        body: "Allow N requests per window per key (IP/user). Must be concurrency-safe. Optional burst. Discuss in-memory vs Redis for multi-instance. Algorithms: fixed window (simple, bursty at edges), sliding window log/counter, token bucket, leaky bucket.",
      },
      {
        type: "code",
        title: "Token bucket (per process)",
        language: "go",
        code: `type TokenBucket struct {
	mu         sync.Mutex
	tokens     float64
	capacity   float64
	refillPerS float64
	last       time.Time
}

func NewTokenBucket(capacity, refillPerS float64) *TokenBucket {
	return &TokenBucket{
		tokens: capacity, capacity: capacity,
		refillPerS: refillPerS, last: time.Now(),
	}
}

func (b *TokenBucket) Allow() bool {
	b.mu.Lock()
	defer b.mu.Unlock()
	now := time.Now()
	elapsed := now.Sub(b.last).Seconds()
	b.last = now
	b.tokens += elapsed * b.refillPerS
	if b.tokens > b.capacity {
		b.tokens = b.capacity
	}
	if b.tokens < 1 {
		return false
	}
	b.tokens--
	return true
}`,
      },
      {
        type: "steps",
        title: "Interview checklist",
        items: [
          "Clarify key granularity and limits",
          "Single node vs distributed",
          "Burst vs smooth shaping",
          "Failure mode: fail open vs closed",
          "Observability: metrics for rejects",
        ],
      },
    ],
    quiz: [
      {
        id: "rl1",
        prompt: "Token bucket allows bursts up to…",
        options: ["Infinity", "The bucket capacity", "GOMAXPROCS", "TCP window size only"],
        answerIndex: 1,
        explanation: "Capacity caps how many tokens (requests) can be saved for bursts.",
      },
    ],
  },
  {
    slug: "lru-cache-lld",
    track: "lld",
    title: "LLD: LRU Cache",
    subtitle: "Hash map + doubly linked list with capacity eviction.",
    difficulty: "intermediate",
    minutes: 30,
    tags: ["cache", "lru"],
    blocks: [
      {
        type: "prose",
        title: "Design",
        body: "O(1) get/put with capacity. Map key → node; list maintains recency (head=MRU, tail=LRU). On get: move to head. On put: update/move or insert; if over capacity, evict tail. Add mutex for concurrent use.",
      },
      {
        type: "code",
        title: "LRU sketch",
        language: "go",
        code: `type node struct {
	key, val   int
	prev, next *node
}

type LRUCache struct {
	cap        int
	items      map[int]*node
	head, tail *node
}

func Constructor(capacity int) LRUCache {
	h, t := &node{}, &node{}
	h.next, t.prev = t, h
	return LRUCache{cap: capacity, items: map[int]*node{}, head: h, tail: t}
}

func (c *LRUCache) Get(key int) int {
	n, ok := c.items[key]
	if !ok {
		return -1
	}
	c.moveToHead(n)
	return n.val
}`,
      },
      {
        type: "complexity",
        time: "O(1) get/put average",
        space: "O(capacity)",
      },
    ],
    quiz: [
      {
        id: "lru1",
        prompt: "Why pair a map with a doubly linked list for LRU?",
        options: [
          "Lists sort faster than maps",
          "Map gives O(1) lookup; list gives O(1) reorder/evict",
          "GC requires lists",
          "To avoid hashing",
        ],
        answerIndex: 1,
        explanation: "Together they provide O(1) access and O(1) recency updates.",
      },
    ],
  },
  {
    slug: "url-shortener-lld",
    track: "lld",
    title: "LLD: URL Shortener",
    subtitle: "API, ID generation, storage schema, and collisions.",
    difficulty: "intermediate",
    minutes: 35,
    tags: ["url-shortener"],
    blocks: [
      {
        type: "prose",
        title: "Components",
        body: "API: POST /shorten → code; GET /{code} → 302 redirect. ID generation: counter+Base62, hash+truncate with collision retry, or UUID truncated (worse). Store: code → long URL, created_at, optional expiry & user_id. Analytics optional async.",
      },
      {
        type: "code",
        title: "Base62 encode",
        language: "go",
        code: `const alphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

func ToBase62(n uint64) string {
	if n == 0 {
		return "0"
	}
	var b [11]byte
	i := len(b)
	for n > 0 {
		i--
		b[i] = alphabet[n%62]
		n /= 62
	}
	return string(b[i:])
}`,
      },
      {
        type: "steps",
        title: "Class diagram (logical)",
        items: [
          "ShortenService depends on IDGenerator + URLRepository",
          "HTTP handler translates DTOs ↔ domain",
          "Redirect path is read-heavy — cache layer optional",
          "Unique index on code; optional unique on long URL for idempotency",
        ],
      },
    ],
    quiz: [
      {
        id: "us1",
        prompt: "A common ID strategy for short codes is…",
        options: [
          "Only MD5 of URL with no collision handling",
          "Monotonic ID encoded as Base62",
          "Store the full URL as the path",
          "Use port numbers",
        ],
        answerIndex: 1,
        explanation: "Counters/snowflakes + Base62 produce compact unique codes.",
      },
    ],
  },
  {
    slug: "parking-lot-lld",
    track: "lld",
    title: "LLD: Parking Lot",
    subtitle: "Spots, vehicles, allocation strategies, and fees.",
    difficulty: "intermediate",
    minutes: 32,
    tags: ["ood"],
    blocks: [
      {
        type: "prose",
        title: "Model",
        body: "Vehicle types (bike/car/bus) map to spot sizes. ParkingLot has floors → spots. Ticket issued on entry; fee calculator on exit. Strategy for finding next spot (nearest, balanced floors). Thread-safe allocation under concurrency.",
      },
      {
        type: "code",
        title: "Core types",
        language: "go",
        code: `type SpotSize int
const (
	Bike SpotSize = iota
	Car
	Bus
)

type Spot struct {
	ID       string
	Size     SpotSize
	Occupied bool
	Vehicle  *Vehicle
}

type ParkingLot struct {
	mu    sync.Mutex
	spots []*Spot
	fees  FeePolicy
}

func (p *ParkingLot) Park(v Vehicle) (*Ticket, error) {
	p.mu.Lock()
	defer p.mu.Unlock()
	for _, s := range p.spots {
		if !s.Occupied && s.Size >= v.Size {
			s.Occupied, s.Vehicle = true, &v
			return &Ticket{SpotID: s.ID, In: time.Now()}, nil
		}
	}
	return nil, errFull
}`,
      },
    ],
    quiz: [
      {
        id: "pl1",
        prompt: "Why use a strategy for spot allocation?",
        options: [
          "To avoid structs",
          "So policies (nearest, even fill) can change without rewriting the lot core",
          "Because SQL requires it",
          "To disable concurrency",
        ],
        answerIndex: 1,
        explanation: "Strategy isolates allocation policy from the parking lot aggregate.",
      },
    ],
  },
  {
    slug: "notification-system-lld",
    track: "lld",
    title: "LLD: Notification System",
    subtitle: "Channels, templates, retries, and fan-out.",
    difficulty: "advanced",
    minutes: 34,
    tags: ["notifications"],
    blocks: [
      {
        type: "prose",
        title: "Design sketch",
        body: "NotificationService accepts a NotifyCommand (user, template, data, channels). TemplateRenderer fills content. ChannelSender interface: Email, SMS, Push. Outbox/queue for async delivery; retry with backoff; idempotency keys; preference service for opt-out.",
      },
      {
        type: "code",
        title: "Sender interface",
        language: "go",
        code: `type Sender interface {
	Send(ctx context.Context, msg Message) error
}

type Dispatcher struct {
	senders map[Channel]Sender
	prefs   PreferenceService
}

func (d *Dispatcher) Dispatch(ctx context.Context, n Notification) error {
	channels := d.prefs.ChannelsFor(ctx, n.UserID, n.Kind)
	var errs []error
	for _, ch := range channels {
		s, ok := d.senders[ch]
		if !ok {
			continue
		}
		if err := s.Send(ctx, n.ToMessage(ch)); err != nil {
			errs = append(errs, err)
		}
	}
	return errors.Join(errs...)
}`,
      },
    ],
    quiz: [
      {
        id: "ns1",
        prompt: "Why put notifications on a queue?",
        options: [
          "Queues make email HTML prettier",
          "Decouple request latency from slow providers and enable retries",
          "To avoid interfaces",
          "Because SMTP forbids sync calls",
        ],
        answerIndex: 1,
        explanation: "Async delivery absorbs provider latency and supports retry/backoff.",
      },
    ],
  },
  {
    slug: "connection-pool-lld",
    track: "lld",
    title: "LLD: Connection Pool",
    subtitle: "Acquire/release, health checks, and idle timeouts.",
    difficulty: "advanced",
    minutes: 28,
    tags: ["pooling"],
    blocks: [
      {
        type: "prose",
        title: "Requirements",
        body: "Max open connections, max idle, max lifetime, borrow timeout. Protect against thundering herd. In Go, database/sql already pools — knowing the design helps you tune SetMaxOpenConns / SetConnMaxLifetime and build pools for other resources (gRPC, SSH).",
      },
      {
        type: "steps",
        title: "Lifecycle",
        items: [
          "Acquire: reuse idle or open new if under max",
          "Use: caller owns until release",
          "Release: health check; discard bad; idle queue",
          "Reaper: close idle/expired conns",
        ],
      },
    ],
    quiz: [
      {
        id: "cp1",
        prompt: "SetMaxOpenConns primarily prevents…",
        options: [
          "DNS failures",
          "Overwhelming the database with too many concurrent connections",
          "GC pauses",
          "JSON encoding costs",
        ],
        answerIndex: 1,
        explanation: "Caps concurrent DB connections from that process.",
      },
    ],
  },
];
