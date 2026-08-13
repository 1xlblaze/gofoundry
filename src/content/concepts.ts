import type { Lesson } from "./types";

export const conceptsLessons: Lesson[] = [
  {
    slug: "go-fundamentals",
    track: "concepts",
    title: "Go Fundamentals",
    subtitle: "Packages, types, zero values, control flow, and idiomatic structure.",
    difficulty: "beginner",
    minutes: 20,
    tags: ["basics", "packages"],
    blocks: [
      {
        type: "prose",
        title: "Zero values matter",
        body: "Every type has a zero value (0, \"\", nil, false). Idiomatic Go leans on zeros instead of constructors when possible. Exported identifiers start with uppercase. Organize by package responsibility, not by layer folders alone.",
      },
      {
        type: "code",
        title: "Structs, methods, and pointers",
        language: "go",
        code: `type User struct {
	ID   int
	Name string
}

func (u User) Display() string { // value receiver — copy
	return u.Name
}

func (u *User) Rename(name string) { // pointer receiver — mutates
	u.Name = name
}`,
      },
      {
        type: "callout",
        tone: "tip",
        body: "Use pointer receivers when the method mutates state, for large structs, or for consistency across the method set.",
      },
    ],
    quiz: [
      {
        id: "cf1",
        prompt: "Zero value of a slice is…",
        options: ["Empty slice with len 0 cap 0 backing array", "nil", "[]T{}", "panic"],
        answerIndex: 1,
        explanation: "A slice’s zero value is nil (len=0, cap=0, no backing array).",
      },
    ],
  },
  {
    slug: "interfaces",
    track: "concepts",
    title: "Interfaces",
    subtitle: "Implicit satisfaction, small interfaces, and composition.",
    difficulty: "beginner",
    minutes: 25,
    tags: ["interfaces"],
    blocks: [
      {
        type: "prose",
        title: "Accept interfaces, return structs",
        body: "Go interfaces are satisfied implicitly. Define interfaces where they are consumed (consumer side), keep them small (io.Reader), and compose them. interface{} / any erases type — prefer generics or concrete types when you can.",
      },
      {
        type: "code",
        title: "Small interface + compile-time assertion",
        language: "go",
        code: `type Store interface {
	Get(ctx context.Context, id string) ([]byte, error)
	Put(ctx context.Context, id string, val []byte) error
}

type MemoryStore struct {
	mu sync.RWMutex
	m  map[string][]byte
}

func (s *MemoryStore) Get(ctx context.Context, id string) ([]byte, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	v, ok := s.m[id]
	if !ok {
		return nil, errNotFound
	}
	return append([]byte(nil), v...), nil
}

var _ Store = (*MemoryStore)(nil) // fails compile if methods missing`,
      },
    ],
    quiz: [
      {
        id: "iface1",
        prompt: "Does a type need to declare that it implements an interface?",
        options: ["Yes, with implements", "Yes, in the package clause", "No — method set match is enough", "Only for exported interfaces"],
        answerIndex: 2,
        explanation: "Satisfaction is implicit in Go.",
      },
    ],
  },
  {
    slug: "concurrency-goroutines",
    track: "concepts",
    title: "Goroutines & Channels",
    subtitle: "CSP-style concurrency, ownership of data, and select.",
    difficulty: "intermediate",
    minutes: 35,
    tags: ["goroutines", "channels", "select"],
    blocks: [
      {
        type: "prose",
        title: "Do not communicate by sharing memory",
        body: "Share memory by communicating. Prefer channel ownership patterns: one writer closes; receivers range until close. Use context for cancellation. Bounded concurrency via worker pools / semaphores (chan struct{}, n).",
      },
      {
        type: "code",
        title: "Worker pool + select timeout",
        language: "go",
        code: `func processAll(ctx context.Context, jobs []Job, workers int) error {
	ch := make(chan Job)
	errCh := make(chan error, 1)
	var wg sync.WaitGroup
	for i := 0; i < workers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for j := range ch {
				if err := j.Do(ctx); err != nil {
					select {
					case errCh <- err:
					default:
					}
					return
				}
			}
		}()
	}
	go func() {
		defer close(ch)
		for _, j := range jobs {
			select {
			case <-ctx.Done():
				return
			case ch <- j:
			}
		}
	}()
	wg.Wait()
	select {
	case err := <-errCh:
		return err
	default:
		return ctx.Err()
	}
}`,
      },
      {
        type: "callout",
        tone: "warn",
        body: "Goroutine leaks happen when a sender blocks forever or a receiver never drains. Always define who closes and how cancellation unblocks waiters.",
      },
    ],
    quiz: [
      {
        id: "conc1",
        prompt: "Who should close a channel?",
        options: [
          "Any receiver",
          "The sender / owner that knows when no more values will be sent",
          "The garbage collector",
          "Both ends simultaneously",
        ],
        answerIndex: 1,
        explanation: "Closing is a signal from the producer side; multiple closers panic.",
      },
    ],
  },
  {
    slug: "context-and-errors",
    track: "concepts",
    title: "Context & Error Handling",
    subtitle: "Cancellation trees, wrapping, and sentinel vs typed errors.",
    difficulty: "intermediate",
    minutes: 28,
    tags: ["context", "errors"],
    blocks: [
      {
        type: "prose",
        title: "Context is request-scoped",
        body: "Pass ctx as the first parameter. Never store contexts in structs (except rare short-lived helpers). Derive WithCancel / WithTimeout at boundaries. For errors: fmt.Errorf(\"...: %w\", err), errors.Is / errors.As, and avoid panics for expected failures.",
      },
      {
        type: "code",
        title: "Wrap + Is / As",
        language: "go",
        code: `var ErrNotFound = errors.New("not found")

func LoadUser(ctx context.Context, id string) (*User, error) {
	u, err := db.Find(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("user %s: %w", id, ErrNotFound)
		}
		return nil, fmt.Errorf("load user %s: %w", id, err)
	}
	return u, nil
}`,
      },
    ],
    quiz: [
      {
        id: "ce1",
        prompt: "errors.Is walks the error chain looking for…",
        options: ["Stack traces only", "A matching sentinel / comparable error", "HTTP status codes", "Panic values"],
        answerIndex: 1,
        explanation: "Is unwraps through %w wrappers until it finds a match.",
      },
    ],
  },
  {
    slug: "generics-and-testing",
    track: "concepts",
    title: "Generics & Testing",
    subtitle: "Type parameters, constraints, table-driven tests, and fuzzing.",
    difficulty: "intermediate",
    minutes: 30,
    tags: ["generics", "testing"],
    blocks: [
      {
        type: "prose",
        title: "Generics where duplication hurts",
        body: "Use type parameters for containers, optional helpers, and algorithms over comparable/ordered data. Prefer interfaces when behavior varies by method sets. Tests: table-driven, t.Parallel carefully with isolation, go test -fuzz for parsers.",
      },
      {
        type: "code",
        title: "Generic Map + table test",
        language: "go",
        code: `func Map[T, U any](in []T, f func(T) U) []U {
	out := make([]U, len(in))
	for i, v := range in {
		out[i] = f(v)
	}
	return out
}

func TestAdd(t *testing.T) {
	tests := []struct {
		name string
		a, b int
		want int
	}{
		{"pos", 1, 2, 3},
		{"neg", -1, -1, -2},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			if got := tc.a + tc.b; got != tc.want {
				t.Fatalf("got %d want %d", got, tc.want)
			}
		})
	}
}`,
      },
    ],
    quiz: [
      {
        id: "gt1",
        prompt: "Table-driven tests help primarily by…",
        options: [
          "Avoiding the testing package",
          "Expressing many cases with one harness",
          "Making code run on the GPU",
          "Replacing fuzzing entirely",
        ],
        answerIndex: 1,
        explanation: "One loop over cases keeps assertions consistent and easy to extend.",
      },
    ],
  },
  {
    slug: "memory-and-performance",
    track: "concepts",
    title: "Memory & Performance Habits",
    subtitle: "Allocations, escape analysis intuition, pooling, and profiling.",
    difficulty: "advanced",
    minutes: 32,
    tags: ["performance", "pprof"],
    blocks: [
      {
        type: "prose",
        title: "Measure first",
        body: "Use go test -bench, pprof (cpu/heap/block/mutex), and escape analysis (go build -gcflags=-m). Reduce allocations in hot paths: preallocate slices, reuse buffers with sync.Pool carefully, avoid interface boxing in tight loops, prefer value types when small.",
      },
      {
        type: "steps",
        title: "Profiling workflow",
        items: [
          "Write a benchmark that mirrors production shape",
          "Capture CPU and heap profiles under load",
          "Fix the top offenders; re-bench",
          "Watch for regressions in CI benchmarks",
        ],
      },
    ],
    quiz: [
      {
        id: "mp1",
        prompt: "sync.Pool is best for…",
        options: [
          "Long-lived database connections",
          "Reusable temporary objects in hot paths",
          "Cross-process shared memory",
          "Guaranteed retention of objects",
        ],
        answerIndex: 1,
        explanation: "Pool may drop objects anytime (e.g. GC); it is for ephemeral reuse.",
      },
    ],
  },
];
