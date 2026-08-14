export type CheatSheetSection = {
  heading: string;
  bullets: string[];
};

export type CheatSheet = {
  slug: string;
  title: string;
  description: string;
  sections: CheatSheetSection[];
};

export const cheatSheets: CheatSheet[] = [
  {
    slug: "go-concurrency-pitfalls",
    title: "Go Concurrency Pitfalls",
    description:
      "Failure modes to recognize in reviews, production incidents, and concurrency interviews.",
    sections: [
      {
        heading: "Locks and shared state",
        bullets: [
          "Forgotten unlock: call defer mu.Unlock() immediately after Lock when the critical section is simple; for hot paths, keep an explicit unlock visible on every exit.",
          "Copied lock: do not copy a struct containing sync.Mutex, sync.RWMutex, sync.Once, or sync.Cond after first use; use pointer receivers and run go vet.",
          "Lock leaked across a call: avoid holding a mutex while invoking user callbacks, performing network I/O, or sending to a channel whose receiver may need the same lock.",
          "Check-then-act race: protect the complete invariant, not just separate Load and Store operations. The state can change between individually safe calls.",
          "RWMutex by reflex: readers still block writers, and bookkeeping has a cost. Start with Mutex and use measurements to justify read locking.",
          "Map alias escapes: returning an internal map, slice, or pointer lets callers mutate protected state without the lock. Return a copy or an immutable view.",
        ],
      },
      {
        heading: "Channel ownership",
        bullets: [
          "Send on closed channel panics. Give one producer or lifecycle owner responsibility for closing; receivers should not close a channel merely because they are done.",
          "Closing an already closed channel panics. Avoid scattered close calls; coordinate shutdown with one owner, sync.Once, or context cancellation.",
          "Receive from a closed channel succeeds immediately with the zero value. Use value, ok := <-ch when zero is meaningful or when a loop must detect closure.",
          "Nil channels block forever on send and receive. This can intentionally disable a select case, but an accidentally nil field creates a silent deadlock.",
          "A buffer absorbs a bounded burst; it does not guarantee delivery or fix missing backpressure. Define what happens when producers outrun consumers.",
          "Do not use a default select case casually. In a loop it can busy-spin at 100% CPU; when dropping work is intended, count and observe the drops.",
        ],
      },
      {
        heading: "Goroutine lifecycle",
        bullets: [
          "Every goroutine needs a termination story: completion, context cancellation, channel closure, or process lifetime. If none exists, assume it can leak.",
          "A goroutine blocked on send leaks when its receiver exits. Make the send cancellation-aware: select between ch <- value and ctx.Done().",
          "Unbounded goroutine-per-item fan-out converts load into memory, thread, and downstream pressure. Use a worker pool, semaphore, or errgroup limit.",
          "Loop variables and closures deserve review. Modern Go fixes common range capture cases, but explicit parameters remain clearer and older modules may retain old semantics.",
          "Recover only inside the goroutine that may panic; a recover in its parent cannot catch another goroutine's panic. Prefer fixing the panic over masking it.",
          "Use WaitGroup.Add before starting the goroutine, call Done exactly once, and never reuse a WaitGroup until the previous Wait has returned.",
        ],
      },
      {
        heading: "Cancellation and errors",
        bullets: [
          "Propagate context through HTTP, database, RPC, and blocking APIs. Replacing a caller context with context.Background severs deadlines and shutdown.",
          "Always call the CancelFunc returned by WithCancel, WithTimeout, or WithDeadline, usually with defer, so timers and child references are released promptly.",
          "Do not store context in long-lived structs or pass nil. Put ctx first in the method signature and let each operation derive narrower deadlines.",
          "A timeout does not stop arbitrary computation by itself. The callee must observe ctx.Done or invoke context-aware operations.",
          "Collect worker errors deliberately. Fire-and-forget goroutines can lose failures; errgroup is useful when sibling cancellation and one returned error fit the contract.",
          "Define shutdown ordering: stop intake, cancel producers, close or shut down queues, drain according to policy, wait for workers, then release dependencies.",
        ],
      },
      {
        heading: "Review and debugging",
        bullets: [
          "Run go test -race under realistic concurrent tests. A clean run raises confidence but cannot prove a code path is race-free.",
          "Capture goroutine profiles to find repeated creation stacks and blocked sends, receives, locks, or I/O.",
          "Use block and mutex profiles for waiting time, CPU profiles for spinning, and go tool trace for scheduler and goroutine transitions.",
          "Test cancellation, full queues, closed channels, duplicate work, partial failure, and shutdown—not only the success path.",
          "Never rely on scheduler timing, sleep calls, or observed channel wake order for correctness. Create an explicit happens-before relationship.",
        ],
      },
    ],
  },
  {
    slug: "gmp-scheduler-flow",
    title: "GMP Scheduler Flow",
    description:
      "A printable path through goroutine scheduling, stealing, polling, syscalls, and preemption.",
    sections: [
      {
        heading: "The G / M / P triad",
        bullets: [
          "G (goroutine) holds the stack, saved execution state, and scheduler metadata for a unit of Go work.",
          "M (machine) is an operating-system thread. It executes runtime code or a G and may block in the kernel.",
          "P (processor) owns local scheduling resources and is required for an M to execute ordinary Go code.",
          "At an instant, an M attached to a P executes one G. The associations can change as work blocks and wakes.",
          "GOMAXPROCS controls the number of Ps and therefore normal Go-code parallelism—not the goroutine count or a strict OS-thread limit.",
        ],
      },
      {
        heading: "Runnable queues and stealing",
        bullets: [
          "Newly runnable goroutines usually enter a P-local scheduling path, improving locality and avoiding one global lock.",
          "A global runnable queue supports injected work and fairness; the scheduler checks it periodically rather than promising FIFO order.",
          "An idle worker searches several sources: local work, global work, timers, network poll results, GC work, and other Ps.",
          "Work stealing moves part of another P's runnable work to an idle P, balancing uneven fan-out while preserving some locality.",
          "Queue capacities, scan order, and fairness intervals are runtime implementation details, not contracts application code can depend on.",
        ],
      },
      {
        heading: "Blocking, syscalls, and netpoll",
        bullets: [
          "A runtime-aware wait parks the G. The M can execute another runnable G while the parked goroutine consumes no P.",
          "When an M blocks in a syscall, the runtime can detach its P and hand that P to another M so Go work continues.",
          "After the syscall returns, the G must regain a P or become runnable for another M/P pair; it does not own its original thread forever.",
          "Pollable network I/O parks goroutines with the runtime netpoller. OS readiness events make those goroutines runnable again.",
          "cgo, locked threads, and non-pollable kernel calls can increase the number of Ms even when GOMAXPROCS stays fixed.",
        ],
      },
      {
        heading: "Preemption and monitoring",
        bullets: [
          "Preemption lets the runtime interrupt long-running Go work so other goroutines and garbage collection can progress.",
          "Asynchronous preemption, available since Go 1.14, reduces dependence on cooperative function-call safe points.",
          "Preemption is practical, not an instruction-by-instruction fairness promise; cgo and runtime critical sections can delay it.",
          "The sysmon runtime goroutine watches long syscalls, timers, netpoll opportunities, and goroutines that should be preempted.",
          "runtime.Gosched yields voluntarily, but scheduler yields should not be used to make a racy or deadlocking algorithm correct.",
        ],
      },
      {
        heading: "Interview soundbites",
        bullets: [
          "“G is the work, M is the OS thread, and P is the permission plus local scheduling context needed to run Go code.”",
          "“GOMAXPROCS limits active Ps; blocked syscalls can create or retain more Ms without increasing Go parallelism.”",
          "“Local queues provide locality, the global queue helps fairness, and idle Ps steal to redistribute runnable work.”",
          "“The netpoller turns socket readiness into runnable goroutines without dedicating one blocked thread to every connection.”",
          "“GMP explains performance and traces, but application correctness must never depend on scheduler ordering.”",
          "For evidence, use goroutine profiles, block and mutex profiles, CPU profiles, and go tool trace rather than inferring from counts alone.",
        ],
      },
    ],
  },
];
