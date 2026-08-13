import type { Lesson } from "./types";

export const internalsLessons: Lesson[] = [
  {
    slug: "scheduler-gpm",
    track: "internals",
    title: "Scheduler: G, M, P",
    subtitle: "How Go multiplexes goroutines onto OS threads.",
    difficulty: "advanced",
    minutes: 35,
    tags: ["scheduler", "runtime"],
    blocks: [
      {
        type: "prose",
        title: "The triad",
        body: "G = goroutine, M = OS thread (machine), P = processor (logical resource required to run Go code). GOMAXPROCS Ps cooperate to run runnable Gs. Work-stealing balances run queues. Blocking syscalls can detach M from P so other Ms keep running Go code.",
      },
      {
        type: "prose",
        title: "Preemption",
        body: "Modern Go uses asynchronous preemption (signals) so tight loops without function calls can still be preempted for GC/scheduling fairness. Understanding this explains why a busy-spin without calls can still yield — and why CPU-bound code needs enough Ps.",
      },
      {
        type: "callout",
        tone: "note",
        body: "GOMAXPROCS defaults to the CPU count. Raising it beyond CPUs rarely helps CPU-bound work; it can help when threads block in cgo/syscalls.",
      },
      {
        type: "steps",
        title: "What to remember for interviews",
        items: [
          "Goroutines are cheap user-space tasks, not 1:1 OS threads",
          "P owns a run queue; M must hold a P to execute Go code",
          "Network poller unblocks Gs waiting on sockets",
          "Hand off on syscalls keeps Ps busy",
        ],
      },
    ],
    quiz: [
      {
        id: "sched1",
        prompt: "What does P stand for in the Go scheduler?",
        options: ["Process", "Processor (logical)", "Priority", "Page"],
        answerIndex: 1,
        explanation: "P is a logical processor required to run Go code; count tied to GOMAXPROCS.",
      },
    ],
  },
  {
    slug: "garbage-collector",
    track: "internals",
    title: "Garbage Collector",
    subtitle: "Tri-color marking, write barriers, and pacing.",
    difficulty: "advanced",
    minutes: 35,
    tags: ["gc", "memory"],
    blocks: [
      {
        type: "prose",
        title: "Concurrent mark-sweep",
        body: "Go’s GC is a concurrent, tri-color mark-and-sweep collector. Mutators run while marking proceeds; write barriers keep the color invariant. GC pacing aims to meet a heap goal (GOGC / GOMEMLIMIT) without long STW. STW still occurs for brief mark termination / sweep prep.",
      },
      {
        type: "prose",
        title: "Practical knobs",
        body: "GOGC controls heap growth relative to live data (100 ≈ double). GOMEMLIMIT sets a soft memory limit. Reducing allocations often beats tuning. Use runtime/metrics and pprof heap profiles before changing knobs.",
      },
      {
        type: "callout",
        tone: "tip",
        body: "Pointers in many tiny objects increase scan work. Sometimes []struct{} layout or arena-like batching (carefully) reduces GC pressure more than micro-optimizations.",
      },
    ],
    quiz: [
      {
        id: "gc1",
        prompt: "GOGC=100 approximately means…",
        options: [
          "GC runs every 100ms",
          "Heap can grow to ~2× live data before GC triggers",
          "Only 100 goroutines allowed",
          "Disable GC",
        ],
        answerIndex: 1,
        explanation: "GOGC is a percentage of live heap growth target.",
      },
    ],
  },
  {
    slug: "slices-maps-internals",
    track: "internals",
    title: "Slices & Maps Internals",
    subtitle: "Headers, growth strategy, hmap buckets, and evacuation.",
    difficulty: "advanced",
    minutes: 30,
    tags: ["slices", "maps"],
    blocks: [
      {
        type: "prose",
        title: "Slice header",
        body: "runtime representation is roughly {array unsafe.Pointer, len int, cap int}. append grows by cloning to a larger array when len==cap. Growth factor is size-dependent (not always 2× for large slices).",
      },
      {
        type: "prose",
        title: "Map structure",
        body: "Maps use an hmap pointing to buckets (bmap). Keys hash to buckets; overflow chains handle collisions. During growth, incremental evacuation moves entries to a new bucket array. Iteration order is randomized intentionally.",
      },
      {
        type: "callout",
        tone: "warn",
        body: "Concurrent map read+write without sync panics (detected). Use sync.Map for specific patterns or a mutex around a normal map.",
      },
    ],
    quiz: [
      {
        id: "smi1",
        prompt: "Why is map iteration order randomized?",
        options: [
          "Hardware requirement",
          "To prevent programs from relying on unstable order and to mitigate collision attacks",
          "Because keys are always sorted",
          "GC requirement",
        ],
        answerIndex: 1,
        explanation: "Random seeds / iteration start discourage dependency on order and harden hashing.",
      },
    ],
  },
  {
    slug: "channels-internals",
    track: "internals",
    title: "Channels Internals",
    subtitle: "Buffers, wait queues, and sudog parking.",
    difficulty: "advanced",
    minutes: 28,
    tags: ["channels", "runtime"],
    blocks: [
      {
        type: "prose",
        title: "Under the hood",
        body: "An hchan holds a circular buffer (if buffered), mutex, and wait queues for senders/receivers (sudogs). Unbuffered send synchronizes directly with a receiver. Select builds a set of cases, randomizes order for fairness, and may park until a case is ready.",
      },
      {
        type: "steps",
        title: "Design implications",
        items: [
          "Unbuffered channel = rendezvous synchronization",
          "Buffered channel decouples burstiness up to capacity",
          "Closing broadcasts to waiting receivers",
          "Sending on closed channel panics — treat close as ownership signal",
        ],
      },
    ],
    quiz: [
      {
        id: "ch1",
        prompt: "An unbuffered channel send completes when…",
        options: [
          "The value is copied into a buffer",
          "A receiver is ready (rendezvous)",
          "GC runs",
          "GOMAXPROCS > 1",
        ],
        answerIndex: 1,
        explanation: "Unbuffered transfers happen directly between goroutines.",
      },
    ],
  },
  {
    slug: "interface-and-escape",
    track: "internals",
    title: "Interfaces & Escape Analysis",
    subtitle: "itab, dynamic dispatch, stack vs heap decisions.",
    difficulty: "advanced",
    minutes: 30,
    tags: ["interfaces", "escape-analysis"],
    blocks: [
      {
        type: "prose",
        title: "iface / eface",
        body: "An interface value is a pair: type metadata + data pointer (roughly). For interfaces with methods, itab connects concrete type to method table. Calling through an interface is an indirect call — harder for inlining. Boxing a concrete value into an interface often allocates.",
      },
      {
        type: "prose",
        title: "Escape analysis",
        body: "The compiler keeps values on the stack when it proves they do not outlive the frame. Returning pointers, storing into heap structures, or interface conversion can force heap allocation. Check with go build -gcflags='-m'.",
      },
      {
        type: "code",
        title: "Seeing escapes",
        language: "bash",
        code: `go build -gcflags='-m -m' ./...
# Look for: "moved to heap"`,
      },
    ],
    quiz: [
      {
        id: "ie1",
        prompt: "Storing a concrete value in an interface often…",
        options: [
          "Deletes the value",
          "May allocate (box) on the heap",
          "Forces GOMAXPROCS=1",
          "Disables inlining globally",
        ],
        answerIndex: 1,
        explanation: "Interface conversion frequently causes escape/boxing.",
      },
    ],
  },
  {
    slug: "sync-primitives",
    track: "internals",
    title: "Sync Primitives Deep Dive",
    subtitle: "Mutex, RWMutex, WaitGroup, Cond, Once, and atomic.",
    difficulty: "advanced",
    minutes: 32,
    tags: ["sync", "atomic"],
    blocks: [
      {
        type: "prose",
        title: "Choosing tools",
        body: "Mutex: exclusive critical sections. RWMutex: many readers / rare writers. WaitGroup: fork-join. Cond: wait for complex conditions (easy to misuse — prefer channels when possible). Once: safe init. atomic: lock-free counters/flags; not a substitute for invariants spanning multiple variables.",
      },
      {
        type: "code",
        title: "Copy-on-read cache with RWMutex",
        language: "go",
        code: `type Cache struct {
	mu sync.RWMutex
	m  map[string]string
}

func (c *Cache) Get(k string) (string, bool) {
	c.mu.RLock()
	v, ok := c.m[k]
	c.mu.RUnlock()
	return v, ok
}

func (c *Cache) Set(k, v string) {
	c.mu.Lock()
	c.m[k] = v
	c.mu.Unlock()
}`,
      },
      {
        type: "callout",
        tone: "warn",
        body: "Never copy a sync.Mutex (pass pointers). Embedding Mutex in structs is fine; copying the struct locks a different mutex.",
      },
    ],
    quiz: [
      {
        id: "sp1",
        prompt: "RWMutex is a win when…",
        options: [
          "Writes dominate",
          "Reads dominate and critical sections are short",
          "You need cross-process locks",
          "You avoid all memory fences",
        ],
        answerIndex: 1,
        explanation: "Readers share the lock; write-heavy workloads often do better with a plain Mutex.",
      },
    ],
  },
];
