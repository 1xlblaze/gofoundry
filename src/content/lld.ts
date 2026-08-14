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
  {
    slug: "elevator-system-lld",
    track: "lld",
    title: "LLD: Elevator System",
    subtitle: "Requests, direction state machine, and dispatch strategy.",
    difficulty: "advanced",
    minutes: 34,
    tags: ["ood", "state-machine"],
    blocks: [
      {
        type: "think",
        title: "HEAT · Hear",
        clarify: [
          "How many elevators, how many floors?",
          "External hall calls (up/down buttons) vs internal cabin requests?",
          "Optimize for wait time, or simplest correct dispatch?",
        ],
        model: [
          "Elevator = state machine: Idle, MovingUp, MovingDown, DoorsOpen",
          "SCAN-like algorithm: keep moving one direction, serve requests along the way",
          "Dispatcher picks the best elevator per hall call (nearest, same-direction)",
        ],
      },
      {
        type: "code",
        title: "Core types and SCAN dispatch",
        language: "go",
        code: `type Direction int

const (
	Idle Direction = iota
	Up
	Down
)

type Elevator struct {
	ID           int
	CurrentFloor int
	Dir          Direction
	Requests     map[int]bool // floors requested, either hall or cabin
}

func (e *Elevator) Step() {
	switch e.Dir {
	case Up:
		e.CurrentFloor++
	case Down:
		e.CurrentFloor--
	}
	if e.Requests[e.CurrentFloor] {
		delete(e.Requests, e.CurrentFloor) // doors open, serve
	}
	if !e.hasRequestsAhead() {
		e.Dir = e.nextDirectionOrIdle()
	}
}

type Dispatcher struct{ elevators []*Elevator }

func (d *Dispatcher) Assign(floor int, dir Direction) *Elevator {
	best, bestCost := (*Elevator)(nil), math.MaxInt
	for _, e := range d.elevators {
		cost := abs(e.CurrentFloor - floor)
		if e.Dir != Idle && e.Dir != dir {
			cost += 1000 // heavy penalty for wrong-direction elevators
		}
		if cost < bestCost {
			best, bestCost = e, cost
		}
	}
	best.Requests[floor] = true
	return best
}`,
      },
      {
        type: "answer",
        opening: "I'd model each elevator as a state machine and dispatch hall calls by minimal cost.",
        beats: [
          "Draw the Idle/Up/Down/DoorsOpen states and transitions.",
          "Explain SCAN: continue one direction, serving requests, before reversing.",
          "Discuss dispatch cost function (distance + direction penalty).",
          "Extensions: capacity limits, VIP floors, out-of-service elevators.",
        ],
      },
    ],
    quiz: [
      {
        id: "elev1",
        prompt: "Why does SCAN avoid reversing direction mid-way if requests remain ahead?",
        options: [
          "It's arbitrary",
          "Continuing one direction until no more requests lie ahead reduces total direction changes and average wait",
          "Elevators cannot reverse physically",
          "It only works with one elevator",
        ],
        answerIndex: 1,
        explanation: "SCAN (elevator algorithm) minimizes costly direction reversals, similar to disk-arm scheduling.",
      },
    ],
  },
  {
    slug: "tic-tac-toe-lld",
    track: "lld",
    title: "LLD: Tic-Tac-Toe (Generalized N×N)",
    subtitle: "Extensible board games, win detection in O(1) per move, and player abstraction.",
    difficulty: "beginner",
    minutes: 22,
    tags: ["ood", "games"],
    blocks: [
      {
        type: "prose",
        title: "The interview trap",
        body: "Most candidates check all rows/columns/diagonals after every move — O(n) per move. Interviewers reward tracking running counts per row, column, and both diagonals, updated incrementally in O(1) per move, generalized to N×N.",
      },
      {
        type: "code",
        title: "O(1) win detection with running counts",
        language: "go",
        code: `type Board struct {
	n           int
	rows, cols  []int // signed sum: +1 per X, -1 per O
	diag, anti  int
}

func NewBoard(n int) *Board {
	return &Board{n: n, rows: make([]int, n), cols: make([]int, n)}
}

// player: +1 for X, -1 for O
func (b *Board) Move(row, col, player int) (winner bool) {
	b.rows[row] += player
	b.cols[col] += player
	if row == col {
		b.diag += player
	}
	if row+col == b.n-1 {
		b.anti += player
	}
	target := player * b.n
	return b.rows[row] == target || b.cols[col] == target ||
		b.diag == target || b.anti == target
}`,
      },
      {
        type: "complexity",
        time: "O(1) per move for win check, vs O(n) naive",
        space: "O(n) for row/col counters",
      },
      {
        type: "steps",
        title: "Extensibility to discuss",
        items: [
          "Player interface for human vs AI (minimax) vs remote",
          "Undo/redo via a move stack",
          "Generalize to Connect-4-style gravity boards",
        ],
      },
    ],
    quiz: [
      {
        id: "ttt1",
        prompt: "Why use signed running sums instead of storing 'X'/'O' and scanning?",
        options: [
          "It's a stylistic preference only",
          "It turns win detection into an O(1) arithmetic check per move instead of O(n) per move",
          "Go cannot store characters in arrays",
          "It reduces the board size",
        ],
        answerIndex: 1,
        explanation: "Incrementally maintained counts avoid re-scanning the board on every move.",
      },
    ],
  },
  {
    slug: "vending-machine-lld",
    track: "lld",
    title: "LLD: Vending Machine",
    subtitle: "State machine for coins, selection, dispensing, and change.",
    difficulty: "intermediate",
    minutes: 26,
    tags: ["ood", "state-machine"],
    blocks: [
      {
        type: "diagram",
        kind: "heat-cycle",
        title: "State machine etch (relabel for this domain)",
        caption: "Idle → HasMoney → Dispensing → ReturnChange, looping back to Idle.",
      },
      {
        type: "prose",
        title: "State pattern in Go without a class hierarchy",
        body: "Model states as an interface with methods like InsertCoin, SelectItem, Dispense — each concrete state implements only the transitions valid from it, returning the next state. This avoids a giant switch statement scattered with flags.",
      },
      {
        type: "code",
        title: "State interface + machine",
        language: "go",
        code: `type State interface {
	InsertCoin(m *Machine, cents int) State
	SelectItem(m *Machine, code string) State
	Dispense(m *Machine) State
}

type idleState struct{}

func (idleState) InsertCoin(m *Machine, cents int) State {
	m.balance += cents
	return hasMoneyState{}
}
func (idleState) SelectItem(m *Machine, code string) State { return idleState{} } // no-op
func (idleState) Dispense(m *Machine) State                { return idleState{} }

type hasMoneyState struct{}

func (hasMoneyState) InsertCoin(m *Machine, cents int) State {
	m.balance += cents
	return hasMoneyState{}
}
func (s hasMoneyState) SelectItem(m *Machine, code string) State {
	item, ok := m.inventory[code]
	if !ok || item.Price > m.balance {
		return s
	}
	m.selected = code
	return dispensingState{}
}
func (hasMoneyState) Dispense(m *Machine) State { return hasMoneyState{} }

type Machine struct {
	state     State
	balance   int
	inventory map[string]Item
	selected  string
}`,
      },
      {
        type: "callout",
        tone: "tip",
        body: "The State pattern shines here: adding a 'Maintenance' or 'OutOfStock' state means adding one new type, not editing a central conditional.",
      },
    ],
    quiz: [
      {
        id: "vm1",
        prompt: "Main benefit of the State pattern over a status enum + switch?",
        options: [
          "It runs faster at the CPU level",
          "Each state owns its own valid transitions, so invalid transitions can't silently fall through",
          "It removes the need for structs",
          "It requires less code always",
        ],
        answerIndex: 1,
        explanation: "Encapsulating transition logic per state avoids a sprawling, error-prone switch with implicit invariants.",
      },
    ],
  },
  {
    slug: "library-management-lld",
    track: "lld",
    title: "LLD: Library Management System",
    subtitle: "Book/copy modeling, holds, fines, and search — a classic OOD warm-up.",
    difficulty: "intermediate",
    minutes: 28,
    tags: ["ood"],
    blocks: [
      {
        type: "prose",
        title: "Separate the abstract Book from physical BookCopy",
        body: "A Book (title, author, ISBN) can have many BookCopy instances (physical items), each with its own status (Available, CheckedOut, Reserved, Lost). This mirrors reality and avoids conflating catalog metadata with inventory state.",
      },
      {
        type: "code",
        title: "Core domain and checkout flow",
        language: "go",
        code: `type CopyStatus int

const (
	Available CopyStatus = iota
	CheckedOut
	Reserved
	Lost
)

type BookCopy struct {
	ID     string
	ISBN   string
	Status CopyStatus
	DueAt  time.Time
}

type Library struct {
	mu    sync.Mutex
	copies map[string]*BookCopy
	loans  map[string]string // copyID -> memberID
}

func (l *Library) Checkout(copyID, memberID string) error {
	l.mu.Lock()
	defer l.mu.Unlock()
	c, ok := l.copies[copyID]
	if !ok || c.Status != Available {
		return fmt.Errorf("copy %s not available", copyID)
	}
	c.Status = CheckedOut
	c.DueAt = time.Now().AddDate(0, 0, 14)
	l.loans[copyID] = memberID
	return nil
}

func (l *Library) Return(copyID string) (fineCents int) {
	l.mu.Lock()
	defer l.mu.Unlock()
	c := l.copies[copyID]
	if time.Now().After(c.DueAt) {
		days := int(time.Since(c.DueAt).Hours() / 24)
		fineCents = days * 25
	}
	c.Status = Available
	delete(l.loans, copyID)
	return fineCents
}`,
      },
      {
        type: "steps",
        title: "Extension points to raise in an interview",
        items: [
          "Reservation queue when all copies are checked out",
          "Search index (by title/author/ISBN) — separate read-optimized store",
          "Notification service for due-date reminders (reuse the Notification LLD)",
        ],
      },
    ],
    quiz: [
      {
        id: "lib1",
        prompt: "Why separate Book (catalog) from BookCopy (inventory)?",
        options: [
          "It's unnecessary complexity",
          "A title can have multiple physical copies with independent availability and condition",
          "Go requires two types for every entity",
          "To avoid using maps",
        ],
        answerIndex: 1,
        explanation: "Modeling cardinality correctly (one Book, many BookCopies) avoids awkward state on a single entity.",
      },
    ],
  },
];
