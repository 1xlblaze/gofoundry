import type { Lesson } from "./types";

export const lldLessons: Lesson[] = [
  {
    slug: "solid-in-go",
    track: "lld",
    title: "SOLID in Go",
    subtitle: "Use cohesive packages, consumer-owned interfaces, and composition without ceremony.",
    difficulty: "intermediate",
    minutes: 45,
    tags: ["solid", "design", "interfaces", "testing"],
    prerequisites: ["Go interfaces", "package design", "table-driven tests"],
    blocks: [
      {
        type: "steps",
        title: "Learning goals",
        items: [
          "Translate each SOLID principle into idiomatic Go rather than class hierarchies.",
          "Place small interfaces at consumer boundaries and keep implementation details concrete.",
          "Design an application service whose invariants and side effects are independently testable.",
          "Recognize over-abstraction, leaky contracts, and unsafe substitutability.",
        ],
      },
      {
        type: "think",
        title: "HEAT · Hear and establish",
        clarify: [
          "Which behavior changes independently and which dependencies cross process boundaries?",
          "Which collaborators need substitutes in tests or multiple production implementations?",
          "What semantic guarantees must every implementation preserve?",
          "Is the design a reusable package or an application-internal use case?",
        ],
        model: [
          "Cohesive package and type boundaries express single responsibility.",
          "Consumer-owned interfaces express only the operations a use case needs.",
          "Constructors inject stable dependencies; methods receive request data and context.",
        ],
        pitfalls: [
          "Creating an interface for every struct before a second behavior exists.",
          "Returning concrete implementation errors that break substitutability.",
          "Confusing one-method files with one responsibility.",
        ],
      },
      {
        type: "prose",
        title: "SOLID through Go's strengths",
        body: "Single responsibility is about one axis of change: an Invoice should enforce invoice rules, while rendering and persistence change for different reasons. Open/closed often appears as adding a new type that satisfies a narrow interface or injecting a function—not subclassing. Liskov substitution is semantic: every Store must honor context cancellation and not return a successful zero value for absence. Interface segregation follows naturally from tiny consumer-defined interfaces. Dependency inversion places abstractions around volatile I/O boundaries while pure domain code remains concrete.",
      },
      {
        type: "code",
        title: "Cohesive application boundary",
        language: "go",
        code: `var (
	ErrOrderNotFound = errors.New("order not found")
	ErrAlreadyPaid   = errors.New("order already paid")
)

type OrderStore interface {
	WithOrder(ctx context.Context, id string, fn func(*Order) error) error
}

type Charger interface {
	Charge(ctx context.Context, request ChargeRequest) (ChargeReceipt, error)
}

type EventWriter interface {
	Append(ctx context.Context, event Event) error
}

type Clock interface{ Now() time.Time }

type CheckoutService struct {
	orders OrderStore
	charge Charger
	events EventWriter
	clock  Clock
}

func NewCheckoutService(o OrderStore, c Charger, e EventWriter, clock Clock) (*CheckoutService, error) {
	if o == nil || c == nil || e == nil || clock == nil {
		return nil, errors.New("checkout dependencies are required")
	}
	return &CheckoutService{orders: o, charge: c, events: e, clock: clock}, nil
}`,
      },
      {
        type: "code",
        title: "Core flow delegates rules to the aggregate",
        language: "go",
        code: `func (s *CheckoutService) Pay(ctx context.Context, orderID, key string) error {
	return s.orders.WithOrder(ctx, orderID, func(order *Order) error {
		if err := order.BeginPayment(key, s.clock.Now()); err != nil {
			return err
		}
		receipt, err := s.charge.Charge(ctx, ChargeRequest{
			OrderID: order.ID, Amount: order.Total, IdempotencyKey: key,
		})
		if err != nil {
			order.PaymentFailed(err.Error(), s.clock.Now())
			return fmt.Errorf("charge order: %w", err)
		}
		event, err := order.MarkPaid(receipt.ID, s.clock.Now())
		if err != nil {
			return err
		}
		return s.events.Append(ctx, event)
	})
}

// Function adapters are often enough for one-method strategies.
type ClockFunc func() time.Time
func (f ClockFunc) Now() time.Time { return f() }`,
      },
      {
        type: "code",
        title: "A focused contract test for substitutability",
        language: "go",
        code: `func StoreContract(t *testing.T, newStore func(t *testing.T) OrderStore) {
	t.Helper()
	t.Run("missing order has stable error", func(t *testing.T) {
		store := newStore(t)
		err := store.WithOrder(context.Background(), "missing", func(*Order) error {
			t.Fatal("callback must not run")
			return nil
		})
		if !errors.Is(err, ErrOrderNotFound) {
			t.Fatalf("error = %v, want ErrOrderNotFound", err)
		}
	})
	t.Run("honors canceled context", func(t *testing.T) {
		store := newStore(t)
		ctx, cancel := context.WithCancel(context.Background())
		cancel()
		err := store.WithOrder(ctx, "any", func(*Order) error { return nil })
		if !errors.Is(err, context.Canceled) {
			t.Fatalf("error = %v, want context.Canceled", err)
		}
	})
}`,
      },
      {
        type: "steps",
        title: "Worked design walkthrough",
        items: [
          "Identify checkout's one use case and keep HTTP, SQL, and provider SDK types outside it.",
          "Define OrderStore, Charger, EventWriter, and Clock beside CheckoutService using only needed methods.",
          "Put payment-state invariants on Order; the service coordinates dependencies and transaction boundaries.",
          "Inject fakes to exercise declines, duplicate keys, cancellation, and event failures deterministically.",
          "Run one shared contract suite against memory and SQL stores to verify semantic substitutability.",
        ],
      },
      {
        type: "prose",
        title: "Failure modes, concurrency, and extensions",
        body: "Interfaces do not create atomicity. If payment and order persistence cross systems, add an operation record, provider idempotency, and outbox rather than pretending one method call is transactional. WithOrder must document locking or optimistic version behavior; a callback held under a database transaction must not perform a slow remote charge. A better production flow may reserve state, commit, call the provider, then reconcile. Avoid package cycles by moving orchestration inward and adapters outward. Extend with a RefundPolicy or FraudChecker only when the use case needs those variations.",
      },
      {
        type: "tradeoff",
        title: "Where should abstraction live?",
        choices: [
          {
            label: "Concrete type",
            pros: ["Simple navigation and construction", "Full API remains available"],
            cons: ["Harder to substitute at volatile boundaries", "Can expose implementation details"],
            when: "Use for stable internal collaborators and pure domain types.",
          },
          {
            label: "Consumer-owned interface",
            pros: ["Narrow dependency", "Easy fakes and alternate adapters"],
            cons: ["Semantic contract needs documentation", "Too many tiny interfaces can fragment design"],
            when: "Use at I/O boundaries or where behavior genuinely varies.",
          },
          {
            label: "Injected function",
            pros: ["Minimal ceremony", "Excellent for one behavior"],
            cons: ["Awkward when methods share lifecycle or state", "Less discoverable as behavior grows"],
            when: "Use for clocks, ID creation, predicates, and small policies.",
          },
        ],
      },
      {
        type: "answer",
        title: "HEAT · Interview answer",
        opening: "I apply SOLID by isolating axes of change and defining the smallest semantic contracts the consumer needs.",
        beats: [
          "Keep domain rules concrete and cohesive; separate transport, persistence, and provider adapters.",
          "Inject small consumer-owned interfaces at volatile boundaries.",
          "Explain substitutability in terms of errors, cancellation, ordering, and side effects.",
          "Use constructors for invariant dependencies and table-driven fakes for behavior.",
          "Call out transaction and concurrency semantics because interfaces alone do not guarantee either.",
        ],
        closing: "The goal is replaceable behavior with less coupling, not the maximum possible number of interfaces.",
      },
    ],
    quiz: [
      {
        id: "solid-1",
        prompt: "Who should usually define a small Go interface?",
        options: ["The implementation package", "The consuming package", "The compiler", "The database"],
        answerIndex: 1,
        explanation: "The consumer knows the minimal behavior it requires.",
      },
      {
        id: "solid-2",
        prompt: "What does Liskov substitution require beyond matching methods?",
        options: ["Identical field layout", "Compatible semantic behavior and guarantees", "The same package name", "No errors"],
        answerIndex: 1,
        explanation: "Callers rely on error, cancellation, ordering, and side-effect semantics.",
      },
      {
        id: "solid-3",
        prompt: "When is an injected function preferable?",
        options: ["For every database", "For a small single behavior such as a clock", "Only with reflection", "Never"],
        answerIndex: 1,
        explanation: "Function types are an idiomatic lightweight strategy.",
      },
      {
        id: "solid-4",
        prompt: "Does dependency inversion make a cross-system operation atomic?",
        options: ["Yes", "No; explicit transaction and recovery design is still required", "Only in tests", "Only with generics"],
        answerIndex: 1,
        explanation: "Abstraction controls coupling, not distributed consistency.",
      },
    ],
  },
  {
    slug: "strategy-factory-observer",
    track: "lld",
    title: "Strategy, Factory, and Observer in Go",
    subtitle: "Combine pluggable policies, validated construction, and bounded event delivery.",
    difficulty: "intermediate",
    minutes: 45,
    tags: ["patterns", "strategy", "factory", "observer"],
    prerequisites: ["interfaces", "channels", "constructors"],
    blocks: [
      {
        type: "steps",
        title: "Learning goals",
        items: [
          "Use Strategy for business policy that varies independently.",
          "Use constructors and registries as factories without hiding dependency wiring.",
          "Design Observer semantics for synchronous callbacks or asynchronous delivery.",
          "Define ownership, ordering, backpressure, and unsubscribe behavior.",
        ],
      },
      {
        type: "think",
        title: "HEAT · Hear and establish",
        clarify: [
          "Must strategies be selectable at startup or per request?",
          "Does observer failure fail the business operation or only monitoring?",
          "Are events in-process notifications or durable integration facts?",
          "What ordering and concurrency guarantees do subscribers require?",
        ],
        model: [
          "Strategy is behavior behind a narrow contract or function type.",
          "Factory validates configuration and returns a ready object.",
          "Observer is a delivery contract; reliability requirements determine callback, channel, or outbox.",
        ],
        pitfalls: [
          "Global registries mutated concurrently.",
          "Calling unknown callbacks while holding publisher locks.",
          "Treating an in-memory event bus as durable messaging.",
        ],
      },
      {
        type: "prose",
        title: "Patterns describe forces, not required shapes",
        body: "Go replaces inheritance-heavy pattern diagrams with interfaces, functions, structs, and explicit constructors. A shipping quote can select a PricingStrategy without changing checkout. A factory can validate a provider configuration and build the concrete client. An observer can notify metrics synchronously, but integration events that must survive crashes belong in a transactional outbox. Name the semantics first: whether callbacks run serially, whether errors aggregate, and whether subscription changes take effect during a publish.",
      },
      {
        type: "code",
        title: "Strategy and function adapter",
        language: "go",
        code: `type QuoteInput struct {
	WeightGrams int
	DistanceKM  int
	Priority    bool
}

type PricingStrategy interface {
	Quote(ctx context.Context, input QuoteInput) (Money, error)
}

type PricingFunc func(context.Context, QuoteInput) (Money, error)
func (f PricingFunc) Quote(ctx context.Context, in QuoteInput) (Money, error) {
	return f(ctx, in)
}

type Checkout struct {
	pricing PricingStrategy
}

func (c *Checkout) ShippingTotal(ctx context.Context, cart Cart) (Money, error) {
	input := QuoteInput{
		WeightGrams: cart.TotalWeight(),
		DistanceKM: cart.DeliveryDistance(),
		Priority: cart.Priority,
	}
	price, err := c.pricing.Quote(ctx, input)
	if err != nil {
		return Money{}, fmt.Errorf("quote shipping: %w", err)
	}
	return price, nil
}`,
      },
      {
        type: "code",
        title: "Factory registry frozen after startup",
        language: "go",
        code: `type ProviderConfig struct {
	Kind    string
	BaseURL string
	APIKey  string
}

type PricingFactory func(ProviderConfig) (PricingStrategy, error)

type FactoryRegistry map[string]PricingFactory

func (r FactoryRegistry) Build(cfg ProviderConfig) (PricingStrategy, error) {
	factory, ok := r[cfg.Kind]
	if !ok {
		return nil, fmt.Errorf("pricing provider %q: %w", cfg.Kind, ErrUnsupported)
	}
	strategy, err := factory(cfg)
	if err != nil {
		return nil, fmt.Errorf("configure pricing provider %q: %w", cfg.Kind, err)
	}
	return strategy, nil
}

func newHTTPPricing(cfg ProviderConfig) (PricingStrategy, error) {
	if cfg.BaseURL == "" || cfg.APIKey == "" {
		return nil, errors.New("base URL and API key are required")
	}
	return &HTTPPricing{baseURL: cfg.BaseURL, key: cfg.APIKey, client: &http.Client{
		Timeout: 2 * time.Second,
	}}, nil
}`,
      },
      {
        type: "code",
        title: "Snapshotting synchronous observer",
        language: "go",
        code: `type OrderObserver interface {
	OnOrderEvent(context.Context, OrderEvent) error
}

type ObserverFunc func(context.Context, OrderEvent) error
func (f ObserverFunc) OnOrderEvent(ctx context.Context, e OrderEvent) error { return f(ctx, e) }

type Subject struct {
	mu        sync.RWMutex
	nextID    uint64
	observers map[uint64]OrderObserver
}

func (s *Subject) Subscribe(o OrderObserver) (unsubscribe func()) {
	s.mu.Lock()
	s.nextID++
	id := s.nextID
	s.observers[id] = o
	s.mu.Unlock()
	var once sync.Once
	return func() {
		once.Do(func() {
			s.mu.Lock()
			delete(s.observers, id)
			s.mu.Unlock()
		})
	}
}

func (s *Subject) Publish(ctx context.Context, event OrderEvent) error {
	s.mu.RLock()
	list := make([]OrderObserver, 0, len(s.observers))
	for _, observer := range s.observers { list = append(list, observer) }
	s.mu.RUnlock()
	var errs []error
	for _, observer := range list {
		if err := observer.OnOrderEvent(ctx, event); err != nil { errs = append(errs, err) }
	}
	return errors.Join(errs...)
}`,
      },
      {
        type: "steps",
        title: "Worked flow: shipping quote and event",
        items: [
          "Startup validates provider configuration and a frozen registry builds one PricingStrategy.",
          "Checkout maps its cart to QuoteInput and invokes only the strategy contract.",
          "After order commit, an OrderPlaced event is handed to the subject.",
          "Publish snapshots subscribers under a read lock, releases it, then invokes callbacks in deterministic snapshot order.",
          "An unsubscribe is idempotent; callback errors follow the documented aggregate policy.",
        ],
      },
      {
        type: "prose",
        title: "Failure modes, concurrency, and extensions",
        body: "Never invoke callbacks under the observer-map lock: callbacks may subscribe, unsubscribe, block, or reenter Publish. A snapshot means an observer removed concurrently may receive the current event once, which must be documented. Parallel callbacks reduce latency but lose deterministic ordering and need concurrency bounds. Panic isolation may be appropriate for telemetry observers but not for correctness-critical hooks. Add decorators for caching, metrics, or fallback strategies. Move from Observer to outbox and broker when events must survive process failure or reach other services.",
      },
      {
        type: "tradeoff",
        title: "Observer delivery model",
        choices: [
          {
            label: "Synchronous callbacks",
            pros: ["Simple and deterministic", "Immediate error propagation"],
            cons: ["Publisher latency includes observers", "A callback can block or reenter"],
            when: "Use for in-process hooks that are fast and part of the operation.",
          },
          {
            label: "Bounded in-memory channels",
            pros: ["Decouples latency", "Natural worker ownership"],
            cons: ["Events vanish on crash", "Backpressure and shutdown need policy"],
            when: "Use for best-effort local telemetry or refresh work.",
          },
          {
            label: "Transactional outbox",
            pros: ["Survives crashes", "Coordinates event creation with state commit"],
            cons: ["More storage and duplicate handling", "Asynchronous visibility"],
            when: "Use for integration events with durable delivery requirements.",
          },
        ],
      },
      {
        type: "answer",
        title: "HEAT · Interview answer",
        opening: "I choose these patterns only after defining what varies and what delivery guarantees are required.",
        beats: [
          "Strategy isolates one policy and can be an interface or function.",
          "A factory validates config and returns a fully initialized strategy; registry mutation ends at startup.",
          "Observer requires explicit ordering, error, unsubscribe, and backpressure semantics.",
          "Snapshot subscribers and release locks before callbacks.",
          "Escalate durable cross-service events to an outbox rather than stretching an in-memory bus.",
        ],
        closing: "The Go design stays small because the contract expresses the force without reproducing a class hierarchy.",
      },
    ],
    quiz: [
      {
        id: "patterns-1",
        prompt: "Why snapshot observers before invoking them?",
        options: ["To encrypt events", "To avoid calling unknown code while holding the registry lock", "To guarantee persistence", "To sort factories"],
        answerIndex: 1,
        explanation: "Callbacks can block or reenter, so the subject lock must not be held.",
      },
      {
        id: "patterns-2",
        prompt: "What should a factory return?",
        options: ["A partially configured global", "A validated ready-to-use object or an error", "Only a string", "A goroutine ID"],
        answerIndex: 1,
        explanation: "Constructors establish dependency and configuration invariants.",
      },
      {
        id: "patterns-3",
        prompt: "When is an outbox preferable to Observer?",
        options: ["When events must survive crashes and cross service boundaries", "For a local formatting callback", "When no database exists", "To avoid duplicate handling"],
        answerIndex: 0,
        explanation: "An in-memory observer cannot provide durable integration delivery.",
      },
      {
        id: "patterns-4",
        prompt: "What is a Go-idiomatic Strategy for one operation?",
        options: ["Only an abstract class", "A named function type implementing a small interface", "A global switch in every caller", "A database trigger"],
        answerIndex: 1,
        explanation: "Function adapters provide pluggable behavior with little ceremony.",
      },
    ],
  },
  {
    slug: "rate-limiter-lld",
    track: "lld",
    title: "LLD: Rate Limiter",
    subtitle: "Design token buckets, keyed concurrency, retry hints, and distributed enforcement.",
    difficulty: "advanced",
    minutes: 65,
    tags: ["rate-limit", "concurrency", "token-bucket", "distributed"],
    prerequisites: ["mutexes", "time arithmetic", "HTTP middleware"],
    blocks: [
      {
        type: "steps",
        title: "Learning goals",
        items: [
          "Translate a quota into burst capacity, sustained refill, key scope, and cost.",
          "Implement a clock-injected concurrency-safe token bucket with retry timing.",
          "Manage many keyed buckets without one global bottleneck or unbounded memory.",
          "Compare local and distributed consistency, failure policy, and observability.",
        ],
      },
      {
        type: "think",
        title: "HEAT · Hear and establish",
        clarify: [
          "What is limited: IP, user, tenant, route, API key, or a hierarchy?",
          "Is the target a hard quota, average QPS, concurrency cap, or traffic shaping?",
          "What bursts are acceptable and what response headers are required?",
          "Must limits be global across replicas, and should dependency failure fail open or closed?",
        ],
        model: [
          "Token capacity is maximum burst; refill rate is sustained throughput.",
          "Each decision atomically refills from elapsed monotonic time and spends request cost.",
          "A keyed registry owns bucket lifecycle; distributed state needs one atomic server-side operation.",
        ],
        pitfalls: [
          "Using wall-clock jumps or a refill ticker per key.",
          "Loading config separately from the decision and mixing policy versions.",
          "Creating unlimited attacker-controlled keys without eviction.",
        ],
      },
      {
        type: "diagram",
        kind: "token-bucket",
        title: "Token bucket state",
        caption: "Elapsed time refills up to capacity; an accepted request atomically spends its cost.",
      },
      {
        type: "prose",
        title: "Requirements and invariants",
        body: "A Decision should include Allowed, Remaining, Limit, and RetryAfter. Cost supports endpoints with different weight. Invariants are 0 ≤ tokens ≤ capacity, last never moves backward, and one decision observes one policy. The algorithm refills lazily, so it needs no ticker. Go time.Time carries a monotonic component when derived from time.Now, protecting duration calculations from wall-clock correction. A negative elapsed duration from a fake or deserialized time should clamp to zero. Define whether exactly cost tokens is accepted and how fractional tokens round in headers.",
      },
      {
        type: "code",
        title: "Component API and token bucket core",
        language: "go",
        code: `type Limit struct {
	Capacity float64
	PerSecond float64
}

type Decision struct {
	Allowed    bool
	Limit      int
	Remaining int
	RetryAfter time.Duration
}

type Limiter interface {
	Allow(ctx context.Context, key string, cost float64) (Decision, error)
}

type Clock interface{ Now() time.Time }

type TokenBucket struct {
	mu     sync.Mutex
	limit  Limit
	tokens float64
	last   time.Time
	clock  Clock
}

func NewTokenBucket(limit Limit, clock Clock) (*TokenBucket, error) {
	if limit.Capacity <= 0 || limit.PerSecond <= 0 || clock == nil {
		return nil, errors.New("capacity, refill rate, and clock must be positive")
	}
	now := clock.Now()
	return &TokenBucket{limit: limit, tokens: limit.Capacity, last: now, clock: clock}, nil
}`,
      },
      {
        type: "code",
        title: "Atomic weighted decision with retry-after",
        language: "go",
        code: `func (b *TokenBucket) Allow(_ context.Context, cost float64) (Decision, error) {
	if cost <= 0 || cost > b.limit.Capacity {
		return Decision{}, ErrInvalidCost
	}
	b.mu.Lock()
	defer b.mu.Unlock()

	now := b.clock.Now()
	elapsed := now.Sub(b.last)
	if elapsed < 0 { elapsed = 0 }
	b.tokens = math.Min(b.limit.Capacity,
		b.tokens+elapsed.Seconds()*b.limit.PerSecond)
	b.last = now

	d := Decision{Limit: int(b.limit.Capacity)}
	if b.tokens >= cost {
		b.tokens -= cost
		d.Allowed = true
		d.Remaining = int(math.Floor(b.tokens))
		return d, nil
	}
	missing := cost - b.tokens
	d.Remaining = int(math.Floor(b.tokens))
	d.RetryAfter = time.Duration(math.Ceil(missing/b.limit.PerSecond*1000)) * time.Millisecond
	return d, nil
}`,
      },
      {
        type: "code",
        title: "Sharded keyed registry with idle eviction",
        language: "go",
        code: `type bucketEntry struct {
	bucket   *TokenBucket
	lastSeen atomic.Int64
}

type shard struct {
	mu      sync.RWMutex
	buckets map[string]*bucketEntry
}

type KeyedLimiter struct {
	shards []shard
	policy func(string) Limit
	clock  Clock
}

func (l *KeyedLimiter) bucketFor(key string) (*TokenBucket, error) {
	s := &l.shards[fnv32(key)%uint32(len(l.shards))]
	s.mu.RLock()
	entry := s.buckets[key]
	s.mu.RUnlock()
	if entry != nil {
		entry.lastSeen.Store(l.clock.Now().UnixNano())
		return entry.bucket, nil
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	if entry = s.buckets[key]; entry == nil {
		bucket, err := NewTokenBucket(l.policy(key), l.clock)
		if err != nil { return nil, err }
		entry = &bucketEntry{bucket: bucket}
		s.buckets[key] = entry
	}
	entry.lastSeen.Store(l.clock.Now().UnixNano())
	return entry.bucket, nil
}`,
      },
      {
        type: "steps",
        title: "Worked request flow",
        items: [
          "Middleware authenticates first so the limiter can derive tenant:user:route without trusting a client header.",
          "Policy lookup returns capacity, refill rate, cost, and policy version for that key class.",
          "The shard locates or creates the bucket; its mutex makes refill-and-spend one linearizable decision.",
          "Allowed requests receive RateLimit-Limit and RateLimit-Remaining; rejected requests receive 429 and a rounded Retry-After.",
          "Metrics record decision, route template, and policy—not raw high-cardinality user keys; idle entries are evicted safely.",
        ],
      },
      {
        type: "prose",
        title: "Failure modes, distributed behavior, and extensions",
        body: "Local buckets multiply the effective limit by replicas and reset on restart, which is acceptable for best-effort protection but not a billing quota. A Redis implementation must execute refill, spend, and expiry in one Lua script using server time or consistent timestamps. Network timeout is ambiguous: the script may have spent tokens. Decide fail-open for availability-sensitive reads or fail-closed for expensive/security-sensitive actions, and measure bypasses. Hot keys can bottleneck one Redis shard. Add hierarchical tenant then user limits, reservation/refund for canceled expensive work, dynamic policy snapshots, and a separate semaphore for concurrent in-flight limits.",
      },
      {
        type: "tradeoff",
        title: "Algorithm and placement",
        choices: [
          {
            label: "Local token bucket",
            pros: ["Very low latency", "Supports bursts and lazy refill", "No network dependency"],
            cons: ["Approximate global limit", "State resets and scales with keys per replica"],
            when: "Use for abuse protection and per-instance smoothing.",
          },
          {
            label: "Redis atomic bucket",
            pros: ["Shared limit across replicas", "Atomic script and centralized expiry"],
            cons: ["Network latency and dependency", "Hot-key and fail-policy concerns"],
            when: "Use for globally enforced tenant or commercial quotas.",
          },
          {
            label: "Sliding-window counter",
            pros: ["Closer to a strict requests-per-window statement", "No saved burst beyond window"],
            cons: ["More state/operations", "Boundary approximation or log cost"],
            when: "Use when product semantics are explicitly window-based.",
          },
        ],
      },
      {
        type: "complexity",
        time: "O(1) decision; O(1) average keyed lookup",
        space: "O(active keys), bounded by idle eviction and admission limits",
        notes: "Distributed latency includes one atomic backend round trip.",
      },
      {
        type: "answer",
        title: "HEAT · Interview answer",
        opening: "I would pin down the key, sustained rate, burst, cost, and global-consistency requirement before selecting token bucket.",
        beats: [
          "Define Decision and Limiter contracts, including retry timing and errors.",
          "Refill lazily from monotonic elapsed time and spend under one bucket lock.",
          "Shard the key registry, bound attacker-created state, and inject clock/policy for tests.",
          "For global enforcement, move the same atomic transition into Redis Lua with expiry.",
          "Discuss ambiguous backend failure, fail-open/closed policy, hierarchical limits, headers, and low-cardinality metrics.",
        ],
        closing: "The invariant is simple; production completeness comes from key lifecycle, distributed failure semantics, and observability.",
      },
    ],
    quiz: [
      {
        id: "rl-1",
        prompt: "What does token-bucket capacity control?",
        options: ["Only average QPS", "Maximum accumulated burst", "Number of replicas", "Redis timeout"],
        answerIndex: 1,
        explanation: "Unused refill accumulates only up to capacity.",
      },
      {
        id: "rl-2",
        prompt: "Why refill lazily instead of one ticker per key?",
        options: ["To make limits inaccurate", "To avoid a goroutine/timer explosion", "Because time cannot be measured", "To remove locking"],
        answerIndex: 1,
        explanation: "Elapsed-time arithmetic makes idle buckets cost no periodic work.",
      },
      {
        id: "rl-3",
        prompt: "What must a Redis limiter script do atomically?",
        options: ["Only read tokens", "Refill, decide, spend, and set expiry", "Generate HTTP logs", "Create a DNS record"],
        answerIndex: 1,
        explanation: "Separate read/write calls race across replicas.",
      },
      {
        id: "rl-4",
        prompt: "Why is local limiting approximate globally?",
        options: ["Each replica owns independent tokens", "Mutexes do not work", "HTTP has no status 429", "Clocks are always zero"],
        answerIndex: 0,
        explanation: "Traffic distributed across N replicas can consume roughly N local quotas.",
      },
      {
        id: "rl-5",
        prompt: "What bounds registry memory for arbitrary IP keys?",
        options: ["A larger capacity", "Idle eviction plus admission/cardinality controls", "Retry-After", "Fractional tokens"],
        answerIndex: 1,
        explanation: "Attacker-controlled key creation otherwise grows state indefinitely.",
      },
    ],
  },
  {
    slug: "lru-cache-lld",
    track: "lld",
    title: "LLD: Concurrent LRU Cache",
    subtitle: "Maintain O(1) recency, TTL, eviction hooks, and stampede control.",
    difficulty: "advanced",
    minutes: 60,
    tags: ["cache", "lru", "concurrency", "generics"],
    prerequisites: ["maps", "linked lists", "mutexes", "generics"],
    blocks: [
      {
        type: "steps",
        title: "Learning goals",
        items: [
          "Derive the map plus doubly linked list design and its invariants.",
          "Implement generic O(1) Get, Put, Delete, and capacity eviction.",
          "Make compound recency updates concurrency-safe without exposing mutable values.",
          "Add TTL, loading, metrics, and eviction callbacks with explicit semantics.",
        ],
      },
      {
        type: "think",
        title: "HEAT · Hear and establish",
        clarify: [
          "Is capacity item count, bytes, or weighted cost?",
          "Does Get update recency, and are expired entries visible?",
          "What concurrency and hit-rate targets apply?",
          "Should misses load values, cache errors, or block duplicate loads?",
        ],
        model: [
          "Map locates a node; list order represents MRU at front and LRU at back.",
          "Every map entry appears exactly once in the list and sizes agree.",
          "A mutation lock protects map and list as one invariant.",
        ],
        pitfalls: [
          "Using a singly linked list and losing O(1) removal.",
          "Returning internal pointers that callers mutate after unlocking.",
          "Calling eviction callbacks or loaders while holding the cache lock.",
        ],
      },
      {
        type: "prose",
        title: "State and invariants",
        body: "Get is not a read-only operation because a hit moves the node to MRU. Sentinel root nodes remove head/tail special cases. For weighted capacity, size is the sum of entry weights and Put may evict several nodes. A single mutex is a good first design: correctness is clear, and list mutation already serializes hits. RWMutex offers little when most reads are hits. Values should be immutable or copied according to the API contract. TTL is separate from LRU: expired entries are logical misses and should be removed lazily or by a bounded janitor.",
      },
      {
        type: "code",
        title: "Generic component and list primitives",
        language: "go",
        code: `type entry[K comparable, V any] struct {
	key       K
	value     V
	weight    int64
	expiresAt time.Time
	prev, next *entry[K, V]
}

type Cache[K comparable, V any] struct {
	mu       sync.Mutex
	capacity int64
	weight   int64
	items    map[K]*entry[K, V]
	root     entry[K, V]
	now      func() time.Time
	onEvict  func(K, V)
}

func NewCache[K comparable, V any](capacity int64, now func() time.Time) (*Cache[K, V], error) {
	if capacity <= 0 || now == nil {
		return nil, errors.New("positive capacity and clock required")
	}
	c := &Cache[K, V]{capacity: capacity, items: make(map[K]*entry[K, V]), now: now}
	c.root.next, c.root.prev = &c.root, &c.root
	return c, nil
}

func (c *Cache[K, V]) unlink(e *entry[K, V]) {
	e.prev.next, e.next.prev = e.next, e.prev
}
func (c *Cache[K, V]) pushFront(e *entry[K, V]) {
	e.next, e.prev = c.root.next, &c.root
	c.root.next.prev, c.root.next = e, e
}`,
      },
      {
        type: "code",
        title: "Get and weighted Put preserve the invariant",
        language: "go",
        code: `func (c *Cache[K, V]) Get(key K) (V, bool) {
	c.mu.Lock()
	defer c.mu.Unlock()
	e, ok := c.items[key]
	if !ok {
		var zero V
		return zero, false
	}
	if !e.expiresAt.IsZero() && !c.now().Before(e.expiresAt) {
		c.removeLocked(e)
		var zero V
		return zero, false
	}
	c.unlink(e)
	c.pushFront(e)
	return e.value, true
}

func (c *Cache[K, V]) Put(key K, value V, weight int64, ttl time.Duration) error {
	if weight <= 0 || weight > c.capacity || ttl < 0 {
		return ErrInvalidEntry
	}
	var evicted []entry[K, V]
	c.mu.Lock()
	if old := c.items[key]; old != nil {
		c.removeLocked(old)
	}
	e := &entry[K, V]{key: key, value: value, weight: weight}
	if ttl > 0 { e.expiresAt = c.now().Add(ttl) }
	c.items[key], c.weight = e, c.weight+weight
	c.pushFront(e)
	for c.weight > c.capacity {
		victim := c.root.prev
		evicted = append(evicted, *victim)
		c.removeLocked(victim)
	}
	c.mu.Unlock()
	for _, e := range evicted {
		if c.onEvict != nil { c.onEvict(e.key, e.value) }
	}
	return nil
}`,
      },
      {
        type: "code",
        title: "Stampede-safe read-through wrapper",
        language: "go",
        code: `type Loader[K comparable, V any] func(context.Context, K) (V, int64, time.Duration, error)

type LoadingCache[K comparable, V any] struct {
	cache  *Cache[K, V]
	load   Loader[K, V]
	group  singleflight.Group
}

func (c *LoadingCache[K, V]) Get(ctx context.Context, key K) (V, error) {
	if value, ok := c.cache.Get(key); ok {
		return value, nil
	}
	raw, err, _ := c.group.Do(fmt.Sprint(key), func() (any, error) {
		if value, ok := c.cache.Get(key); ok {
			return value, nil
		}
		value, weight, ttl, err := c.load(ctx, key)
		if err != nil { return nil, err }
		if err := c.cache.Put(key, value, weight, ttl); err != nil { return nil, err }
		return value, nil
	})
	if err != nil {
		var zero V
		return zero, err
	}
	return raw.(V), nil
}`,
      },
      {
        type: "steps",
        title: "Worked flow: full cache and concurrent miss",
        items: [
          "Get(A) locks, finds an unexpired node, unlinks it, pushes it to MRU, and returns a value copy.",
          "Put(D) replaces any old D, inserts at MRU, then evicts LRU nodes until total weight is within capacity.",
          "Evicted entries are removed from map and list under lock; callbacks run after unlock.",
          "Many goroutines miss E; singleflight elects one loader while peers await its result.",
          "The leader double-checks the cache, loads with context, inserts TTL/weight, and shares the immutable value.",
        ],
      },
      {
        type: "prose",
        title: "Failure modes, concurrency notes, and extensions",
        body: "A loader using the first caller's context can cancel work for all waiters; a production wrapper may derive a bounded shared load context and let individual waiters abandon. fmt.Sprint can collide for arbitrary key types, so accept a stable key encoder or use a typed flight map. Do not cache transient errors indefinitely; negative-cache NotFound briefly only when useful. Eviction hooks can block or panic and need isolation. A sharded LRU reduces contention but is only approximately global because each shard evicts independently. Extend with TinyLFU admission to resist one-hit scans, stale-while-revalidate, byte weights, explicit Purge, and invariant checks in race tests.",
      },
      {
        type: "tradeoff",
        title: "Concurrency strategy",
        choices: [
          {
            label: "Single mutex exact LRU",
            pros: ["Simple, linearizable invariants", "Exact global recency"],
            cons: ["Every hit mutates one list", "Contention at high parallelism"],
            when: "Start here; it is often sufficient for process-local caches.",
          },
          {
            label: "Sharded LRU",
            pros: ["Parallel operations across shards", "Bounds lock contention"],
            cons: ["Approximate global capacity and recency", "Hot keys still share a shard"],
            when: "Use after profiling proves the single lock is limiting throughput.",
          },
          {
            label: "Admission-aware cache",
            pros: ["Protects hot entries from scans", "Often better hit rate than pure LRU"],
            cons: ["More metadata and tuning", "Not exact LRU semantics"],
            when: "Use for large mixed workloads where frequency matters.",
          },
        ],
      },
      {
        type: "complexity",
        time: "O(1) average Get, Put, and Delete; Put may evict O(k) entries",
        space: "O(number of resident entries)",
        notes: "Weighted capacity may evict multiple victims; no user callback runs under the lock.",
      },
      {
        type: "answer",
        title: "HEAT · Interview answer",
        opening: "I would first define capacity, recency, TTL, and concurrency semantics, then use a map plus sentinel doubly linked list.",
        beats: [
          "State the one-to-one map/list invariant and MRU/LRU positions.",
          "Protect each compound operation with one mutex and move hits in O(1).",
          "Support weighted entries, lazy expiry, and callbacks after unlock.",
          "Collapse concurrent loads and define cancellation and negative-cache policy.",
          "Discuss sharding, scan pollution, immutable values, metrics, and race/invariant tests.",
        ],
        closing: "The baseline is exact and interview-complete; extensions should be justified by measured workload behavior.",
      },
    ],
    quiz: [
      {
        id: "lru-1",
        prompt: "Why is Get a write operation in exact LRU?",
        options: ["It changes the key", "A hit updates recency order", "It changes capacity", "It always loads from disk"],
        answerIndex: 1,
        explanation: "Moving the node to MRU mutates list links.",
      },
      {
        id: "lru-2",
        prompt: "Why use a doubly linked list?",
        options: ["To sort keys", "To unlink any known node in O(1)", "To avoid a map", "To compress values"],
        answerIndex: 1,
        explanation: "The map supplies the node pointer; prev/next links permit constant-time removal.",
      },
      {
        id: "lru-3",
        prompt: "When should eviction callbacks run?",
        options: ["While holding the cache lock", "After releasing the lock", "Before removing the map entry", "Only during Get"],
        answerIndex: 1,
        explanation: "Unknown callback code can block, panic, or reenter the cache.",
      },
      {
        id: "lru-4",
        prompt: "What problem does singleflight address?",
        options: ["Key ordering", "Many concurrent loads for the same miss", "TTL clock skew", "Linked-list corruption"],
        answerIndex: 1,
        explanation: "It collapses a cache stampede into one loader execution.",
      },
      {
        id: "lru-5",
        prompt: "What invariant should always hold?",
        options: ["Every historical key stays in the map", "Each map entry appears exactly once in the list", "All TTLs are equal", "Capacity grows on eviction"],
        answerIndex: 1,
        explanation: "Map/list disagreement causes leaks, misses, or corrupt eviction.",
      },
    ],
  },
  {
    slug: "url-shortener-lld",
    track: "lld",
    title: "LLD: URL Shortener",
    subtitle: "Design code allocation, redirect reads, custom aliases, expiry, and analytics.",
    difficulty: "advanced",
    minutes: 65,
    tags: ["url-shortener", "ids", "cache", "api"],
    prerequisites: ["HTTP redirects", "transactions", "base encoding"],
    blocks: [
      {
        type: "steps",
        title: "Learning goals",
        items: [
          "Define shortening and redirect APIs with validation and abuse boundaries.",
          "Separate code generation, repository, cache, and analytics components.",
          "Implement Base62 allocation and collision-safe custom aliases.",
          "Reason about redirect semantics, cache consistency, expiry, and hot keys.",
        ],
      },
      {
        type: "think",
        title: "HEAT · Hear and establish",
        clarify: [
          "Must the same long URL return the same code, or can it create many links?",
          "Are custom aliases, expiry, editing, deletion, and per-user ownership required?",
          "What redirect volume and latency target dominate the system?",
          "Are codes guessable, and what phishing/malware controls are required?",
        ],
        model: [
          "ShortenService coordinates URL policy, ID generator, and repository.",
          "RedirectService is a read-optimized path with cache and asynchronous analytics.",
          "A unique code constraint is the final collision authority.",
        ],
        pitfalls: [
          "Truncating hashes without collision handling.",
          "Using 301 while destinations can change and becoming stuck in client caches.",
          "Performing analytics synchronously on the redirect path.",
        ],
      },
      {
        type: "diagram",
        kind: "url-shortener-arch",
        title: "Write and redirect paths",
        caption: "Creation allocates durable codes; redirects use cache-aside reads and publish analytics asynchronously.",
      },
      {
        type: "prose",
        title: "Domain model and invariants",
        body: "A Link has Code, Destination, OwnerID, CreatedAt, optional ExpiresAt, and Version. Codes use a restricted alphabet and length; custom aliases reserve namespaces such as api, health, and admin. Destination policy accepts only http/https, rejects credentials and control characters, and may run asynchronous reputation checks. Editing requires ownership and version checks. Expiry means the redirect path returns a documented 404 or 410 and evicts stale cache state. Deduplicating by destination is a product choice because different campaigns may intentionally share a URL.",
      },
      {
        type: "code",
        title: "Components and application API",
        language: "go",
        code: `var (
	ErrCodeTaken = errors.New("short code taken")
	ErrLinkGone  = errors.New("link expired")
)

type Link struct {
	Code        string
	Destination string
	OwnerID     string
	CreatedAt   time.Time
	ExpiresAt   *time.Time
	Version     int64
}

type CodeGenerator interface {
	Next(ctx context.Context) (string, error)
}

type LinkRepository interface {
	Insert(ctx context.Context, link Link) error
	ByCode(ctx context.Context, code string) (Link, error)
	Update(ctx context.Context, link Link, expectedVersion int64) error
}

type LinkCache interface {
	Get(ctx context.Context, code string) (Link, bool, error)
	Set(ctx context.Context, link Link, ttl time.Duration) error
	Delete(ctx context.Context, code string) error
}

type ClickPublisher interface {
	PublishClick(ctx context.Context, click Click) error
}`,
      },
      {
        type: "code",
        title: "Counter-to-Base62 generator with permutation",
        language: "go",
        code: `const base62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

func encodeBase62(value uint64) string {
	if value == 0 { return string(base62[0]) }
	var buf [11]byte
	i := len(buf)
	for value > 0 {
		i--
		buf[i] = base62[value%62]
		value /= 62
	}
	return string(buf[i:])
}

type Sequence interface {
	Next(ctx context.Context) (uint64, error)
}

type SequenceGenerator struct {
	sequence Sequence
	secret   uint64
}

func (g SequenceGenerator) Next(ctx context.Context) (string, error) {
	id, err := g.sequence.Next(ctx)
	if err != nil { return "", err }
	// A reversible keyed permutation obscures consecutive allocation; it is not encryption.
	obscured := bits.RotateLeft64(id^g.secret, 23)
	return encodeBase62(obscured), nil
}`,
      },
      {
        type: "code",
        title: "Collision-safe create and cache-aside redirect",
        language: "go",
        code: `func (s *ShortenService) Create(ctx context.Context, cmd CreateLink) (Link, error) {
	destination, err := s.policy.NormalizeAndValidate(cmd.Destination)
	if err != nil { return Link{}, err }
	for attempt := 0; attempt < 5; attempt++ {
		code := cmd.CustomAlias
		if code == "" {
			code, err = s.codes.Next(ctx)
			if err != nil { return Link{}, err }
		}
		link := Link{Code: code, Destination: destination, OwnerID: cmd.OwnerID,
			CreatedAt: s.clock.Now(), ExpiresAt: cmd.ExpiresAt, Version: 1}
		err = s.links.Insert(ctx, link)
		if err == nil { return link, nil }
		if !errors.Is(err, ErrCodeTaken) || cmd.CustomAlias != "" { return Link{}, err }
	}
	return Link{}, ErrAllocationExhausted
}

func (s *RedirectService) Resolve(ctx context.Context, code string) (Link, error) {
	if link, ok, err := s.cache.Get(ctx, code); err == nil && ok {
		return s.ensureActive(link)
	}
	link, err := s.links.ByCode(ctx, code)
	if err != nil { return Link{}, err }
	if link, err = s.ensureActive(link); err != nil { return Link{}, err }
	_ = s.cache.Set(ctx, link, s.cacheTTL(link))
	return link, nil
}`,
      },
      {
        type: "steps",
        title: "Worked flows",
        items: [
          "POST /links authenticates, validates destination/custom alias/expiry, and builds CreateLink.",
          "The generator leases a sequence range, permutes the ID, Base62-encodes it, and Insert relies on a unique code index.",
          "GET /{code} checks cache, falls back to repository, verifies expiry, and returns 302 with Location.",
          "A click event containing link code, coarse time, and privacy-reviewed metadata is offered to a bounded async publisher.",
          "An edit commits a new version then deletes/updates cache; short TTL limits stale redirects if invalidation fails.",
        ],
      },
      {
        type: "prose",
        title: "Failure modes, concurrency, and extensions",
        body: "Counter allocation can bottleneck, so lease ID ranges per process or use a distributed unique ID; range loss creates gaps but not collisions. A reversible permutation avoids obvious adjacent codes but not enumeration at scale. Cache stampedes on a viral link need request coalescing and negative caching for random scans. Decide fail behavior when storage is down: stale cache may preserve availability but can redirect after deletion. Analytics queues can drop low-value clicks rather than delay redirects. Extend with QR codes, preview pages, domain aliases, malware scanning, rate limits, and geographically replicated read models.",
      },
      {
        type: "tradeoff",
        title: "Code generation",
        choices: [
          {
            label: "Sequence + Base62",
            pros: ["Compact and collision-free with unique sequence", "Easy capacity calculation"],
            cons: ["Needs scalable sequence allocation", "Predictable unless permuted"],
            when: "Use when compact codes and deterministic uniqueness dominate.",
          },
          {
            label: "Random code",
            pros: ["No central sequence", "Harder to enumerate at adequate entropy"],
            cons: ["Collision probability and retry", "Needs secure randomness"],
            when: "Use for decentralized generation with a unique constraint.",
          },
          {
            label: "Truncated content hash",
            pros: ["Can deduplicate identical canonical URLs", "Deterministic"],
            cons: ["Collisions still require resolution", "Canonicalization and privacy semantics are tricky"],
            when: "Use only when destination deduplication is an explicit requirement.",
          },
        ],
      },
      {
        type: "complexity",
        time: "O(log62 ID) code encoding; O(1) average cache lookup",
        space: "O(number of links) durable, plus bounded hot-link cache",
        notes: "Redirect latency is dominated by cache or repository I/O.",
      },
      {
        type: "answer",
        title: "HEAT · Interview answer",
        opening: "I would separate the lower-volume creation path from the latency-critical redirect path and clarify code semantics first.",
        beats: [
          "Model Link ownership, destination, alias, expiry, and version invariants.",
          "Inject CodeGenerator, LinkRepository, LinkCache, URLPolicy, and ClickPublisher.",
          "Use sequence+Base62 or secure random codes, always backed by a unique index and collision handling.",
          "Resolve with cache-aside, expiry checks, 302 by default, and asynchronous analytics.",
          "Discuss hot-key coalescing, cache invalidation, enumeration, abuse scanning, multi-region reads, and ID range leasing.",
        ],
        closing: "The core object model stays small while generation and redirect components scale independently.",
      },
    ],
    quiz: [
      {
        id: "url-1",
        prompt: "What is the final authority for code uniqueness?",
        options: ["A pre-insert cache check", "A repository unique constraint", "The URL parser", "A 301 response"],
        answerIndex: 1,
        explanation: "Concurrent creators can pass application checks; the atomic unique index closes the race.",
      },
      {
        id: "url-2",
        prompt: "Why prefer 302 when destinations may change?",
        options: ["It has a larger body", "Permanent redirects can be cached beyond server control", "It disables TLS", "It avoids Location"],
        answerIndex: 1,
        explanation: "Browsers and intermediaries may retain 301 aggressively.",
      },
      {
        id: "url-3",
        prompt: "How should click analytics affect redirect latency?",
        options: ["Block until warehouse commit", "Publish asynchronously with an explicit loss policy", "Run only in the browser", "Hold the cache lock"],
        answerIndex: 1,
        explanation: "The read path should not depend on slow analytics storage.",
      },
      {
        id: "url-4",
        prompt: "What does leasing sequence ranges trade?",
        options: ["It allows collisions", "It reduces allocator calls but may leave harmless gaps", "It lengthens every URL equally", "It removes persistence"],
        answerIndex: 1,
        explanation: "A crashed process can abandon unused IDs, but uniqueness remains intact.",
      },
      {
        id: "url-5",
        prompt: "Why can cache invalidation matter after link edit?",
        options: ["The old destination may continue receiving redirects", "Base62 stops working", "The ID becomes negative", "HTTP forbids updates"],
        answerIndex: 0,
        explanation: "Cached Link data must converge to the committed destination/version.",
      },
    ],
  },
  {
    slug: "parking-lot-lld",
    track: "lld",
    title: "LLD: Parking Lot",
    subtitle: "Model allocation, tickets, occupancy, fees, and concurrent gates.",
    difficulty: "advanced",
    minutes: 60,
    tags: ["ood", "allocation", "transactions", "concurrency"],
    prerequisites: ["interfaces", "mutexes", "state modeling"],
    blocks: [
      {
        type: "steps",
        title: "Learning goals",
        items: [
          "Separate vehicle, spot, ticket, gate, allocation, and fee responsibilities.",
          "Express compatibility and ticket lifecycle as enforceable invariants.",
          "Allocate exactly one spot under concurrent entry gates.",
          "Design exit payment, lost-ticket, reservation, and display extensions.",
        ],
      },
      {
        type: "think",
        title: "HEAT · Hear and establish",
        clarify: [
          "Which vehicle and spot types exist, and can larger spots accept smaller vehicles?",
          "Are there multiple floors/gates, reservations, EV charging, or accessible spots?",
          "How are fees rounded, paid, and handled for lost tickets?",
          "Is the design in-memory for an interview or persisted across processes?",
        ],
        model: [
          "ParkingLot is an application facade; repositories own atomic occupancy state.",
          "AllocationStrategy ranks compatible candidates but does not itself claim them.",
          "Ticket is a state machine from Active to Paid/Closed or Lost.",
        ],
        pitfalls: [
          "A global lock around payment provider calls.",
          "Using Spot.Size >= Vehicle.Size without special compatibility rules.",
          "Marking a ticket closed before payment and barrier success policy are defined.",
        ],
      },
      {
        type: "prose",
        title: "Domain model and invariants",
        body: "A Floor contains addressable spots and display counts, but availability is authoritative in the repository. SpotKind and VehicleKind use a compatibility policy because an accessible, EV, or bus spot is not just a numeric size. One active ticket maps to one vehicle and one claimed spot; one spot has at most one active ticket. Entry claim and ticket creation are atomic. Exit calculates from immutable entry time and a versioned FeePolicy; payment retries use the ticket ID as idempotency scope. Display boards are derived projections and may be briefly stale.",
      },
      {
        type: "code",
        title: "Component contracts",
        language: "go",
        code: `type VehicleKind uint8
const (
	Motorcycle VehicleKind = iota
	Car
	Truck
)

type SpotKind uint8
const (
	Compact SpotKind = iota
	Regular
	Large
	Accessible
	EV
)

type Vehicle struct {
	Plate string
	Kind  VehicleKind
}

type Ticket struct {
	ID, SpotID, Plate string
	EnteredAt time.Time
	State TicketState
	Version int64
}

type Compatibility interface {
	CanPark(vehicle Vehicle, spot Spot) bool
}

type AllocationStrategy interface {
	Rank(ctx context.Context, vehicle Vehicle, candidates []Spot) ([]Spot, error)
}

type ParkingRepository interface {
	Available(ctx context.Context, lotID string, kind VehicleKind) ([]Spot, error)
	ClaimAndIssue(ctx context.Context, spotID string, vehicle Vehicle, at time.Time) (Ticket, error)
	CloseTicket(ctx context.Context, ticketID string, expectedVersion int64, at time.Time) error
}`,
      },
      {
        type: "code",
        title: "Optimistic concurrent entry flow",
        language: "go",
        code: `func (s *ParkingService) Enter(ctx context.Context, lotID string, vehicle Vehicle) (Ticket, error) {
	if err := validatePlate(vehicle.Plate); err != nil {
		return Ticket{}, err
	}
	if active, err := s.tickets.ActiveByPlate(ctx, lotID, vehicle.Plate); err == nil && active.ID != "" {
		return Ticket{}, ErrAlreadyParked
	}
	candidates, err := s.repo.Available(ctx, lotID, vehicle.Kind)
	if err != nil { return Ticket{}, err }
	ranked, err := s.allocation.Rank(ctx, vehicle, candidates)
	if err != nil { return Ticket{}, err }

	for _, spot := range ranked {
		if !s.compatibility.CanPark(vehicle, spot) { continue }
		ticket, err := s.repo.ClaimAndIssue(ctx, spot.ID, vehicle, s.clock.Now())
		switch {
		case err == nil:
			_ = s.events.Publish(ctx, SpotClaimed{SpotID: spot.ID})
			return ticket, nil
		case errors.Is(err, ErrSpotAlreadyClaimed):
			continue // another gate won; try the next candidate
		default:
			return Ticket{}, err
		}
	}
	return Ticket{}, ErrLotFull
}`,
      },
      {
        type: "code",
        title: "Idempotent payment and exit",
        language: "go",
        code: `type FeePolicy interface {
	Quote(ticket Ticket, exitAt time.Time) (Money, error)
}

type PaymentGateway interface {
	Charge(ctx context.Context, key string, amount Money, method PaymentMethod) (Receipt, error)
}

func (s *ParkingService) Exit(ctx context.Context, ticketID string, method PaymentMethod) (Receipt, error) {
	ticket, err := s.tickets.ByID(ctx, ticketID)
	if err != nil { return Receipt{}, err }
	if ticket.State == Closed {
		return s.payments.ReceiptByKey(ctx, ticketID)
	}
	now := s.clock.Now()
	fee, err := s.fees.Quote(ticket, now)
	if err != nil { return Receipt{}, err }
	receipt, err := s.gateway.Charge(ctx, "parking:"+ticket.ID, fee, method)
	if err != nil { return Receipt{}, err }
	if err := s.repo.CloseTicket(ctx, ticket.ID, ticket.Version, now); err != nil {
		return Receipt{}, fmt.Errorf("payment succeeded; reconcile close: %w", err)
	}
	return receipt, nil
}`,
      },
      {
        type: "steps",
        title: "Worked flow: two gates choose one spot",
        items: [
          "Both gates read spot R-17 as available and rank it first.",
          "Gate A's ClaimAndIssue transaction conditionally changes R-17 from free to occupied and inserts ticket T1.",
          "Gate B's conditional update affects zero rows and returns ErrSpotAlreadyClaimed.",
          "Gate B tries the next ranked compatible spot; no in-process global mutex is required.",
          "Display events update derived counts; periodic reconciliation repairs any lost display event.",
        ],
      },
      {
        type: "prose",
        title: "Failure modes, concurrency notes, and extensions",
        body: "Payment may succeed while ticket close fails, so persist a payment operation and reconcile rather than charging again. Decide whether the barrier opens on a verifiable provider receipt during storage outage. Lost tickets need plate lookup, fraud controls, and a separate fee policy. Reservation must atomically transition Reserved to Occupied for the intended vehicle and expire safely. Floor display counters can drift and should rebuild from spots. Extensions include multiple entrances, valet keys, EV sessions, accessible permits, dynamic pricing, license-plate recognition, and sensor health.",
      },
      {
        type: "tradeoff",
        title: "Spot claim strategy",
        choices: [
          {
            label: "One in-process lot mutex",
            pros: ["Easy invariant reasoning", "Fine for interview-scale single process"],
            cons: ["Serializes gates", "Does not work across replicas or restarts"],
            when: "Use for a bounded in-memory implementation.",
          },
          {
            label: "Optimistic conditional claim",
            pros: ["Scales across gates", "Short transactions without remote calls"],
            cons: ["Candidates may conflict and retry", "Needs robust unique/conditional storage"],
            when: "Use for persistent multi-gate systems.",
          },
          {
            label: "Preassigned gate partitions",
            pros: ["Low contention", "Predictable local allocation"],
            cons: ["Can show full while another partition has space", "Rebalancing complexity"],
            when: "Use for very large lots where slight allocation inefficiency is acceptable.",
          },
        ],
      },
      {
        type: "answer",
        title: "HEAT · Interview answer",
        opening: "I would model spot claim and ticket issue as the central atomic invariant, then keep ranking and fees pluggable.",
        beats: [
          "Define Vehicle, Spot, Ticket, Gate, compatibility, allocation, repository, fee, and payment contracts.",
          "Rank candidates outside the transaction and claim one with a conditional update plus ticket insert.",
          "Treat tickets and reservations as explicit state machines.",
          "Make payment idempotent and design reconciliation for payment-success/close-failure.",
          "Discuss displays as projections, multiple gates, lost tickets, EV/accessible rules, and persistence.",
        ],
        closing: "The design remains correct under concurrency because selection is advisory and the claim is authoritative.",
      },
    ],
    quiz: [
      {
        id: "park-1",
        prompt: "What must be atomic at entry?",
        options: ["Fee calculation and email", "Spot claim and ticket issue", "Display refresh and logging", "Plate formatting and routing"],
        answerIndex: 1,
        explanation: "Otherwise a spot can be occupied without a ticket or issued twice.",
      },
      {
        id: "park-2",
        prompt: "Why is allocation ranking not authoritative?",
        options: ["It has no candidates", "Another gate can claim the ranked spot before this gate", "Strategies cannot use interfaces", "Fees change the spot size"],
        answerIndex: 1,
        explanation: "The repository's conditional claim closes concurrent selection races.",
      },
      {
        id: "park-3",
        prompt: "How should payment retries be scoped?",
        options: ["Randomly each attempt", "By ticket/payment operation idempotency key", "By floor number only", "Without persistent state"],
        answerIndex: 1,
        explanation: "A stable operation key prevents duplicate charges after ambiguous failure.",
      },
      {
        id: "park-4",
        prompt: "Are display-board counts authoritative?",
        options: ["Yes, always", "No, they are derived projections that require reconciliation", "Only for trucks", "Only at one gate"],
        answerIndex: 1,
        explanation: "Event loss or delay can make displays stale while spot state remains correct.",
      },
    ],
  },
  {
    slug: "notification-system-lld",
    track: "lld",
    title: "LLD: Notification System",
    subtitle: "Design durable fan-out, preferences, templates, retries, and provider isolation.",
    difficulty: "advanced",
    minutes: 65,
    tags: ["notifications", "outbox", "queues", "retries"],
    prerequisites: ["interfaces", "transactions", "worker pools"],
    blocks: [
      {
        type: "steps",
        title: "Learning goals",
        items: [
          "Separate notification intent, channel delivery, provider adapter, and receipt state.",
          "Apply preferences, legal policy, templates, and deduplication at defined times.",
          "Persist intents with an outbox and process them with bounded retry workers.",
          "Handle provider ambiguity, poison messages, rate limits, and observability.",
        ],
      },
      {
        type: "think",
        title: "HEAT · Hear and establish",
        clarify: [
          "Which channels, urgency classes, localization, and delivery SLAs exist?",
          "Are notifications transactional, marketing, or best-effort?",
          "Can users opt out, and which legal messages override preferences?",
          "Is success provider acceptance, device delivery, or user acknowledgement?",
        ],
        model: [
          "An Intent says what should be communicated; Delivery is one channel attempt lineage.",
          "Planner resolves policy, preferences, destination, and template version.",
          "Outbox makes intent creation durable; workers own retries and provider calls.",
        ],
        pitfalls: [
          "Rendering templates with mutable latest content during every retry.",
          "Retrying permanent invalid-address errors.",
          "Fan-out loops with unbounded goroutines or no per-provider limits.",
        ],
      },
      {
        type: "diagram",
        kind: "outbox",
        title: "Durable notification flow",
        caption: "Business commit writes an outbox event; planners create deliveries; workers send and persist outcomes.",
      },
      {
        type: "prose",
        title: "Domain and delivery states",
        body: "NotificationIntent has a stable ID, recipient, kind, template data, priority, schedule, and dedupe key. Planning creates one Delivery per allowed channel with a frozen template/version and destination snapshot or a deliberate late-binding policy. Delivery states are Pending, Leased, Accepted, Delivered, Retryable, FailedPermanent, and Suppressed. Provider acceptance is not final delivery; webhooks may advance status later and can arrive duplicated or out of order. Transactional password resets and optional marketing campaigns need separate policy and queue capacity.",
      },
      {
        type: "code",
        title: "Core component contracts",
        language: "go",
        code: `type Channel string
const (
	Email Channel = "email"
	SMS   Channel = "sms"
	Push  Channel = "push"
)

type Intent struct {
	ID, UserID, Kind, DedupeKey string
	Data map[string]string
	Priority int
	ScheduledAt time.Time
}

type Preferences interface {
	Allowed(ctx context.Context, userID, kind string) ([]Channel, error)
}

type Renderer interface {
	Render(ctx context.Context, templateID, locale string, data map[string]string) (Rendered, error)
}

type Sender interface {
	Send(ctx context.Context, message OutboundMessage) (ProviderReceipt, error)
}

type DeliveryRepository interface {
	CreateForIntent(ctx context.Context, intent Intent, deliveries []Delivery) error
	LeaseBatch(ctx context.Context, channel Channel, owner string, n int, until time.Time) ([]Delivery, error)
	RecordAttempt(ctx context.Context, result AttemptResult) error
}`,
      },
      {
        type: "code",
        title: "Planning respects policy and freezes versions",
        language: "go",
        code: `func (p *Planner) Plan(ctx context.Context, intent Intent) error {
	channels, err := p.policy.RequiredChannels(intent.Kind)
	if err != nil {
		channels, err = p.preferences.Allowed(ctx, intent.UserID, intent.Kind)
	}
	if err != nil { return err }
	profile, err := p.users.NotificationProfile(ctx, intent.UserID)
	if err != nil { return err }

	deliveries := make([]Delivery, 0, len(channels))
	for _, channel := range channels {
		destination, ok := profile.Destination(channel)
		if !ok { continue }
		templateID, version := p.catalog.Resolve(intent.Kind, channel, profile.Locale)
		deliveries = append(deliveries, Delivery{
			ID: p.ids.New(), IntentID: intent.ID, Channel: channel,
			Destination: destination, TemplateID: templateID, TemplateVersion: version,
			State: Pending, NextAttemptAt: maxTime(intent.ScheduledAt, p.clock.Now()),
		})
	}
	return p.deliveries.CreateForIntent(ctx, intent, deliveries)
}`,
      },
      {
        type: "code",
        title: "Leased worker classifies outcomes",
        language: "go",
        code: `func (w *Worker) Handle(ctx context.Context, delivery Delivery) error {
	rendered, err := w.renderer.Render(ctx, delivery.VersionedTemplate(),
		delivery.Locale, delivery.Data)
	if err != nil {
		return w.repo.RecordAttempt(ctx, permanent(delivery, "template", err))
	}
	sender := w.senders[delivery.Channel]
	sendCtx, cancel := context.WithTimeout(ctx, w.timeout[delivery.Channel])
	defer cancel()
	receipt, err := sender.Send(sendCtx, delivery.Message(rendered))

	var result AttemptResult
	switch {
	case err == nil:
		result = accepted(delivery, receipt)
	case errors.Is(err, ErrInvalidDestination), errors.Is(err, ErrRejectedContent):
		result = permanent(delivery, "provider_rejected", err)
	case delivery.Attempt+1 >= w.maxAttempts:
		result = deadLettered(delivery, err)
	default:
		delay := fullJitterBackoff(delivery.Attempt, time.Second, time.Hour)
		result = retryAt(delivery, w.clock.Now().Add(delay), err)
	}
	return w.repo.RecordAttempt(ctx, result)
}`,
      },
      {
        type: "steps",
        title: "Worked flow: order receipt email and push",
        items: [
          "Order transaction writes OrderPlaced and its outbox row atomically.",
          "Outbox relay publishes an intent ID; duplicate relay is absorbed by unique dedupe scope.",
          "Planner applies mandatory transactional policy, locale, destinations, and frozen template versions.",
          "Channel workers lease due deliveries with SKIP LOCKED semantics and enforce provider concurrency/rate limits.",
          "Provider acceptance is recorded; signed webhook events later mark delivered/bounced and update destination health.",
        ],
      },
      {
        type: "prose",
        title: "Failure modes, concurrency notes, and extensions",
        body: "A timeout after provider submission is ambiguous; send your delivery ID as the provider idempotency key when supported, otherwise reconcile before retry. Leases expire after worker death and attempts must be idempotent. Backoff needs jitter and provider Retry-After support. Separate queues prevent a marketing campaign from starving password resets. Template rendering must escape for channel context and avoid logging personal data. Webhooks require signature and replay checks. Extend with digest aggregation, quiet hours, fallback chains, per-tenant branding, campaign cancellation, preference audit, and delivery analytics.",
      },
      {
        type: "tradeoff",
        title: "When should destinations and templates resolve?",
        choices: [
          {
            label: "Freeze at planning",
            pros: ["Retries are reproducible", "Audit shows exactly what was intended"],
            cons: ["Later address corrections do not apply", "Stores more snapshot data"],
            when: "Use for transactional messages and compliance-sensitive audit.",
          },
          {
            label: "Resolve at send time",
            pros: ["Uses freshest preferences and destinations", "Smaller delivery records"],
            cons: ["Retries can change content or recipient", "Harder audit and cancellation semantics"],
            when: "Use for delayed campaigns where current consent must be rechecked.",
          },
          {
            label: "Hybrid",
            pros: ["Freeze content while rechecking consent", "Balances audit and safety"],
            cons: ["More explicit policy states", "Requires versioned rules"],
            when: "Use when message content is fixed but user eligibility can change.",
          },
        ],
      },
      {
        type: "answer",
        title: "HEAT · Interview answer",
        opening: "I separate business intent from channel delivery so durability, policy, and provider failure each have a clear owner.",
        beats: [
          "Model Intent, Delivery, Attempt, template version, destination, and state transitions.",
          "Commit intent through an outbox and deduplicate planner work.",
          "Lease due deliveries to bounded channel workers and classify permanent versus retryable failures.",
          "Use provider idempotency, jittered backoff, signed webhooks, DLQs, and reconciliation.",
          "Isolate priority classes and discuss consent timing, localization, PII, metrics, and fallback channels.",
        ],
        closing: "The API can accept quickly while the delivery subsystem remains durable, rate-aware, and auditable.",
      },
    ],
    quiz: [
      {
        id: "notify-1",
        prompt: "Why distinguish Intent from Delivery?",
        options: ["To avoid IDs", "One business communication can fan out into independent channel lifecycles", "Because providers require SQL", "To eliminate retries"],
        answerIndex: 1,
        explanation: "Email, SMS, and push have different destinations, attempts, and outcomes.",
      },
      {
        id: "notify-2",
        prompt: "What does an outbox protect?",
        options: ["HTML styling", "Atomic business state and event creation", "Provider uptime", "User locale parsing"],
        answerIndex: 1,
        explanation: "It prevents committing state while losing the notification intent on a crash.",
      },
      {
        id: "notify-3",
        prompt: "Should an invalid phone number be retried?",
        options: ["Forever", "No, classify it as permanent", "Only without jitter", "Only by email workers"],
        answerIndex: 1,
        explanation: "Retries cannot fix a structurally invalid destination.",
      },
      {
        id: "notify-4",
        prompt: "Why separate transactional and marketing worker capacity?",
        options: ["To change JSON", "Bulk campaigns must not starve urgent messages", "To avoid templates", "To remove preferences"],
        answerIndex: 1,
        explanation: "Queue and worker isolation preserves priority SLAs under bursts.",
      },
      {
        id: "notify-5",
        prompt: "What can a provider timeout mean?",
        options: ["The provider definitely did nothing", "Submission outcome is ambiguous and needs idempotency or reconciliation", "The template is always wrong", "The user opted out"],
        answerIndex: 1,
        explanation: "The provider may have accepted the request before the response was lost.",
      },
    ],
  },
  {
    slug: "connection-pool-lld",
    track: "lld",
    title: "LLD: Connection Pool",
    subtitle: "Bound scarce resources with acquire queues, health, expiry, and leak resistance.",
    difficulty: "advanced",
    minutes: 65,
    tags: ["pooling", "concurrency", "resources", "timeouts"],
    prerequisites: ["channels", "mutexes", "context cancellation"],
    blocks: [
      {
        type: "steps",
        title: "Learning goals",
        items: [
          "Define pool ownership, capacity, acquire, release, discard, and shutdown semantics.",
          "Implement cancellation-aware acquire without exceeding MaxOpen.",
          "Validate idle/lifetime policy and prevent unhealthy resources from reentering the pool.",
          "Reason about fairness, leaks, thundering herd, and tuning.",
        ],
      },
      {
        type: "think",
        title: "HEAT · Hear and establish",
        clarify: [
          "What resource is pooled and is it safe for one borrower at a time?",
          "What are max open, max idle, lifetime, idle timeout, and acquire timeout?",
          "How expensive is creation and how is health detected?",
          "What happens to waiters and borrowed resources during shutdown?",
        ],
        model: [
          "The pool owns resources while idle; a borrower owns exactly one lease until release.",
          "open = idle + borrowed + in-construction reservations.",
          "Capacity is reserved before dialing and returned on every failure path.",
        ],
        pitfalls: [
          "Holding the pool mutex during network dial or health check.",
          "Returning a broken connection because Release cannot express discard.",
          "Using an unbounded goroutine per waiter or background health ticker per connection.",
        ],
      },
      {
        type: "prose",
        title: "Pool invariants and API",
        body: "A pool amortizes expensive setup while bounding pressure on a downstream service. It does not make a non-concurrent connection safe for multiple borrowers. Acquire either returns an exclusive Lease or a context/pool error. Lease.Close is idempotent and returns healthy resources; Lease.Discard closes broken ones. MaxOpen counts dialing reservations so concurrent misses cannot overshoot. Idle entries carry created and last-used times; max lifetime rotates credentials/endpoints, while idle timeout shrinks unused capacity.",
      },
      {
        type: "code",
        title: "Resource and lease contracts",
        language: "go",
        code: `type Resource interface {
	Ping(context.Context) error
	Close() error
}

type Factory interface {
	Open(context.Context) (Resource, error)
}

type pooled struct {
	resource Resource
	createdAt time.Time
	idleAt    time.Time
}

type Pool struct {
	mu       sync.Mutex
	factory  Factory
	idle     []pooled
	open     int
	maxOpen  int
	maxIdle  int
	lifetime time.Duration
	idleFor  time.Duration
	closed   bool
	notify   chan struct{}
	now      func() time.Time
}

type Lease struct {
	pool *Pool
	item pooled
	once sync.Once
	bad  atomic.Bool
}

func (l *Lease) Resource() Resource { return l.item.resource }
func (l *Lease) Discard() { l.bad.Store(true); l.Close() }
func (l *Lease) Close() error {
	l.once.Do(func() { l.pool.release(l.item, l.bad.Load()) })
	return nil
}`,
      },
      {
        type: "code",
        title: "Cancellation-aware Acquire with dial reservation",
        language: "go",
        code: `func (p *Pool) Acquire(ctx context.Context) (*Lease, error) {
	for {
		p.mu.Lock()
		if p.closed {
			p.mu.Unlock()
			return nil, ErrPoolClosed
		}
		for len(p.idle) > 0 {
			last := len(p.idle) - 1
			item := p.idle[last]
			p.idle = p.idle[:last]
			if p.expiredLocked(item) {
				p.open--
				p.signalLocked()
				p.mu.Unlock()
				_ = item.resource.Close()
				p.mu.Lock()
				continue
			}
			p.mu.Unlock()
			return &Lease{pool: p, item: item}, nil
		}
		if p.open < p.maxOpen {
			p.open++ // reserve before slow dial
			p.mu.Unlock()
			resource, err := p.factory.Open(ctx)
			if err != nil {
				p.mu.Lock()
				p.open--
				p.signalLocked()
				p.mu.Unlock()
				return nil, err
			}
			now := p.now()
			return &Lease{pool: p, item: pooled{resource: resource, createdAt: now}}, nil
		}
		wait := p.notify
		p.mu.Unlock()
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case <-wait:
		}
	}
}`,
      },
      {
        type: "code",
        title: "Release, discard, and shutdown",
        language: "go",
        code: `func (p *Pool) release(item pooled, bad bool) {
	p.mu.Lock()
	closeIt := bad || p.closed || p.expiredLocked(item) || len(p.idle) >= p.maxIdle
	if closeIt {
		p.open--
		p.signalLocked()
		p.mu.Unlock()
		_ = item.resource.Close()
		return
	}
	item.idleAt = p.now()
	p.idle = append(p.idle, item)
	p.signalLocked()
	p.mu.Unlock()
}

func (p *Pool) Close() error {
	p.mu.Lock()
	if p.closed { p.mu.Unlock(); return nil }
	p.closed = true
	idle := append([]pooled(nil), p.idle...)
	p.open -= len(idle)
	p.idle = nil
	p.signalLocked()
	p.mu.Unlock()
	var errs []error
	for _, item := range idle { errs = append(errs, item.resource.Close()) }
	return errors.Join(errs...)
}

func (p *Pool) signalLocked() {
	close(p.notify)
	p.notify = make(chan struct{})
}`,
      },
      {
        type: "steps",
        title: "Worked flow: saturated pool",
        items: [
          "Ten resources are borrowed and MaxOpen is ten; a new Acquire snapshots notify and waits with its context.",
          "One borrower marks a failed connection bad and closes its lease.",
          "Release decrements open, closes the resource, and broadcasts by closing the old notify channel.",
          "Competing waiters wake; exactly one reserves open under the lock and begins dialing while others loop.",
          "If a waiting context expires it returns without consuming capacity; dial failure releases the reservation and signals again.",
        ],
      },
      {
        type: "prose",
        title: "Failure modes, concurrency notes, and extensions",
        body: "The broadcast-channel sketch is simple but not strictly FIFO; a production pool can maintain an explicit waiter queue to prevent starvation and hand resources directly to waiters. Health checks on every release add latency; mark known protocol failures bad and validate stale idle resources on borrow with a deadline. Borrowed leases surviving Close need a policy: return should close them, while Close may optionally wait for drain. Leaks exhaust capacity, so expose borrowed age, acquire wait histograms, and optional diagnostic stack sampling. Avoid finalizers for correctness. Tune MaxOpen against downstream capacity across all replicas, not per-process convenience.",
      },
      {
        type: "tradeoff",
        title: "Waiter and health strategy",
        choices: [
          {
            label: "Broadcast and compete",
            pros: ["Small implementation", "No waiter objects"],
            cons: ["Thundering wakeups", "No strict fairness"],
            when: "Use for modest contention and an educational pool.",
          },
          {
            label: "FIFO waiter queue",
            pros: ["Fair handoff", "Can avoid waking every waiter"],
            cons: ["Cancellation removal is more complex", "More state under lock"],
            when: "Use for highly contended pools with latency fairness needs.",
          },
          {
            label: "Validate on every borrow",
            pros: ["Reduces stale-resource failures", "Central health policy"],
            cons: ["Adds network round trip", "Can amplify outages"],
            when: "Use only when protocol health cannot be inferred and validation is cheap.",
          },
        ],
      },
      {
        type: "answer",
        title: "HEAT · Interview answer",
        opening: "I treat a connection pool as a bounded ownership system, not just a channel of connections.",
        beats: [
          "Define exclusive Lease with idempotent Close and explicit Discard.",
          "Maintain open = idle + borrowed + dialing reservations and reserve before dialing.",
          "Wait with caller context, never hold locks during I/O, and signal every capacity change.",
          "Apply max idle, idle timeout, lifetime, shutdown, and unhealthy-resource policy.",
          "Discuss FIFO fairness, leak diagnostics, downstream-wide capacity, metrics, and why database/sql should usually be used for SQL.",
        ],
        closing: "The key correctness property is that every path transfers or returns exactly one ownership unit.",
      },
    ],
    quiz: [
      {
        id: "pool-1",
        prompt: "Why increment open before dialing?",
        options: ["To count retries", "To reserve capacity so concurrent dials cannot exceed MaxOpen", "To make health checks pass", "To close idle resources"],
        answerIndex: 1,
        explanation: "Dialing is outside the lock, so the reservation preserves the cap.",
      },
      {
        id: "pool-2",
        prompt: "Why should Lease.Close be idempotent?",
        options: ["To permit safe deferred and explicit cleanup", "To reopen the resource", "To increase MaxOpen", "To ignore context"],
        answerIndex: 0,
        explanation: "Multiple cleanup paths must not return one resource twice.",
      },
      {
        id: "pool-3",
        prompt: "Should the pool mutex be held during Ping?",
        options: ["Yes, always", "No; network I/O would block unrelated pool operations", "Only for HTTP", "Only when closed"],
        answerIndex: 1,
        explanation: "Slow external operations must not serialize all acquire/release activity.",
      },
      {
        id: "pool-4",
        prompt: "What is a useful leak metric?",
        options: ["JSON field count", "Borrowed lease age and acquire wait duration", "Base62 length", "CORS origin"],
        answerIndex: 1,
        explanation: "Long-held leases and rising wait time reveal exhaustion or forgotten releases.",
      },
      {
        id: "pool-5",
        prompt: "For SQL in Go, what should usually provide pooling?",
        options: ["A custom list from scratch", "database/sql", "A browser cookie", "A URL shortener"],
        answerIndex: 1,
        explanation: "database/sql already implements a production connection pool with standard tuning controls.",
      },
    ],
  },
  {
    slug: "elevator-system-lld",
    track: "lld",
    title: "LLD: Elevator System",
    subtitle: "Model car state machines, hall-call dispatch, scheduling, and safety boundaries.",
    difficulty: "advanced",
    minutes: 65,
    tags: ["ood", "state-machine", "scheduling", "concurrency"],
    prerequisites: ["state machines", "priority queues", "mutexes"],
    blocks: [
      {
        type: "steps",
        title: "Learning goals",
        items: [
          "Separate hall calls, car requests, dispatch, scheduling, and hardware control.",
          "Implement a car state machine with ordered up/down stop sets.",
          "Assign calls using a cost strategy without violating car-local invariants.",
          "Discuss concurrency, starvation, capacity, faults, and safety-system boundaries.",
        ],
      },
      {
        type: "think",
        title: "HEAT · Hear and establish",
        clarify: [
          "How many floors/cars, and are basements or restricted floors present?",
          "Do hall calls include direction and do destination-control panels exist?",
          "What is optimized: average wait, tail wait, energy, or throughput?",
          "Which physical safety concerns are delegated to certified hardware controllers?",
        ],
        model: [
          "Dispatcher assigns hall calls; each Car owns its stop schedule and motion state.",
          "SCAN serves stops in the current direction before reversing.",
          "Door, overload, fire, maintenance, and emergency states constrain ordinary scheduling.",
        ],
        pitfalls: [
          "One mutable request map shared by dispatcher and car without ownership.",
          "Reversing for every nearest stop and starving riders ahead.",
          "Pretending application software directly guarantees physical safety.",
        ],
      },
      {
        type: "prose",
        title: "State, responsibilities, and invariants",
        body: "A HallCall is floor plus desired direction; a CarCall is an in-cabin destination. Dispatcher chooses a car based on route insertion cost, direction, load, age, and service zone. Once assigned, the car scheduler owns that stop. A car cannot move with doors open, cannot serve out-of-zone floors, and must reject normal dispatch while out of service. Up stops are ordered ascending and down stops descending. The simulation Tick is serialized per car; real systems consume sensor events and issue commands to a certified controller.",
      },
      {
        type: "code",
        title: "Components and state model",
        language: "go",
        code: `type Direction int8
const (
	Down Direction = -1
	Idle Direction = 0
	Up   Direction = 1
)

type CarState uint8
const (
	DoorsClosed CarState = iota
	Moving
	DoorsOpen
	OutOfService
)

type HallCall struct {
	ID string
	Floor int
	Direction Direction
	CreatedAt time.Time
}

type CarSnapshot struct {
	ID string
	Floor int
	Direction Direction
	State CarState
	LoadPercent int
	UpStops, DownStops []int
}

type DispatchStrategy interface {
	Choose(call HallCall, cars []CarSnapshot) (carID string, err error)
}

type CarController interface {
	AddHallStop(call HallCall) error
	AddCarStop(floor int) error
	Snapshot() CarSnapshot
	Tick(context.Context) (CarEvent, error)
}`,
      },
      {
        type: "code",
        title: "Car-local ordered scheduling",
        language: "go",
        code: `type ElevatorCar struct {
	mu sync.Mutex
	id string
	minFloor, maxFloor int
	floor int
	direction Direction
	state CarState
	up   *orderedset.Set[int]   // ascending
	down *orderedset.Set[int]   // ascending; take maximum while descending
}

func (c *ElevatorCar) AddCarStop(floor int) error {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.state == OutOfService || floor < c.minFloor || floor > c.maxFloor {
		return ErrInvalidStop
	}
	if floor > c.floor { c.up.Add(floor) }
	if floor < c.floor { c.down.Add(floor) }
	if floor == c.floor && c.state == DoorsClosed { c.state = DoorsOpen }
	if c.direction == Idle {
		if !c.up.Empty() { c.direction = Up } else if !c.down.Empty() { c.direction = Down }
	}
	return nil
}

func (c *ElevatorCar) nextStopLocked() (int, bool) {
	if c.direction == Up && !c.up.Empty() { return c.up.Min(), true }
	if c.direction == Down && !c.down.Empty() { return c.down.Max(), true }
	if !c.up.Empty() { c.direction = Up; return c.up.Min(), true }
	if !c.down.Empty() { c.direction = Down; return c.down.Max(), true }
	c.direction = Idle
	return 0, false
}`,
      },
      {
        type: "code",
        title: "Cost-based dispatch with aging",
        language: "go",
        code: `type CostDispatcher struct {
	now func() time.Time
}

func (d CostDispatcher) Choose(call HallCall, cars []CarSnapshot) (string, error) {
	bestID, bestCost := "", math.MaxFloat64
	for _, car := range cars {
		if car.State == OutOfService || car.LoadPercent >= 100 { continue }
		distance := math.Abs(float64(car.Floor - call.Floor))
		cost := distance
		if car.Direction != Idle && car.Direction != call.Direction {
			cost += 8
		}
		if car.Direction == Up && call.Floor < car.Floor ||
			car.Direction == Down && call.Floor > car.Floor {
			cost += 12
		}
		cost += float64(len(car.UpStops)+len(car.DownStops)) * 1.5
		cost += float64(car.LoadPercent) / 25
		cost -= min(d.now().Sub(call.CreatedAt).Seconds()/10, 10) // aging
		if cost < bestCost || cost == bestCost && car.ID < bestID {
			bestID, bestCost = car.ID, cost
		}
	}
	if bestID == "" { return "", ErrNoCarAvailable }
	return bestID, nil
}`,
      },
      {
        type: "steps",
        title: "Worked flow: hall call at floor 7 going up",
        items: [
          "Controller creates HallCall H7U once; repeated button presses coalesce to that active call.",
          "Dispatcher snapshots serviceable cars and scores route insertion, direction, load, queued stops, and call age.",
          "Car C2 accepts H7U into its owned up-stop set; assignment is recorded for reassignment on fault.",
          "C2 continues upward, opens only at scheduled floors, serves floor 7, and clears the hall call after arrival.",
          "If C2 becomes out of service before pickup, dispatcher requeues H7U while the safety controller handles physical motion.",
        ],
      },
      {
        type: "prose",
        title: "Failure modes, concurrency notes, and extensions",
        body: "Assignment and car acceptance can race with faults; use an assignment version/ack and requeue unacknowledged calls. Coalesce identical hall calls but preserve age to prevent starvation. Door-obstruction and overload events stop normal transitions and should not be simulated as mere direction flags. A single event loop per car simplifies ownership; dispatcher reads immutable snapshots. Extensions include destination dispatch, zoning, peak-time parking floors, VIP/service modes, energy cost, capacity prediction, fire recall, maintenance telemetry, and deterministic simulation with a fake clock.",
      },
      {
        type: "tradeoff",
        title: "Dispatch policy",
        choices: [
          {
            label: "Nearest idle car",
            pros: ["Simple and easy to explain", "Works at low traffic"],
            cons: ["Ignores moving cars already on route", "Poor throughput and fairness under load"],
            when: "Use as a baseline or tiny-building policy.",
          },
          {
            label: "SCAN with insertion cost",
            pros: ["Serves calls along existing routes", "Reduces reversals and average travel"],
            cons: ["Cost model needs tuning", "Can starve opposite-direction calls without aging"],
            when: "Use for conventional multi-car systems.",
          },
          {
            label: "Destination control",
            pros: ["Groups riders by destination", "Higher peak throughput"],
            cons: ["Requires destination input before boarding", "More complex reassignment and UX"],
            when: "Use in high-rise, high-volume buildings.",
          },
        ],
      },
      {
        type: "answer",
        title: "HEAT · Interview answer",
        opening: "I separate group dispatch from each elevator's deterministic state machine and explicitly leave physical safety to the controller boundary.",
        beats: [
          "Model HallCall, CarCall, ElevatorCar, Dispatcher, ordered stops, sensors, and immutable snapshots.",
          "Use SCAN per car and a pluggable assignment cost including direction, insertion, load, and age.",
          "Serialize car state in one mutex/event loop and coalesce duplicate calls.",
          "Acknowledge assignments and requeue on car fault or timeout.",
          "Cover doors, overload, out-of-service, starvation, zoning, destination control, metrics, and simulation tests.",
        ],
        closing: "The scheduler optimizes service while the car-local state machine preserves movement and door invariants.",
      },
    ],
    quiz: [
      {
        id: "elevator-1",
        prompt: "Who should own a car's stop sets?",
        options: ["Every hall button", "The elevator car scheduler", "The payment service", "All clients directly"],
        answerIndex: 1,
        explanation: "Single ownership makes route updates and motion transitions serializable.",
      },
      {
        id: "elevator-2",
        prompt: "Why add call age to dispatch cost?",
        options: ["To increase energy use", "To prevent old calls from starving", "To open doors faster", "To identify floors"],
        answerIndex: 1,
        explanation: "Aging gradually raises priority when newer, cheaper calls keep arriving.",
      },
      {
        id: "elevator-3",
        prompt: "What does SCAN do?",
        options: ["Reverse for every nearest request", "Serve stops in one direction before reversing", "Serve only floor zero", "Ignore car calls"],
        answerIndex: 1,
        explanation: "Directional batching reduces reversals and serves on-route requests.",
      },
      {
        id: "elevator-4",
        prompt: "What happens if an assigned car faults before pickup?",
        options: ["Lose the call", "Requeue after failed acknowledgement/health signal", "Open every door", "Charge the rider"],
        answerIndex: 1,
        explanation: "Assignment state must support recovery and reassignment.",
      },
      {
        id: "elevator-5",
        prompt: "Can application scheduling code alone guarantee physical safety?",
        options: ["Yes", "No; certified controller and sensor interlocks form a separate boundary", "Only with a mutex", "Only at one floor"],
        answerIndex: 1,
        explanation: "Scheduling models requests; real motion safety belongs to dedicated hardware/control systems.",
      },
    ],
  },
  {
    slug: "tic-tac-toe-lld",
    track: "lld",
    title: "LLD: Generalized Tic-Tac-Toe",
    subtitle: "Design a deterministic N×N game with legal moves, O(1) wins, and replay.",
    difficulty: "intermediate",
    minutes: 45,
    tags: ["ood", "games", "invariants", "testing"],
    prerequisites: ["slices", "interfaces", "state machines"],
    blocks: [
      {
        type: "steps",
        title: "Learning goals",
        items: [
          "Model game, board, players, turns, moves, and terminal outcomes.",
          "Enforce legal-move and state invariants before mutation.",
          "Implement O(1) win detection with per-player counters.",
          "Support concurrency control, replay, undo, and alternate rules.",
        ],
      },
      {
        type: "think",
        title: "HEAT · Hear and establish",
        clarify: [
          "Is the board N×N and is the win length always N?",
          "Are players local, remote, AI, or more than two?",
          "Are undo, replay, timers, and persistence required?",
          "Can two clients submit a move concurrently?",
        ],
        model: [
          "Game is the aggregate owning board, turn, history, and outcome.",
          "Board validates occupancy and tracks counters.",
          "A version makes remote move commands optimistic and idempotent.",
        ],
        pitfalls: [
          "Updating counters before checking an occupied cell.",
          "Signed +1/-1 sums that only support exactly two players.",
          "Letting a Player implementation mutate the board directly.",
        ],
      },
      {
        type: "prose",
        title: "Invariants first",
        body: "A move is legal only when the game is active, the expected player owns the turn, coordinates are in range, and the cell is empty. Exactly one move advances the version and turn. Once Won or Draw, no more moves are accepted. Per-player row, column, and diagonal counters generalize beyond two players without signed-sum cancellation. The move history is an append-only fact useful for replay, persistence, audit, and rebuilding counters.",
      },
      {
        type: "code",
        title: "Domain and player boundary",
        language: "go",
        code: `type PlayerID string
type Position struct{ Row, Col int }

type Player interface {
	ID() PlayerID
	ChooseMove(ctx context.Context, view GameView) (Position, error)
}

type Outcome uint8
const (
	InProgress Outcome = iota
	Won
	Draw
)

type Game struct {
	mu sync.Mutex
	size int
	cells []PlayerID
	players []PlayerID
	turn int
	outcome Outcome
	winner PlayerID
	version int64
	moves []Move
	rows map[PlayerID][]int
	cols map[PlayerID][]int
	diag map[PlayerID]int
	anti map[PlayerID]int
}

type Move struct {
	Number int
	Player PlayerID
	Position Position
	At time.Time
}`,
      },
      {
        type: "code",
        title: "Atomic legal move and O(1) win check",
        language: "go",
        code: `func (g *Game) Play(player PlayerID, pos Position, expectedVersion int64, at time.Time) (Outcome, error) {
	g.mu.Lock()
	defer g.mu.Unlock()
	if g.outcome != InProgress { return g.outcome, ErrGameFinished }
	if expectedVersion != g.version { return g.outcome, ErrStaleGame }
	if g.players[g.turn] != player { return g.outcome, ErrWrongTurn }
	if pos.Row < 0 || pos.Row >= g.size || pos.Col < 0 || pos.Col >= g.size {
		return g.outcome, ErrOutOfBounds
	}
	index := pos.Row*g.size + pos.Col
	if g.cells[index] != "" { return g.outcome, ErrOccupied }

	g.cells[index] = player
	g.rows[player][pos.Row]++
	g.cols[player][pos.Col]++
	if pos.Row == pos.Col { g.diag[player]++ }
	if pos.Row+pos.Col == g.size-1 { g.anti[player]++ }
	g.moves = append(g.moves, Move{Number: len(g.moves)+1, Player: player, Position: pos, At: at})
	g.version++

	if g.rows[player][pos.Row] == g.size || g.cols[player][pos.Col] == g.size ||
		g.diag[player] == g.size || g.anti[player] == g.size {
		g.outcome, g.winner = Won, player
	} else if len(g.moves) == g.size*g.size {
		g.outcome = Draw
	} else {
		g.turn = (g.turn + 1) % len(g.players)
	}
	return g.outcome, nil
}`,
      },
      {
        type: "code",
        title: "Replay validates persisted history",
        language: "go",
        code: `func Replay(size int, players []PlayerID, moves []Move) (*Game, error) {
	game, err := NewGame(size, players)
	if err != nil { return nil, err }
	for i, move := range moves {
		if move.Number != i+1 {
			return nil, fmt.Errorf("move sequence %d: %w", move.Number, ErrCorruptHistory)
		}
		_, err := game.Play(move.Player, move.Position, game.version, move.At)
		if err != nil {
			return nil, fmt.Errorf("replay move %d: %w", move.Number, err)
		}
	}
	return game, nil
}

func (g *Game) Snapshot() GameView {
	g.mu.Lock()
	defer g.mu.Unlock()
	cells := append([]PlayerID(nil), g.cells...)
	return GameView{Size: g.size, Cells: cells, Turn: g.players[g.turn],
		Outcome: g.outcome, Winner: g.winner, Version: g.version}
}`,
      },
      {
        type: "steps",
        title: "Worked flow: concurrent remote moves",
        items: [
          "Both clients render version 4, but only the active player should submit.",
          "The active player's Play(player, position, 4) acquires the lock, validates, mutates counters, and advances to version 5.",
          "A delayed duplicate with expectedVersion 4 returns ErrStaleGame and makes no mutation.",
          "The server returns the version-5 snapshot; clients reconcile from move history if needed.",
          "On a winning move, outcome and winner change in the same critical section, preventing a post-win move.",
        ],
      },
      {
        type: "prose",
        title: "Failure modes, concurrency notes, and extensions",
        body: "Snapshots must copy slices/maps rather than expose mutable internals. Undo reverses cell and counters, pops history, restores outcome/turn, and increments a command version; alternatively rebuild from history for simpler correctness. For K-in-a-row where K < N, row totals are insufficient—track directional runs from the last move in O(K) or use indexed segments. AI receives an immutable GameView and returns a proposal under a deadline. Persist commands with a unique game/version constraint for multi-process ownership.",
      },
      {
        type: "tradeoff",
        title: "Win detection",
        choices: [
          {
            label: "Scan affected row/column",
            pros: ["Simple and supports arbitrary symbols", "Easy to adapt for K-in-a-row"],
            cons: ["O(N) per move", "Repeated work"],
            when: "Use for small boards or flexible line rules.",
          },
          {
            label: "Per-player counters",
            pros: ["O(1) for full-row N×N wins", "Generalizes to more than two players"],
            cons: ["Extra O(players × N) state", "Does not directly solve K < N"],
            when: "Use for classic full-line generalized tic-tac-toe.",
          },
          {
            label: "Rebuild from event history",
            pros: ["Simple persistence and audit", "Excellent correctness oracle"],
            cons: ["O(number of moves) rebuild", "Needs snapshots for large games"],
            when: "Use for recovery and testing alongside incremental state.",
          },
        ],
      },
      {
        type: "answer",
        title: "HEAT · Interview answer",
        opening: "I make Game the aggregate so turn, board, counters, outcome, and history change atomically.",
        beats: [
          "Clarify N, win length, players, persistence, and concurrent clients.",
          "Define Player as an input strategy and expose only immutable GameView.",
          "Validate every rule before changing cells or counters.",
          "Use per-player row/column/diagonal counters for O(1) full-line detection.",
          "Add optimistic versioning, replay, undo semantics, AI deadlines, and K-in-a-row extension.",
        ],
        closing: "The design is deterministic and testable because every valid move is one state transition.",
      },
    ],
    quiz: [
      {
        id: "ttt-1",
        prompt: "Why not expose the cells slice directly?",
        options: ["Slices cannot store strings", "A caller could mutate game state without invariant checks", "It is always nil", "It prevents JSON"],
        answerIndex: 1,
        explanation: "Snapshots must copy mutable backing storage.",
      },
      {
        id: "ttt-2",
        prompt: "What does expectedVersion prevent?",
        options: ["Diagonal wins", "Two stale concurrent commands both applying", "Player creation", "Board allocation"],
        answerIndex: 1,
        explanation: "Only the command for the current aggregate version can commit.",
      },
      {
        id: "ttt-3",
        prompt: "Why use per-player counters rather than signed sums?",
        options: ["To support more than two players safely", "To remove rows", "To avoid turns", "To persist HTTP"],
        answerIndex: 0,
        explanation: "Signed +1/-1 schemes encode assumptions about exactly two players.",
      },
      {
        id: "ttt-4",
        prompt: "Do row totals solve K-in-a-row when K < N?",
        options: ["Always", "No; contiguous runs need different tracking", "Only for AI", "Only on draws"],
        answerIndex: 1,
        explanation: "A total does not prove K marks are adjacent.",
      },
    ],
  },
  {
    slug: "vending-machine-lld",
    track: "lld",
    title: "LLD: Vending Machine",
    subtitle: "Model money, inventory, selection, change, dispensing, and hardware failure.",
    difficulty: "advanced",
    minutes: 55,
    tags: ["ood", "state-machine", "money", "hardware"],
    prerequisites: ["interfaces", "state transitions", "integer arithmetic"],
    blocks: [
      {
        type: "steps",
        title: "Learning goals",
        items: [
          "Model machine sessions, products, slots, denomination inventory, and hardware ports.",
          "Make every user command a validated state transition.",
          "Compute bounded change and reserve inventory before irreversible dispense.",
          "Recover from jams, cancellations, power loss, and payment ambiguity.",
        ],
      },
      {
        type: "think",
        title: "HEAT · Hear and establish",
        clarify: [
          "Does the machine accept coins, notes, cards, or all three?",
          "Must it guarantee exact change before accepting a selection?",
          "Can users insert money before selection and cancel at any time?",
          "What hardware feedback confirms product and coin dispensing?",
        ],
        model: [
          "Machine owns one active Session and durable inventory.",
          "State controls valid commands; services calculate change and drive hardware ports.",
          "Reserve → actuate → confirm/reconcile handles irreversible physical effects.",
        ],
        pitfalls: [
          "Using float64 for money.",
          "Assuming greedy change works for every denomination set.",
          "Decrementing inventory without handling a dispenser jam.",
        ],
      },
      {
        type: "prose",
        title: "Domain and invariants",
        body: "Represent money as integer minor units with one currency. A Slot has product, price, quantity, and dispenser address. CashInventory tracks denomination counts; inserted cash belongs to the current session until commit. States include Idle, Credit, ReadyToDispense, Dispensing, Returning, and OutOfService. A session cannot dispense more than one selection, stock never goes negative, and returned/accepted denominations reconcile exactly with credit. Card authorization is not cash inventory and needs cancel/capture semantics.",
      },
      {
        type: "code",
        title: "Ports and aggregate state",
        language: "go",
        code: `type Cents int64
type Denomination Cents

type MachineState uint8
const (
	IdleState MachineState = iota
	CreditState
	DispensingState
	ReturningState
	OutOfServiceState
)

type Session struct {
	ID string
	Credit Cents
	Inserted map[Denomination]int
	Selected string
}

type ChangeMaker interface {
	Make(amount Cents, available map[Denomination]int) (map[Denomination]int, bool)
}

type ProductDispenser interface {
	Dispense(ctx context.Context, address string) (confirmation string, err error)
}

type CashDispenser interface {
	Return(ctx context.Context, coins map[Denomination]int) error
}

type Machine struct {
	mu sync.Mutex
	state MachineState
	session *Session
	slots map[string]*Slot
	cash map[Denomination]int
	change ChangeMaker
	products ProductDispenser
	returns CashDispenser
}`,
      },
      {
        type: "code",
        title: "Selection reserves product and exact change",
        language: "go",
        code: `func (m *Machine) Select(code string) (PurchasePlan, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.state != CreditState || m.session == nil {
		return PurchasePlan{}, ErrInvalidState
	}
	slot := m.slots[code]
	if slot == nil || slot.Quantity == 0 { return PurchasePlan{}, ErrSoldOut }
	if m.session.Credit < slot.Price { return PurchasePlan{}, ErrInsufficientCredit }

	available := cloneCounts(m.cash)
	addCounts(available, m.session.Inserted)
	changeDue := m.session.Credit - slot.Price
	change, ok := m.change.Make(changeDue, available)
	if !ok { return PurchasePlan{}, ErrExactChangeUnavailable }

	slot.Quantity-- // reservation under the aggregate lock
	m.session.Selected = code
	m.state = DispensingState
	return PurchasePlan{
		SessionID: m.session.ID, SlotCode: code, Address: slot.Address,
		Price: slot.Price, Accepted: cloneCounts(m.session.Inserted), Change: change,
	}, nil
}`,
      },
      {
        type: "code",
        title: "Actuate outside the lock, then finalize",
        language: "go",
        code: `func (m *Machine) Execute(ctx context.Context, plan PurchasePlan) error {
	confirmation, err := m.products.Dispense(ctx, plan.Address)
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.session == nil || m.session.ID != plan.SessionID || m.state != DispensingState {
		return ErrStalePlan
	}
	if err != nil {
		m.slots[plan.SlotCode].Quantity++ // release reservation
		m.state = OutOfServiceState
		return fmt.Errorf("dispense uncertain: %w", err)
	}
	addCounts(m.cash, plan.Accepted)
	subtractCounts(m.cash, plan.Change)
	m.state = ReturningState
	if err := m.ledger.RecordSale(plan, confirmation); err != nil {
		m.reconcile.Enqueue(plan.SessionID)
	}
	// Physical change return is driven by a persisted command after unlock.
	return nil
}

func (m *Machine) Cancel() (map[Denomination]int, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.state != CreditState { return nil, ErrInvalidState }
	refund := cloneCounts(m.session.Inserted)
	m.state = ReturningState
	return refund, nil
}`,
      },
      {
        type: "steps",
        title: "Worked flow: exact-change purchase",
        items: [
          "Idle creates a session on first accepted coin; each insert validates denomination and updates session credit.",
          "Select verifies stock and credit, computes change from machine cash plus inserted coins, reserves one item, and creates a plan.",
          "The product motor runs outside the mutex while the state rejects other session commands.",
          "Sensor confirmation commits accepted cash and change counts; a durable command drives change return.",
          "When product or change confirmation is ambiguous, the machine enters OutOfService and records reconciliation rather than guessing.",
        ],
      },
      {
        type: "prose",
        title: "Failure modes, concurrency notes, and extensions",
        body: "A physical timeout is ambiguous: the product may have dropped. Sensor and ledger IDs must make recovery idempotent. Persist session and reservations before actuation if power loss matters. Change algorithms should use bounded dynamic programming/backtracking because arbitrary denominations defeat greedy selection. Hardware calls never run under the aggregate mutex. Card payment should authorize before dispense and capture after confirmation, with reversal on failure. Extend with admin refill mode, price versions, temperature alarms, promotions, remote telemetry, multi-selection baskets, and accessibility.",
      },
      {
        type: "tradeoff",
        title: "State representation",
        choices: [
          {
            label: "Enum plus centralized transitions",
            pros: ["Complete transition table is visible", "Easy persistence and logging"],
            cons: ["Switch can grow", "State-specific data needs discipline"],
            when: "Use for a bounded machine with explicit command methods.",
          },
          {
            label: "State interface types",
            pros: ["Each state encapsulates valid behavior", "Easy to add isolated modes"],
            cons: ["Transitions spread across types", "Shared invariant handling can duplicate"],
            when: "Use when states have substantial distinct behavior.",
          },
          {
            label: "Persisted event/state machine",
            pros: ["Power-loss recovery and audit", "Idempotent hardware commands"],
            cons: ["More storage and reconciliation complexity", "Requires hardware correlation IDs"],
            when: "Use for real machines where physical effects and cash must reconcile.",
          },
        ],
      },
      {
        type: "answer",
        title: "HEAT · Interview answer",
        opening: "I would center the design on one session state machine and treat physical dispense as an irreversible external effect.",
        beats: [
          "Use integer money and model slots, cash inventory, session, state, and hardware ports.",
          "Validate commands by state and reserve product/change atomically.",
          "Run motors outside locks, correlate commands with sensor confirmations, and finalize idempotently.",
          "Use bounded exact-change search and separate card authorization/capture.",
          "Cover cancel, jam, power loss, maintenance, refill, reconciliation, and telemetry.",
        ],
        closing: "Correctness means the logical ledger and physical inventory can always be reconciled after uncertainty.",
      },
    ],
    quiz: [
      {
        id: "vend-1",
        prompt: "Why use integer cents?",
        options: ["To avoid floating-point money errors", "To disable change", "To sort slots", "To open hardware ports"],
        answerIndex: 0,
        explanation: "Binary floating-point cannot represent many decimal currency values exactly.",
      },
      {
        id: "vend-2",
        prompt: "Does greedy change always work?",
        options: ["Yes for every denomination set", "No; arbitrary inventories can require bounded search", "Only for cards", "Only with one coin"],
        answerIndex: 1,
        explanation: "Canonical denomination assumptions may not hold, especially with limited counts.",
      },
      {
        id: "vend-3",
        prompt: "Why actuate hardware outside the machine lock?",
        options: ["Hardware calls can block while invariants only need a reserved state", "Locks cannot protect maps", "To accept another session", "To change currency"],
        answerIndex: 0,
        explanation: "The reservation/state protects correctness without blocking all inspection on slow I/O.",
      },
      {
        id: "vend-4",
        prompt: "What should happen after ambiguous dispense timeout?",
        options: ["Assume no product dropped", "Enter reconciliation/out-of-service using command and sensor IDs", "Charge twice", "Reset inventory to zero"],
        answerIndex: 1,
        explanation: "Physical effects cannot be inferred safely from a missing response.",
      },
    ],
  },
  {
    slug: "library-management-lld",
    track: "lld",
    title: "LLD: Library Management System",
    subtitle: "Model catalog titles, physical copies, loans, holds, fines, and concurrent checkout.",
    difficulty: "advanced",
    minutes: 60,
    tags: ["ood", "library", "transactions", "queues"],
    prerequisites: ["interfaces", "state machines", "transactions"],
    blocks: [
      {
        type: "steps",
        title: "Learning goals",
        items: [
          "Separate bibliographic Work/Edition data from individually tracked Copies.",
          "Model Loan and Hold lifecycles with patron policy.",
          "Make checkout/return/hold assignment atomic under concurrent desks.",
          "Add search, fines, notifications, renewals, and inventory audit cleanly.",
        ],
      },
      {
        type: "think",
        title: "HEAT · Hear and establish",
        clarify: [
          "Are copies physical, digital, or both, and can branches transfer inventory?",
          "What patron limits, loan periods, renewals, and fines apply?",
          "Are holds FIFO, priority-based, edition-level, or title-level?",
          "How are lost/damaged copies and offline checkout handled?",
        ],
        model: [
          "Catalog metadata is separate from Copy inventory state.",
          "Loan and Hold are entities with histories, not fields overloaded on Copy.",
          "Repository transaction protects copy/loan/hold transitions.",
        ],
        pitfalls: [
          "Putting due date and borrower directly on Book metadata.",
          "Calculating fines from time.Since with negative/fractional-day errors.",
          "Checking availability then inserting a loan in separate transactions.",
        ],
      },
      {
        type: "prose",
        title: "Domain model and invariants",
        body: "A Work represents the conceptual title; an Edition carries ISBN, publisher, format, and language; a Copy is one barcoded item at a branch. Copy states include Available, OnLoan, OnHoldShelf, InTransit, Lost, and Repair. A copy has at most one active loan. A patron cannot exceed policy limits or borrow while blocked. Holds form a fair queue scoped to an edition/work and expire after pickup windows. Search is a read model and can lag; checkout always consults authoritative inventory.",
      },
      {
        type: "code",
        title: "Entities and policy contracts",
        language: "go",
        code: `type CopyState uint8
const (
	AvailableCopy CopyState = iota
	OnLoanCopy
	OnHoldShelfCopy
	InTransitCopy
	LostCopy
	RepairCopy
)

type Copy struct {
	ID, EditionID, BranchID string
	State CopyState
	Version int64
}

type Loan struct {
	ID, CopyID, PatronID string
	CheckedOutAt, DueAt time.Time
	ReturnedAt *time.Time
	Renewals int
}

type LendingPolicy interface {
	CheckEligibility(ctx context.Context, patron Patron, edition Edition) error
	DueAt(patron Patron, edition Edition, checkout time.Time) time.Time
	CanRenew(ctx context.Context, loan Loan) error
}

type LibraryRepository interface {
	Checkout(ctx context.Context, copyID, patronID string, dueAt time.Time) (Loan, error)
	ReturnAndAssignHold(ctx context.Context, copyID string, at time.Time) (ReturnResult, error)
	Renew(ctx context.Context, loanID string, expectedDue time.Time, newDue time.Time) (Loan, error)
}`,
      },
      {
        type: "code",
        title: "Checkout delegates atomic claim",
        language: "go",
        code: `func (s *LendingService) Checkout(ctx context.Context, copyID, patronID string) (Loan, error) {
	patron, err := s.patrons.ByID(ctx, patronID)
	if err != nil { return Loan{}, err }
	copy, edition, err := s.catalog.CopyAndEdition(ctx, copyID)
	if err != nil { return Loan{}, err }
	if copy.State != AvailableCopy {
		return Loan{}, ErrCopyUnavailable
	}
	if err := s.policy.CheckEligibility(ctx, patron, edition); err != nil {
		return Loan{}, err
	}
	now := s.clock.Now()
	due := s.policy.DueAt(patron, edition, now)
	loan, err := s.repo.Checkout(ctx, copy.ID, patron.ID, due)
	if err != nil { return Loan{}, err }
	_ = s.events.Append(ctx, LoanCreated{
		LoanID: loan.ID, PatronID: patron.ID, CopyID: copy.ID, DueAt: due,
	})
	return loan, nil
}

func (s *LendingService) Renew(ctx context.Context, loanID string) (Loan, error) {
	loan, err := s.loans.ByID(ctx, loanID)
	if err != nil { return Loan{}, err }
	if err := s.policy.CanRenew(ctx, loan); err != nil { return Loan{}, err }
	newDue := s.calendar.AddOpenDays(loan.DueAt, 14)
	return s.repo.Renew(ctx, loan.ID, loan.DueAt, newDue)
}`,
      },
      {
        type: "code",
        title: "Fine calculation uses calendar policy",
        language: "go",
        code: `type FinePolicy struct {
	GraceDays int
	DailyCents int64
	MaximumCents int64
	Calendar BusinessCalendar
}

func (p FinePolicy) Calculate(loan Loan, returnedAt time.Time) Money {
	if !returnedAt.After(loan.DueAt) {
		return Money{Currency: "USD"}
	}
	lateDays := p.Calendar.OpenDaysBetween(loan.DueAt, returnedAt)
	chargeable := max(0, lateDays-p.GraceDays)
	cents := min(int64(chargeable)*p.DailyCents, p.MaximumCents)
	return Money{Currency: "USD", Cents: cents}
}

func (s *LendingService) Return(ctx context.Context, copyID string) (ReturnResult, error) {
	result, err := s.repo.ReturnAndAssignHold(ctx, copyID, s.clock.Now())
	if err != nil { return ReturnResult{}, err }
	if result.Hold != nil {
		_ = s.events.Append(ctx, HoldReady{HoldID: result.Hold.ID, ExpiresAt: result.Hold.ExpiresAt})
	}
	return result, nil
}`,
      },
      {
        type: "steps",
        title: "Worked flow: return with queued hold",
        items: [
          "Desk scans copy C; repository locks its active loan and verifies it has not already returned.",
          "It closes the loan, finds the oldest eligible active hold, and transitions C to OnHoldShelf atomically.",
          "The selected hold receives pickup branch and expiry; other returns cannot assign the same hold.",
          "An outbox event triggers a notification while the transaction remains independent of providers.",
          "If no hold exists, C becomes Available and the search/availability projection updates asynchronously.",
        ],
      },
      {
        type: "prose",
        title: "Failure modes, concurrency notes, and extensions",
        body: "Eligibility checked before Checkout can change concurrently, so repository enforcement should include active-loan/blocked constraints or version checks. Hold queues need deterministic order and transaction locking such as SKIP LOCKED. Renewal must fail if an active hold now exists. Business-day fine calculation needs time zone and branch closure policy. Lost-copy charges and later returns should create ledger adjustments rather than overwrite fines. Extend with inter-branch transfer, digital license concurrency, RFID inventory, recommendations, author/title search indexing, privacy retention, and offline commands reconciled by idempotency key.",
      },
      {
        type: "tradeoff",
        title: "Hold granularity",
        choices: [
          {
            label: "Specific copy hold",
            pros: ["Predictable item", "Useful for rare or special copies"],
            cons: ["Waits even if equivalent copy is free", "Harder transfer optimization"],
            when: "Use for unique physical attributes or archival items.",
          },
          {
            label: "Edition-level hold",
            pros: ["Any equivalent copy can satisfy", "Better utilization and wait time"],
            cons: ["Needs atomic matching queue", "Format/language preferences must be represented"],
            when: "Use for normal lending inventory.",
          },
          {
            label: "Work-level hold",
            pros: ["Fastest fulfillment across editions", "Simple patron intent"],
            cons: ["May deliver an unwanted format or language", "Complex preference matching"],
            when: "Use when patrons explicitly accept any compatible edition.",
          },
        ],
      },
      {
        type: "answer",
        title: "HEAT · Interview answer",
        opening: "I separate catalog identity from inventory and model loans and holds as explicit lifecycle entities.",
        beats: [
          "Draw Work → Edition → Copy and Patron → Loan/Hold relationships.",
          "Inject lending, calendar, fine, repository, search, and event components.",
          "Make copy claim/loan creation and return/hold assignment transactional.",
          "Use deterministic hold ordering, optimistic renewal, and outbox notifications.",
          "Cover branches, transfers, digital licenses, lost items, privacy, search lag, and offline idempotency.",
        ],
        closing: "The model reflects real cardinality and keeps catalog reads separate from authoritative lending transitions.",
      },
    ],
    quiz: [
      {
        id: "lib-1",
        prompt: "Why separate Edition from Copy?",
        options: ["A copy has independent barcode, branch, and state", "To duplicate titles", "Because ISBN is a loan", "To avoid holds"],
        answerIndex: 0,
        explanation: "Many physical inventory items can share bibliographic edition metadata.",
      },
      {
        id: "lib-2",
        prompt: "What should be atomic on return?",
        options: ["Search indexing only", "Loan close and next-hold assignment/copy transition", "Email rendering", "Fine display formatting"],
        answerIndex: 1,
        explanation: "Otherwise another transaction can lend or assign the returned copy incorrectly.",
      },
      {
        id: "lib-3",
        prompt: "Why use a business calendar for fines?",
        options: ["Libraries may exclude closure days and use branch time zones", "To make all loans free", "To choose an ISBN", "To encrypt patrons"],
        answerIndex: 0,
        explanation: "Elapsed hours do not necessarily match policy-defined late days.",
      },
      {
        id: "lib-4",
        prompt: "Should search availability authorize checkout?",
        options: ["Yes, always", "No; it can lag, so authoritative state must be checked transactionally", "Only for ebooks", "Only after email"],
        answerIndex: 1,
        explanation: "Search is a read projection and is not the concurrency authority.",
      },
    ],
  },
  {
    slug: "idempotency-key-store-lld",
    track: "lld",
    title: "LLD: Idempotency Key Store",
    subtitle: "Coordinate retryable commands with request binding, leases, replay, and crash recovery.",
    difficulty: "advanced",
    minutes: 65,
    tags: ["idempotency", "transactions", "concurrency", "api"],
    prerequisites: ["transactions", "hashing", "HTTP retries"],
    blocks: [
      {
        type: "steps",
        title: "Learning goals",
        items: [
          "Define idempotency scope, request identity, state, retention, and replay semantics.",
          "Implement atomic first-writer ownership with leases and mismatch detection.",
          "Coordinate business commit with response recording to close crash windows.",
          "Handle concurrent duplicates, stale workers, large responses, and cleanup.",
        ],
      },
      {
        type: "think",
        title: "HEAT · Hear and establish",
        clarify: [
          "Which operations support keys and what is the retry horizon?",
          "Is scope tenant + route + key, account + operation, or globally unique?",
          "Should concurrent duplicates wait, poll, or immediately return conflict?",
          "Can the business write share a transaction with the idempotency record?",
        ],
        model: [
          "A record binds scope/key to canonical request hash exactly once.",
          "States are InProgress with owner generation, Completed with replay, or retryable/expired.",
          "Generation fencing prevents a stale lease holder from completing after takeover.",
        ],
        pitfalls: [
          "Treating key presence as enough without request hash comparison.",
          "Persisting completion after the business effect in an unrelated best-effort call.",
          "Allowing old workers to overwrite a newer owner's result.",
        ],
      },
      {
        type: "prose",
        title: "State machine and invariants",
        body: "The unique key is (scope, operation, key). RequestHash is created from canonical semantic input, not unstable raw JSON formatting or authorization headers. Begin atomically inserts InProgress or reads the existing record. A matching Completed record replays status, selected headers, and body. A different hash is Conflict. A live InProgress record returns Pending or allows bounded waiting. An expired lease can be taken over by incrementing Generation; Complete uses key + owner + generation fencing. Retention must exceed client and intermediary retry windows.",
      },
      {
        type: "code",
        title: "Store API and result algebra",
        language: "go",
        code: `type BeginKind uint8
const (
	Acquired BeginKind = iota
	Pending
	Replay
	Conflict
)

type Response struct {
	Status int
	Header map[string]string
	Body []byte
}

type Lease struct {
	Scope, Operation, Key, Owner string
	Generation int64
	ExpiresAt time.Time
}

type BeginResult struct {
	Kind BeginKind
	Lease *Lease
	Response *Response
	RetryAfter time.Duration
}

type IdempotencyStore interface {
	Begin(ctx context.Context, scope, operation, key, requestHash, owner string, lease time.Duration) (BeginResult, error)
	Complete(ctx context.Context, lease Lease, response Response) error
	Release(ctx context.Context, lease Lease, retryable bool) error
	Wait(ctx context.Context, scope, operation, key string) (Response, error)
}`,
      },
      {
        type: "code",
        title: "Transactional Begin with takeover fencing",
        language: "go",
        code: `func (s *SQLStore) Begin(ctx context.Context, scope, operation, key, hash, owner string, ttl time.Duration) (BeginResult, error) {
	var out BeginResult
	err := s.db.WithTx(ctx, func(tx *sql.Tx) error {
		rec, err := selectForUpdate(ctx, tx, scope, operation, key)
		if errors.Is(err, sql.ErrNoRows) {
			lease, err := insertInProgress(ctx, tx, scope, operation, key, hash, owner, s.now().Add(ttl))
			out = BeginResult{Kind: Acquired, Lease: &lease}
			return err
		}
		if err != nil { return err }
		if rec.RequestHash != hash {
			out.Kind = Conflict
			return nil
		}
		if rec.State == "completed" {
			out.Kind, out.Response = Replay, &rec.Response
			return nil
		}
		if s.now().Before(rec.LeaseExpiresAt) {
			out.Kind = Pending
			out.RetryAfter = rec.LeaseExpiresAt.Sub(s.now())
			return nil
		}
		lease, err := takeover(ctx, tx, rec, owner, s.now().Add(ttl), rec.Generation+1)
		out = BeginResult{Kind: Acquired, Lease: &lease}
		return err
	})
	return out, err
}`,
      },
      {
        type: "code",
        title: "One transaction closes the business/result gap",
        language: "go",
        code: `func (s *PaymentService) Create(ctx context.Context, lease Lease, cmd CreatePayment) (Response, error) {
	var response Response
	err := s.db.WithTx(ctx, func(tx *sql.Tx) error {
		payment, err := s.payments.InsertTx(ctx, tx, cmd)
		if err != nil { return err }
		body, err := json.Marshal(toPaymentResponse(payment))
		if err != nil { return err }
		response = Response{Status: http.StatusCreated, Body: body,
			Header: map[string]string{"Content-Type": "application/json"}}
		updated, err := s.keys.CompleteTx(ctx, tx, lease, response)
		if err != nil { return err }
		if !updated { return ErrLeaseLost }
		return nil
	})
	return response, err
}

func canonicalHash(cmd CreatePayment) string {
	normalized := struct {
		AccountID string
		AmountCents int64
		Currency string
	}{cmd.AccountID, cmd.Amount.Cents, strings.ToUpper(cmd.Amount.Currency)}
	body, _ := json.Marshal(normalized)
	sum := sha256.Sum256(body)
	return hex.EncodeToString(sum[:])
}`,
      },
      {
        type: "steps",
        title: "Worked flow: two concurrent retries",
        items: [
          "Requests A and B use the same tenant/operation/key and same canonical hash.",
          "A inserts InProgress generation 1 and receives the lease; B locks/reads it and receives Pending.",
          "A writes payment and Completed response in one database transaction using generation-1 fencing.",
          "B waits or retries, reads Completed, and receives the exact stored status/body without running payment logic.",
          "If A dies, a request after lease expiry takes generation 2; any late generation-1 Complete affects zero rows.",
        ],
      },
      {
        type: "prose",
        title: "Failure modes, concurrency notes, and extensions",
        body: "Do not take over while an external side effect may still be running unless that effect has its own idempotency key. If business state lives elsewhere, persist an operation state machine/outbox and reconcile rather than promising atomicity. Store only replay headers clients need and protect response bodies containing secrets. Large responses can reference immutable object storage. Waiting needs notification or bounded polling with context. Cleanup partitions by completed_at, but active leases and regulatory audit may require longer retention. Rate-limit unique keys to prevent storage exhaustion and validate key length/entropy.",
      },
      {
        type: "tradeoff",
        title: "Duplicate while in progress",
        choices: [
          {
            label: "Return 409/202 with retry hint",
            pros: ["No server waiter cost", "Simple bounded behavior"],
            cons: ["Client must retry", "More round trips"],
            when: "Use for longer operations and robust API clients.",
          },
          {
            label: "Wait for completion",
            pros: ["Duplicate can receive final result in one call", "Friendly for short operations"],
            cons: ["Consumes connections/waiters", "Needs notification, context, and timeout"],
            when: "Use with a short bounded wait then fall back to pending.",
          },
          {
            label: "Return operation resource",
            pros: ["Natural async polling", "Separates execution from request lifetime"],
            cons: ["More API surface", "Clients manage operation IDs"],
            when: "Use for workflows that routinely outlive request deadlines.",
          },
        ],
      },
      {
        type: "answer",
        title: "HEAT · Interview answer",
        opening: "I model idempotency as a fenced state machine binding one scoped key to one semantic request and outcome.",
        beats: [
          "Define Begin outcomes: Acquired, Pending, Replay, and Conflict.",
          "Canonicalize request inputs and compare hashes under a unique record lock.",
          "Use expiring leases with owner/generation fencing for crash takeover.",
          "Commit business state and replay response together when possible; otherwise use a durable operation/reconciliation design.",
          "Cover provider idempotency, wait policy, response security, cleanup, abuse limits, metrics, and exact replay.",
        ],
        closing: "The store prevents duplicate execution only when ownership and business commit are coordinated, not merely because a key was cached.",
      },
    ],
    quiz: [
      {
        id: "idem-1",
        prompt: "Why bind a key to a request hash?",
        options: ["To compress the body", "To reject reuse of the same key for different work", "To choose HTTP status", "To create a lease timeout"],
        answerIndex: 1,
        explanation: "A key identifies one semantic operation, not an arbitrary series of requests.",
      },
      {
        id: "idem-2",
        prompt: "What does generation fencing prevent?",
        options: ["Large bodies", "A stale lease owner overwriting a newer result", "JSON decoding", "Clock injection"],
        answerIndex: 1,
        explanation: "Complete must match the currently active generation.",
      },
      {
        id: "idem-3",
        prompt: "What is the safest same-database design?",
        options: ["Complete in a later goroutine", "Commit business state and idempotency response in one transaction", "Store only in memory", "Delete the key before response"],
        answerIndex: 1,
        explanation: "The atomic commit eliminates the effect-success/result-missing window.",
      },
      {
        id: "idem-4",
        prompt: "Can an expired local lease safely repeat any external charge?",
        options: ["Always", "Only if the external effect is itself idempotent/reconciled", "Only with a long JSON body", "Only on GET"],
        answerIndex: 1,
        explanation: "The original worker may have submitted the side effect before losing its lease.",
      },
      {
        id: "idem-5",
        prompt: "How long should completed records live?",
        options: ["Less than one network RTT", "At least the defined retry horizon, subject to policy", "Forever without cleanup", "Until the next request only"],
        answerIndex: 1,
        explanation: "Deleting earlier allows a legitimate delayed retry to execute again.",
      },
    ],
  },
  {
    slug: "circuit-breaker-lld",
    track: "lld",
    title: "LLD: Circuit Breaker",
    subtitle: "Fail fast during dependency trouble with safe Closed, Open, and Half-Open transitions.",
    difficulty: "advanced",
    minutes: 60,
    tags: ["resilience", "circuit-breaker", "concurrency", "state-machine"],
    prerequisites: ["mutexes", "timeouts", "error classification"],
    blocks: [
      {
        type: "steps",
        title: "Learning goals",
        items: [
          "Distinguish circuit breakers from retries, timeouts, rate limits, and bulkheads.",
          "Implement concurrency-safe Closed, Open, and Half-Open transitions.",
          "Classify outcomes and use generation fencing for late calls.",
          "Tune rolling thresholds, probes, fallback, metrics, and configuration scope.",
        ],
      },
      {
        type: "think",
        title: "HEAT · Hear and establish",
        clarify: [
          "What dependency/operation scope shares one breaker?",
          "Which errors indicate dependency health rather than caller mistakes?",
          "What minimum volume, failure ratio, open interval, and probe concurrency apply?",
          "What useful fallback exists, and can it overload another dependency?",
        ],
        model: [
          "Closed records classified outcomes and trips at a threshold.",
          "Open rejects without calling until cooldown.",
          "HalfOpen admits a bounded number of probes and closes or reopens from their results.",
        ],
        pitfalls: [
          "Counting 4xx validation errors as dependency failures.",
          "One global breaker coupling unrelated endpoints or tenants.",
          "Allowing a late pre-trip success to close a newer open generation.",
        ],
      },
      {
        type: "prose",
        title: "Purpose and invariants",
        body: "A circuit breaker protects callers and a failing dependency by refusing likely-useless work. It does not replace per-call deadlines; without them calls may hang before enough failures are observed. It does not limit concurrent healthy calls; use a bulkhead/semaphore. State transitions are synchronized, but the protected function runs outside the lock. Every admitted call receives the current generation, and its completion mutates state only if that generation is still relevant. Half-open has a strict probe budget to avoid a recovery stampede.",
      },
      {
        type: "code",
        title: "Policy, state, and public API",
        language: "go",
        code: `type State uint8
const (
	Closed State = iota
	Open
	HalfOpen
)

type Outcome uint8
const (
	Success Outcome = iota
	Failure
	Ignored
)

type Classifier func(error) Outcome

type Settings struct {
	MinimumRequests uint64
	FailureRatio float64
	OpenFor time.Duration
	HalfOpenMax int
}

type CircuitBreaker struct {
	mu sync.Mutex
	state State
	generation uint64
	openedAt time.Time
	requests, failures uint64
	probesInFlight, probeSuccesses int
	settings Settings
	classify Classifier
	now func() time.Time
}

var ErrCircuitOpen = errors.New("circuit breaker open")

func (b *CircuitBreaker) Execute(ctx context.Context, fn func(context.Context) error) error {
	generation, ok := b.before()
	if !ok { return ErrCircuitOpen }
	err := fn(ctx)
	b.after(generation, b.classify(err))
	return err
}`,
      },
      {
        type: "code",
        title: "Admission and generation transitions",
        language: "go",
        code: `func (b *CircuitBreaker) before() (uint64, bool) {
	b.mu.Lock()
	defer b.mu.Unlock()
	if b.state == Open && b.now().Sub(b.openedAt) >= b.settings.OpenFor {
		b.state = HalfOpen
		b.generation++
		b.probesInFlight, b.probeSuccesses = 0, 0
	}
	if b.state == Open { return b.generation, false }
	if b.state == HalfOpen {
		if b.probesInFlight >= b.settings.HalfOpenMax {
			return b.generation, false
		}
		b.probesInFlight++
	}
	return b.generation, true
}

func (b *CircuitBreaker) tripLocked() {
	b.state = Open
	b.generation++
	b.openedAt = b.now()
	b.requests, b.failures = 0, 0
	b.probesInFlight, b.probeSuccesses = 0, 0
}

func (b *CircuitBreaker) closeLocked() {
	b.state = Closed
	b.generation++
	b.requests, b.failures = 0, 0
	b.probesInFlight, b.probeSuccesses = 0, 0
}`,
      },
      {
        type: "code",
        title: "Outcome recording ignores stale generations",
        language: "go",
        code: `func (b *CircuitBreaker) after(generation uint64, outcome Outcome) {
	b.mu.Lock()
	defer b.mu.Unlock()
	if generation != b.generation || outcome == Ignored {
		return
	}
	switch b.state {
	case Closed:
		b.requests++
		if outcome == Failure { b.failures++ }
		if b.requests >= b.settings.MinimumRequests &&
			float64(b.failures)/float64(b.requests) >= b.settings.FailureRatio {
			b.tripLocked()
		}
	case HalfOpen:
		b.probesInFlight--
		if outcome == Failure {
			b.tripLocked()
			return
		}
		b.probeSuccesses++
		if b.probeSuccesses >= b.settings.HalfOpenMax {
			b.closeLocked()
		}
	}
}

func HTTPClassifier(err error) Outcome {
	if err == nil { return Success }
	var remote *RemoteError
	if errors.As(err, &remote) && remote.Status >= 400 && remote.Status < 500 {
		return Ignored
	}
	return Failure
}`,
      },
      {
        type: "steps",
        title: "Worked flow: trip, reject, probe, recover",
        items: [
          "Closed records 12 classified requests; 8 failures exceed minimum volume and threshold, so generation advances and state opens.",
          "Calls during Open receive ErrCircuitOpen immediately and may use a bounded fallback.",
          "After OpenFor, the first caller transitions to HalfOpen and consumes one probe slot; excess callers still fail fast.",
          "All configured probes succeed in the same generation, so the breaker resets counters and closes.",
          "A slow call admitted before the trip returns success with an old generation and cannot overwrite the new state.",
        ],
      },
      {
        type: "prose",
        title: "Failure modes, concurrency notes, and extensions",
        body: "The simple counters above are a tumbling generation, suitable for teaching; production breakers often use rolling time buckets so old failures decay. Require minimum volume to avoid opening on one failure. Open intervals should jitter across replicas to prevent synchronized probes. Classify timeout, connection, 429/5xx, and domain errors according to dependency semantics. Fallbacks can serve stale cache but must not hide correctness failures or create a retry storm elsewhere. Scope by host+operation and bound dynamic breaker cardinality. Export state, transitions, rejection counts, classified outcomes, and probe latency.",
      },
      {
        type: "tradeoff",
        title: "Trip signal",
        choices: [
          {
            label: "Consecutive failures",
            pros: ["Small state", "Trips quickly on a hard outage"],
            cons: ["Sensitive to unlucky bursts", "Success resets can hide high failure ratio"],
            when: "Use for simple low-volume dependencies.",
          },
          {
            label: "Failure ratio with minimum volume",
            pros: ["Handles partial degradation", "More stable under ordinary noise"],
            cons: ["Needs a time/generation window", "More tuning"],
            when: "Use for moderate/high-volume service calls.",
          },
          {
            label: "Latency/error rolling buckets",
            pros: ["Can trip on slow degradation", "Old observations decay"],
            cons: ["More memory and synchronization", "Threshold interactions are complex"],
            when: "Use when latency saturation is a primary failure signal.",
          },
        ],
      },
      {
        type: "answer",
        title: "HEAT · Interview answer",
        opening: "I place a breaker around one dependency operation, after a timeout and before bounded retries, with explicit outcome classification.",
        beats: [
          "Define Closed/Open/HalfOpen transitions, minimum volume, failure threshold, cooldown, and probe budget.",
          "Admit under a lock but run the dependency call outside it.",
          "Fence completions by generation so late calls cannot corrupt current state.",
          "Ignore caller/domain failures and count only signals of dependency health.",
          "Discuss rolling windows, jittered recovery, fallback safety, bulkheads, scope cardinality, and metrics.",
        ],
        closing: "The breaker reduces cascading failure only when classification and recovery behavior match the dependency.",
      },
    ],
    quiz: [
      {
        id: "cb-1",
        prompt: "What does Open state do?",
        options: ["Retries forever", "Rejects calls without invoking the dependency", "Closes all TCP globally", "Resets every error"],
        answerIndex: 1,
        explanation: "Fail-fast behavior protects capacity during likely dependency failure.",
      },
      {
        id: "cb-2",
        prompt: "Why limit half-open probes?",
        options: ["To avoid a recovery stampede", "To increase JSON size", "To remove timeouts", "To guarantee no failures"],
        answerIndex: 0,
        explanation: "A small sample tests recovery without immediately restoring full load.",
      },
      {
        id: "cb-3",
        prompt: "Why use generation fencing?",
        options: ["To version APIs", "To ignore late results from an earlier state generation", "To count headers", "To schedule GC"],
        answerIndex: 1,
        explanation: "Concurrent calls admitted before a trip can complete after state has changed.",
      },
      {
        id: "cb-4",
        prompt: "Does a circuit breaker replace deadlines?",
        options: ["Yes", "No; each call still needs a timeout/cancellation bound", "Only in HalfOpen", "Only for HTTP 404"],
        answerIndex: 1,
        explanation: "The breaker observes completed outcomes; a hung call still consumes resources.",
      },
      {
        id: "cb-5",
        prompt: "Should a caller's validation 400 count as dependency failure?",
        options: ["Usually no", "Always yes", "Only after success", "Only with a mutex"],
        answerIndex: 0,
        explanation: "It does not indicate the dependency is unhealthy.",
      },
    ],
  },
  {
    slug: "workflow-saga-lld",
    track: "lld",
    title: "LLD: Workflow and Saga Orchestrator",
    subtitle: "Coordinate durable multi-step work with retries, compensation, and event fencing.",
    difficulty: "advanced",
    minutes: 70,
    tags: ["workflow", "saga", "outbox", "distributed-systems"],
    prerequisites: ["state machines", "idempotency", "outbox pattern"],
    blocks: [
      {
        type: "steps",
        title: "Learning goals",
        items: [
          "Model a saga as durable workflow state rather than a chain of synchronous calls.",
          "Define step execute/compensate contracts and idempotency scopes.",
          "Implement leases, event correlation, retries, and reverse compensation.",
          "Reason about irreversible steps, human intervention, versioning, and observability.",
        ],
      },
      {
        type: "think",
        title: "HEAT · Hear and establish",
        clarify: [
          "Which steps cross transaction boundaries and which side effects are reversible?",
          "Is orchestration synchronous, event-driven, or expected to run for hours/days?",
          "What is each step's idempotency and timeout contract?",
          "What business outcome follows failed compensation or an irreversible step?",
        ],
        model: [
          "WorkflowInstance stores definition version, state, current step, attempts, and outputs.",
          "One leased worker decides the next transition and writes commands through an outbox.",
          "Replies correlate workflow/step/attempt; stale or duplicate events are ignored.",
        ],
        pitfalls: [
          "Keeping workflow progress only in goroutine memory.",
          "Assuming compensation restores the exact previous world.",
          "Changing a workflow definition underneath running instances.",
        ],
      },
      {
        type: "diagram",
        kind: "outbox",
        title: "Durable saga loop",
        caption: "State transition and command outbox commit together; replies drive the next transition or compensation.",
      },
      {
        type: "prose",
        title: "Saga semantics and invariants",
        body: "A saga provides coordination, not distributed ACID. Each local service commits its own transaction. An orchestrator records progress and invokes steps such as ReserveInventory, AuthorizePayment, and CreateShipment. On failure it compensates completed reversible steps in reverse order, for example ReleaseInventory and VoidAuthorization. Compensation is a new business action that can fail and cannot erase external observations. The workflow definition version is pinned at start. At most one lease generation decides transitions, and every command has a deterministic idempotency key.",
      },
      {
        type: "code",
        title: "Definition and durable instance model",
        language: "go",
        code: `type Step interface {
	Name() string
	Execute(ctx context.Context, input StepInput) (StepOutput, error)
	Compensate(ctx context.Context, input CompensationInput) error
	RetryPolicy() RetryPolicy
}

type Definition struct {
	Name, Version string
	Steps []Step
}

type WorkflowState uint8
const (
	Running WorkflowState = iota
	Waiting
	Compensating
	Succeeded
	Compensated
	NeedsIntervention
)

type Instance struct {
	ID, Definition, DefinitionVersion string
	State WorkflowState
	Current int
	Generation int64
	LeaseOwner string
	LeaseUntil time.Time
	Steps []StepRecord
	Version int64
}

type WorkflowRepository interface {
	Start(ctx context.Context, instance Instance, outbox Command) error
	Lease(ctx context.Context, worker string, limit int, until time.Time) ([]Instance, error)
	Apply(ctx context.Context, expectedVersion int64, transition Transition, outbox []Command) error
}`,
      },
      {
        type: "code",
        title: "Transition planner for success and failure",
        language: "go",
        code: `func (o *Orchestrator) OnResult(ctx context.Context, result StepResult) error {
	instance, err := o.repo.ByID(ctx, result.WorkflowID)
	if err != nil { return err }
	if result.Generation != instance.Generation ||
		result.StepIndex != instance.Current ||
		instance.Steps[result.StepIndex].State != StepRunning {
		return nil // duplicate or stale reply
	}
	step := o.definitions.Get(instance.Definition, instance.DefinitionVersion).
		Steps[result.StepIndex]

	if result.Err == nil {
		transition := markStepSucceeded(instance, result.Output)
		if result.StepIndex == len(instance.Steps)-1 {
			transition.InstanceState = Succeeded
			return o.repo.Apply(ctx, instance.Version, transition, nil)
		}
		next := result.StepIndex + 1
		command := executeCommand(instance, next, idempotencyKey(instance.ID, next, "execute"))
		transition.Current, transition.InstanceState = next, Waiting
		return o.repo.Apply(ctx, instance.Version, transition, []Command{command})
	}
	if step.RetryPolicy().CanRetry(instance.Steps[result.StepIndex].Attempts, result.Err) {
		command := retryCommand(instance, result.StepIndex, result.Err)
		return o.repo.Apply(ctx, instance.Version, markRetry(instance, result.Err), []Command{command})
	}
	transition, commands := beginCompensation(instance, result.Err)
	return o.repo.Apply(ctx, instance.Version, transition, commands)
}`,
      },
      {
        type: "code",
        title: "Reverse compensation with explicit terminal failure",
        language: "go",
        code: `func beginCompensation(instance Instance, cause error) (Transition, []Command) {
	for i := instance.Current - 1; i >= 0; i-- {
		if instance.Steps[i].State != StepSucceeded || !instance.Steps[i].Reversible {
			continue
		}
		command := Command{
			Type: "compensate", WorkflowID: instance.ID, StepIndex: i,
			Generation: instance.Generation,
			IdempotencyKey: idempotencyKey(instance.ID, i, "compensate"),
			Input: instance.Steps[i].Output,
		}
		return Transition{InstanceState: Compensating, Current: i, Cause: safeError(cause)},
			[]Command{command}
	}
	return Transition{InstanceState: Compensated, Cause: safeError(cause)}, nil
}

func compensationFailed(instance Instance, err error) Transition {
	return Transition{
		InstanceState: NeedsIntervention,
		Current: instance.Current,
		Cause: "compensation failed: " + safeError(err),
	}
}`,
      },
      {
        type: "steps",
        title: "Worked flow: order saga",
        items: [
          "Start pins OrderFulfillment v3, stores Running instance W, and writes ReserveInventory command in one transaction.",
          "Inventory consumes command idempotently and returns success correlated to W/step/generation.",
          "Orchestrator records output and atomically writes AuthorizePayment; a duplicate inventory reply is ignored.",
          "Shipment creation fails permanently, so the workflow commands VoidAuthorization then ReleaseInventory in reverse order.",
          "If release repeatedly fails, W becomes NeedsIntervention with complete audit state; an operator can retry or accept a business exception.",
        ],
      },
      {
        type: "prose",
        title: "Failure modes, concurrency notes, and extensions",
        body: "A worker crash after state commit but before publish is handled by the outbox relay. A reply before the command transaction is visible, duplicate replies, and out-of-order webhooks all require correlation and state checks. Lease generation plus optimistic instance version prevents split-brain transitions. Timers are durable records, not time.Sleep goroutines. Never automatically retry unknown errors forever; backoff, jitter, deadlines, and attempt caps lead to intervention. Irreversible shipment or email steps should occur after reversible steps or define forward recovery. Redact secrets from step outputs and encrypt sensitive state. Extend with parallel branches, joins, human approval, cancellation, child workflows, and deterministic replay.",
      },
      {
        type: "tradeoff",
        title: "Coordination style",
        choices: [
          {
            label: "Central orchestration",
            pros: ["Workflow state and sequence are visible", "Compensation and timers are easier to reason about"],
            cons: ["Orchestrator needs durable availability", "Can accumulate domain coupling"],
            when: "Use for multi-step business workflows and explicit recovery.",
          },
          {
            label: "Event choreography",
            pros: ["Services react independently", "No central step engine"],
            cons: ["Global flow is hard to inspect", "Cycles and accidental coupling emerge"],
            when: "Use for simple fact propagation with few participants.",
          },
          {
            label: "Synchronous call chain",
            pros: ["Low conceptual overhead", "Immediate response for short operations"],
            cons: ["Request lifetime owns reliability", "Partial completion and retry ambiguity are difficult"],
            when: "Use only for short, low-risk flows where all steps fit one reliability boundary.",
          },
        ],
      },
      {
        type: "answer",
        title: "HEAT · Interview answer",
        opening: "I would persist the saga as a versioned state machine and treat every remote step and compensation as an idempotent command.",
        beats: [
          "List steps, outputs, reversibility, deadlines, and business outcomes before defining code.",
          "Pin a definition version and store instance, step attempts, generation, and audit state.",
          "Commit each transition with its outbox command, then correlate and deduplicate replies.",
          "Retry classified transient failures and compensate successful reversible steps in reverse order.",
          "Cover lease fencing, durable timers, failed compensation, irreversible steps, operator intervention, security, and tracing.",
        ],
        closing: "The saga is reliable because progress is data and every transition can be recovered, replayed, or inspected.",
      },
    ],
    quiz: [
      {
        id: "saga-1",
        prompt: "Does compensation provide distributed rollback?",
        options: ["Yes, identical to ACID rollback", "No; it is a new business action that may fail", "Only for HTTP", "Only without persistence"],
        answerIndex: 1,
        explanation: "External effects may have been observed and compensating actions have their own outcomes.",
      },
      {
        id: "saga-2",
        prompt: "Why pin a definition version?",
        options: ["To stop all deployments", "So running instances keep stable step semantics", "To choose a database port", "To avoid IDs"],
        answerIndex: 1,
        explanation: "Changing the step graph underneath an instance can make its persisted position meaningless.",
      },
      {
        id: "saga-3",
        prompt: "What should be atomic in the orchestrator?",
        options: ["State transition and outgoing command outbox", "Remote service transactions", "Every participant database", "Logs and DNS"],
        answerIndex: 0,
        explanation: "The outbox closes the crash gap between deciding a transition and publishing its command.",
      },
      {
        id: "saga-4",
        prompt: "Why include workflow, step, attempt/generation in replies?",
        options: ["To make payloads larger", "To reject duplicate, stale, and out-of-order results", "To calculate prices", "To enable CORS"],
        answerIndex: 1,
        explanation: "Correlation lets the state machine determine whether a result still applies.",
      },
      {
        id: "saga-5",
        prompt: "What should happen after compensation repeatedly fails?",
        options: ["Forget the workflow", "Enter a visible intervention state with audit and retry controls", "Mark success", "Delete all outputs"],
        answerIndex: 1,
        explanation: "Some failures require an operator or forward-recovery business decision.",
      },
    ],
  },
];
