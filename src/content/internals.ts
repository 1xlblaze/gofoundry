import type { Lesson } from "./types";

export const internalsLessons: Lesson[] = [
  {
    slug: "scheduler-gpm",
    track: "internals",
    title: "The Go Scheduler: G, M, and P",
    subtitle: "Reason from runnable goroutines to thread handoffs, work stealing, polling, and preemption.",
    difficulty: "advanced",
    minutes: 50,
    tags: ["scheduler", "runtime", "goroutines", "preemption"],
    prerequisites: ["goroutines and channels", "basic operating-system threads"],
    blocks: [
      {
        type: "steps",
        title: "Learning goals",
        items: [
          "Distinguish a goroutine (G), OS thread (M), and scheduler resource (P).",
          "Trace what happens when Go code blocks in a syscall or on network I/O.",
          "Explain local run queues, the global queue, work stealing, and asynchronous preemption.",
          "Use scheduler evidence instead of treating GOMAXPROCS as a tuning superstition.",
        ],
      },
      {
        type: "diagram",
        kind: "gpm-scheduler",
        title: "Runnable work flows through P",
        caption: "An M must own a P to execute Go code. A blocked M can lose its P while keeping the syscall-bound G.",
      },
      {
        type: "prose",
        title: "Mental model: tasks, threads, and execution rights",
        body: "A G stores a goroutine's stack, instruction position, and scheduling state. An M is an OS thread the kernel can run. A P is the runtime context required to execute Go code: it owns a local runnable queue, allocation caches, and other per-P state. GOMAXPROCS bounds the number of Ps, so at most that many goroutines execute Go code simultaneously. There may be more Ms than Ps because threads can be blocked in syscalls or cgo. New goroutines usually enter the current P's local queue; a scheduling tick periodically consults the global queue, and an idle P steals roughly half of another P's runnable work.",
      },
      {
        type: "code",
        title: "Separate concurrency from parallelism",
        language: "go",
        code: `func burn(label string) {
	for n := 0; n < 80_000_000; n++ {
		_ = n * n
	}
	fmt.Println(label)
}

func main() {
	runtime.GOMAXPROCS(1)
	var wg sync.WaitGroup
	for _, label := range []string{"A", "B"} {
		wg.Add(1)
		go func() { defer wg.Done(); burn(label) }()
	}
	wg.Wait()
}`,
      },
      {
        type: "steps",
        title: "Worked handoff: G1 enters a blocking file syscall",
        items: [
          "P0 is attached to M0 and runs G1. G2 and G3 wait in P0's local run queue.",
          "G1 calls into a syscall that the runtime expects may block. M0 enters the kernel with G1.",
          "The runtime's syscall-exit/monitor machinery makes P0 available. Another thread M1 acquires P0 and runs G2, so one blocked thread does not waste a logical processor.",
          "When M0 returns, it first tries to reacquire a P. If none is idle, G1 becomes runnable and is queued; M0 may park.",
          "Contrast network I/O: sockets integrated with the runtime poller normally park only the G. The M immediately runs another G, and readiness later injects the waiting G back into runnable queues.",
        ],
      },
      {
        type: "code",
        title: "Observe runnable pressure and scheduling",
        language: "go",
        code: `func main() {
	runtime.GOMAXPROCS(2)
	var wg sync.WaitGroup
	for i := 0; i < 20; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			time.Sleep(10 * time.Millisecond) // parks this G
			for n := 0; n < 2_000_000; n++ {}
		}(i)
	}
	wg.Wait()
}

// Run with:
// GODEBUG=schedtrace=100,scheddetail=1 go run .`,
      },
      {
        type: "prose",
        title: "Preemption and fairness",
        body: "Function calls and safe points give the runtime opportunities to suspend a G, scan its stack, and schedule something else. Modern Go can also request asynchronous preemption of long-running loops, preventing a call-free loop from monopolizing a P indefinitely. Scheduling is deliberately not a strict FIFO contract: timers, the network poller, global-queue checks, runnext slots, stealing, and preemption all affect order. Correct programs synchronize explicitly and never depend on which newly started goroutine runs first.",
      },
      {
        type: "code",
        title: "Yielding is a diagnostic, not synchronization",
        language: "go",
        code: `var ready atomic.Bool

go func() {
	ready.Store(true)
}()

for !ready.Load() {
	runtime.Gosched() // yields this G; it does not guarantee who runs next
}

// Prefer a channel when the event matters:
done := make(chan struct{})
go func() { close(done) }()
<-done`,
      },
      {
        type: "callout",
        tone: "warn",
        body: "Sleep, Gosched, and 'it usually runs first' are not synchronization. A race remains a race under GOMAXPROCS=1 because goroutines can be interleaved on one P.",
      },
      {
        type: "prose",
        title: "Edge cases and practical diagnosis",
        body: "A locked OS thread (runtime.LockOSThread), cgo call, or blocking syscall can increase M count without increasing Go parallelism. Oversubscribing CPU-bound work above available CPUs generally adds context switching. Container-aware defaults may differ by Go release, so inspect runtime.GOMAXPROCS(0) rather than assuming host CPU count. Scheduler traces answer queueing questions; execution traces reveal runnable latency, syscall blocks, network waits, and processor utilization over time.",
      },
    ],
    quiz: [
      {
        id: "sched-gmp",
        prompt: "M0 blocks in a syscall while holding P0. What preserves Go-level parallelism?",
        options: ["P0 stays idle", "P0 can be handed to another M", "GOMAXPROCS creates a process", "G1 moves into the network buffer"],
        answerIndex: 1,
        explanation: "The syscall-bound M keeps the blocked G, while the runtime can detach P0 and let another M execute runnable Go code.",
      },
      {
        id: "sched-p",
        prompt: "Which resource owns a local run queue and is required to execute Go code?",
        options: ["G", "M", "P", "The kernel process descriptor"],
        answerIndex: 2,
        explanation: "P is the scheduler and runtime resource; M supplies the OS thread, and G supplies the task.",
      },
      {
        id: "sched-order",
        prompt: "Which statement about goroutine order is safe?",
        options: ["Local queues are strict FIFO", "Gosched runs the oldest G next", "Creation order determines start order", "No order should be assumed without synchronization"],
        answerIndex: 3,
        explanation: "Multiple queues, stealing, polling, and preemption make execution order intentionally unspecified.",
      },
      {
        id: "sched-procs",
        prompt: "With GOMAXPROCS=2 and 1,000 CPU-ready goroutines, how many execute Go instructions simultaneously?",
        options: ["At most 2", "Exactly 1,000", "At most the M count", "Exactly one per channel"],
        answerIndex: 0,
        explanation: "Only two Ps exist, and each executing M needs one P.",
      },
    ],
  },
  {
    slug: "garbage-collector",
    track: "internals",
    title: "Garbage Collection and Heap Pacing",
    subtitle: "Trace tri-color marking over an object graph, then connect barriers and heap goals to latency.",
    difficulty: "advanced",
    minutes: 55,
    tags: ["gc", "memory", "write-barrier", "pacing"],
    prerequisites: ["pointers", "goroutines", "scheduler-gpm"],
    blocks: [
      {
        type: "steps",
        title: "Learning goals",
        items: [
          "Apply the white/gray/black abstraction to a concrete object graph.",
          "Explain why concurrent marking requires a write barrier.",
          "Relate live heap, GOGC, GOMEMLIMIT, allocation rate, and mutator assist.",
          "Reduce GC cost by changing allocation and pointer behavior before tuning knobs.",
        ],
      },
      {
        type: "prose",
        title: "Mental model: discover reachability while the program mutates",
        body: "Go uses a non-moving, concurrent mark-and-sweep collector. Conceptually, white means not yet proven reachable, gray means reachable but its outgoing pointers still need scanning, and black means reachable and scanned. Roots include stacks, globals, and runtime structures. Marking follows pointers from roots; sweeping later makes unmarked spans available for reuse. Most marking runs concurrently with application goroutines (mutators), though short stop-the-world phases establish a consistent start and complete marking.",
      },
      {
        type: "code",
        title: "Object graph used in the trace",
        language: "go",
        code: `type Node struct {
	Name       string
	Left, Right *Node
}

func graph() *Node {
	d := &Node{Name: "D"} // no root after return
	_ = d
	c := &Node{Name: "C"}
	b := &Node{Name: "B", Right: c}
	a := &Node{Name: "A", Left: b}
	return a // root -> A -> B -> C
}`,
      },
      {
        type: "steps",
        title: "Worked tri-color trace",
        items: [
          "Initially A, B, C, and D are white. The returned root points to A, so A becomes gray.",
          "Scan A: its pointer discovers B. A becomes black and B becomes gray.",
          "Scan B: its pointer discovers C. B becomes black and C becomes gray.",
          "Scan C: it has no child pointers, so C becomes black. The gray work queue is empty.",
          "D stayed white because no root reaches it. Sweep can reclaim D; A, B, and C remain live.",
          "If the mutator stores a pointer to white D into already-black A during marking, the barrier must expose that relationship to the collector so D is not incorrectly reclaimed.",
        ],
      },
      {
        type: "prose",
        title: "Why write barriers exist",
        body: "Concurrent code can create, delete, or move pointers while the collector scans. Without coordination, a mutator could hide the only path to a white object after the collector scanned the source. Go's hybrid write barrier shades relevant objects during pointer writes and maintains the collector's reachability invariant. The compiler emits barriers only where needed; pointer-free writes are cheaper. This is why pointer-dense heaps cost more than their byte count alone suggests: there is more scanning and more barrier activity.",
      },
      {
        type: "code",
        title: "Allocation rate is often the real lever",
        language: "go",
        code: `func normalizeSlow(parts []string) string {
	var out string
	for _, p := range parts {
		out += strings.ToLower(p) // repeatedly allocates and copies
	}
	return out
}

func normalize(parts []string) string {
	var b strings.Builder
	for _, p := range parts {
		b.WriteString(strings.ToLower(p))
	}
	return b.String()
}`,
      },
      {
        type: "prose",
        title: "Pacing, GOGC, and the memory limit",
        body: "After a cycle, the collector estimates live heap and sets the next heap goal. Roughly, GOGC=100 permits heap memory to grow by about the live-heap size, with adjustments for roots and runtime details. A lower value trades more GC CPU for a smaller heap; a higher value trades memory for fewer cycles. GOMEMLIMIT gives the runtime a soft total-memory budget and can force more frequent collection as the process approaches it. It is not a hard cgroup guardrail: the process can exceed it, and an unrealistically low value can cause GC thrashing.",
      },
      {
        type: "code",
        title: "Measure cycles and live memory",
        language: "go",
        code: `var before, after runtime.MemStats
runtime.ReadMemStats(&before)

items := make([][]byte, 50_000)
for i := range items {
	items[i] = make([]byte, 256)
}

runtime.GC() // diagnostic only; do not put forced GC in normal request paths
runtime.ReadMemStats(&after)
fmt.Println("collections:", after.NumGC-before.NumGC)
fmt.Println("heap live:", after.HeapAlloc)`,
      },
      {
        type: "steps",
        title: "When allocation outruns marking",
        items: [
          "The pacer budgets background mark workers based on allocation rate and the heap goal.",
          "A goroutine allocating rapidly may accumulate mark debt.",
          "The allocator then performs mutator assist: the application goroutine marks objects before its allocation proceeds.",
          "Assist time appears as application latency even though a long stop-the-world pause did not occur.",
          "Heap allocation profiles and runtime metrics reveal whether reducing allocation size, count, or pointer density is likely to help.",
        ],
      },
      {
        type: "callout",
        tone: "warn",
        body: "A heap profile's 'inuse' view explains retained live memory; its 'allocs' view explains allocation churn. Confusing the two leads to fixes that target retention when the cost is actually short-lived garbage, or vice versa.",
      },
      {
        type: "prose",
        title: "Edge cases",
        body: "Finalizers are nondeterministic and should not own correctness-critical cleanup. Memory returned by the Go heap may remain reserved or mapped, so process RSS need not fall immediately after a GC. Large pointer-free byte buffers add heap bytes but little scan work; a smaller graph of pointer-heavy objects may be more expensive to mark. sync.Pool can reduce temporary allocation but may be cleared by GC and must never be treated as durable storage.",
      },
    ],
    quiz: [
      {
        id: "gc-white",
        prompt: "At mark completion, what does a white object represent?",
        options: ["Recently allocated", "Not proven reachable from roots", "Pinned forever", "Stored on a goroutine stack"],
        answerIndex: 1,
        explanation: "Objects that remain unmarked are unreachable under the collector's maintained invariant and can be swept.",
      },
      {
        id: "gc-barrier",
        prompt: "Why is a write barrier required during concurrent marking?",
        options: ["To sort heap addresses", "To stop every allocation", "To expose pointer-graph changes that could hide reachable objects", "To move objects compactly"],
        answerIndex: 2,
        explanation: "The mutator changes pointers while marking proceeds; barriers preserve reachability information.",
      },
      {
        id: "gc-gogc",
        prompt: "What is the usual effect of raising GOGC?",
        options: ["Less memory and more cycles", "More memory and fewer cycles", "A hard RSS cap", "No heap effect"],
        answerIndex: 1,
        explanation: "A larger growth target generally allows more heap growth before the next cycle.",
      },
      {
        id: "gc-assist",
        prompt: "What is mutator assist?",
        options: ["The kernel sweeps memory", "An allocating goroutine performs marking work to repay allocation debt", "A finalizer allocates a replacement", "A P steals a run queue"],
        answerIndex: 1,
        explanation: "Assist keeps marking on pace by charging some collector work to fast allocators.",
      },
    ],
  },
  {
    slug: "slices-maps-internals",
    track: "internals",
    title: "Slices and Maps Under the Hood",
    subtitle: "Predict aliasing, append behavior, hashing, overflow, and incremental map growth.",
    difficulty: "advanced",
    minutes: 55,
    tags: ["slices", "maps", "allocation", "hashing"],
    prerequisites: ["arrays and slices", "maps"],
    blocks: [
      {
        type: "steps",
        title: "Learning goals",
        items: [
          "Use the slice header model to predict aliasing and append results.",
          "Explain why subslices can retain large arrays and how full-slice expressions control capacity.",
          "Trace a lookup through hash selection, bucket metadata, entries, and overflow.",
          "Reason about incremental map growth and unsafe concurrent access.",
        ],
      },
      {
        type: "prose",
        title: "Mental model: a slice is a view",
        body: "A slice value is approximately a three-word descriptor: pointer to an array segment, length, and capacity. Assignment copies only the descriptor, so two slices can address the same elements. append writes into the existing backing array while capacity remains; otherwise it allocates a larger array, copies elements, and returns a new descriptor. Growth is an implementation strategy, not an API guarantee, and the factor is not always two.",
      },
      {
        type: "code",
        title: "Predict aliasing before running it",
        language: "go",
        code: `base := []int{10, 20, 30, 40}
a := base[:2]       // len=2 cap=4
b := append(a, 99) // reuses base; writes index 2
fmt.Println(base)   // [10 20 99 40]

c := base[:2:2]     // full slice expression caps capacity at 2
d := append(c, 77) // must allocate
fmt.Println(base)   // still [10 20 99 40]
fmt.Println(d)      // [10 20 77]`,
      },
      {
        type: "steps",
        title: "Worked append trace",
        items: [
          "a's data pointer targets base[0], length is 2, and capacity is 4.",
          "append needs length 3, which fits capacity 4, so no allocation is required.",
          "The runtime writes 99 at the backing array's index 2. base observes the same element.",
          "c uses [low:high:max], making capacity max-low = 2.",
          "Appending a third element cannot fit, so d receives a new backing array and base is isolated.",
        ],
      },
      {
        type: "code",
        title: "Release an accidentally retained backing array",
        language: "go",
        code: `func token(data []byte) []byte {
	// Returning data[:16] could retain a multi-megabyte input array.
	out := make([]byte, 16)
	copy(out, data[:16])
	return out
}

func cloneToken(data []byte) []byte {
	return bytes.Clone(data[:16])
}`,
      },
      {
        type: "diagram",
        kind: "hash-map-buckets",
        title: "Hash routing and buckets",
        caption: "Hash bits choose a bucket; compact per-slot hash metadata rejects most nonmatches before key equality checks.",
      },
      {
        type: "prose",
        title: "Map mental model: indexed groups plus overflow",
        body: "A map header points to runtime-managed bucket storage and tracks count, hash seed, growth state, and flags. A hash of the key selects a bucket using low bits. Small hash fingerprints recorded with bucket slots cheaply filter candidates before full key comparison. Collisions occupy other slots or overflow storage. Exact layout and bucket strategy are runtime implementation details that can evolve; the stable language guarantees are key comparability, unspecified iteration order, and defined read/write semantics.",
      },
      {
        type: "code",
        title: "Map identity, zero values, and deterministic output",
        language: "go",
        code: `counts := make(map[string]int)
for _, word := range []string{"go", "map", "go"} {
	counts[word]++ // absent lookup returns int's zero value
}

v, ok := counts["missing"] // v == 0, ok == false
_ = v

keys := make([]string, 0, len(counts))
for k := range counts {
	keys = append(keys, k)
}
slices.Sort(keys) // impose order explicitly`,
      },
      {
        type: "steps",
        title: "Worked growth and evacuation",
        items: [
          "As entries and overflow pressure grow, the runtime begins a growth operation rather than pausing to copy the entire map.",
          "The header retains old bucket storage and points at new destination storage.",
          "Subsequent map operations evacuate a small amount of old-bucket work incrementally.",
          "During same-size cleanup growth, entries redistribute into cleaner storage; during capacity growth, an old bucket's entries divide between destinations according to another hash bit.",
          "A lookup during growth consults evacuation state so it searches the correct old or new location.",
        ],
      },
      {
        type: "callout",
        tone: "warn",
        body: "Never retain pointers to map elements: map indexing is not addressable because growth may relocate entries. Copy the value out, modify it, then assign it back—or store pointer values deliberately.",
      },
      {
        type: "prose",
        title: "Edge cases and concurrency",
        body: "A nil map is readable but assignment to it panics. NaN is comparable yet not equal to itself, making it a surprising floating-point key. Deleting a missing key is safe. Iteration can vary between passes and may reflect mutations in deliberately unspecified ways. Unsynchronized concurrent reads and writes are invalid and may produce a runtime fatal error; detection is not a substitute for a mutex, ownership, or sync.Map. Even concurrent writes to distinct keys are unsafe because they mutate shared map metadata.",
      },
    ],
    quiz: [
      {
        id: "sm-append",
        prompt: "When can append mutate elements visible through another slice?",
        options: ["Never", "When both views share a backing array and capacity permits reuse", "Only for strings", "Only after map growth"],
        answerIndex: 1,
        explanation: "Slice assignment copies the descriptor, and append reuses shared storage if the new length fits capacity.",
      },
      {
        id: "sm-cap",
        prompt: "What does s[:n:n] accomplish before append?",
        options: ["Sets length to zero", "Forces future append beyond n to allocate", "Sorts the slice", "Pins the backing array"],
        answerIndex: 1,
        explanation: "The third index limits capacity to n, preventing append from overwriting later elements in the old array.",
      },
      {
        id: "sm-growth",
        prompt: "Why is map growth incremental?",
        options: ["To preserve sorted order", "To spread relocation work across operations", "To make keys addressable", "To disable hashing"],
        answerIndex: 1,
        explanation: "Incremental evacuation avoids one large latency spike proportional to the entire map.",
      },
      {
        id: "sm-nil",
        prompt: "Which operation on a nil map panics?",
        options: ["Lookup", "Range", "Delete", "Assignment"],
        answerIndex: 3,
        explanation: "Reads, range, and delete are safe on nil maps; inserting requires initialized storage.",
      },
    ],
  },
  {
    slug: "channels-internals",
    track: "internals",
    title: "Channels Internals",
    subtitle: "Follow values through hchan buffers, wait queues, parking, select, and close.",
    difficulty: "advanced",
    minutes: 50,
    tags: ["channels", "runtime", "select", "synchronization"],
    prerequisites: ["goroutines and channels", "scheduler-gpm"],
    blocks: [
      {
        type: "steps",
        title: "Learning goals",
        items: [
          "Explain the conceptual fields in hchan and why a channel operation needs synchronization.",
          "Trace buffered and unbuffered send/receive fast paths and blocking paths.",
          "Understand sudog wait records, goroutine parking, select registration, and close.",
          "Choose ownership and buffering rules from semantics rather than folklore.",
        ],
      },
      {
        type: "prose",
        title: "Mental model: a synchronized queue plus waiters",
        body: "Conceptually, runtime hchan stores element type and size, closed state, a mutex, send and receive wait queues, and—when capacity is nonzero—a circular buffer with capacity, count, send index, and receive index. These are explanatory fields, not a public ABI. Waiting queue entries are sudog records that connect a G to a particular synchronization operation and, when necessary, the value transfer location. The runtime parks the G instead of blocking its M, letting the M execute other runnable work.",
      },
      {
        type: "code",
        title: "Unbuffered rendezvous establishes a handoff",
        language: "go",
        code: `func main() {
	ch := make(chan string)
	go func() {
		message := "fully initialized"
		ch <- message // waits for a receiver
	}()

	got := <-ch
	fmt.Println(got)
}`,
      },
      {
        type: "steps",
        title: "Worked unbuffered send",
        items: [
          "The sender locks channel state and checks the receive wait queue.",
          "If a receiver already waits, the value can be copied directly from sender to receiver, bypassing a buffer.",
          "The receiver is made runnable, the channel lock is released, and the send completes.",
          "If no receiver waits, the sender creates/uses a sudog, links it into sendq, and parks its G.",
          "A later receiver pairs with that sudog, copies the value, and readies the sender.",
        ],
      },
      {
        type: "code",
        title: "Buffered channel as a bounded circular queue",
        language: "go",
        code: `jobs := make(chan int, 2)
jobs <- 10 // buffer: [10, _], qcount=1
jobs <- 20 // buffer: [10,20], qcount=2

go func() {
	jobs <- 30 // blocks until a receive creates room
}()

fmt.Println(<-jobs) // 10; sender can now progress
fmt.Println(<-jobs) // 20
fmt.Println(<-jobs) // 30`,
      },
      {
        type: "prose",
        title: "Buffered send and receive",
        body: "A send first prefers a waiting receiver; otherwise, if qcount is below capacity, it copies into the send index and advances the circular index. When full, the sender queues and parks. Receive is symmetric: prefer a waiting sender when appropriate, otherwise consume from the receive index, zero the vacated slot when needed for GC, and advance it. Capacity changes scheduling and backpressure, but it does not remove synchronization or make a protocol automatically correct.",
      },
      {
        type: "code",
        title: "Close with single-owner discipline",
        language: "go",
        code: `func produce(out chan<- int) {
	defer close(out) // the sole sender owns closure
	for i := 1; i <= 3; i++ {
		out <- i
	}
}

ch := make(chan int, 2)
go produce(ch)
for v := range ch {
	fmt.Println(v)
}`,
      },
      {
        type: "steps",
        title: "Close and select mechanics",
        items: [
          "close marks the channel closed and wakes blocked receivers; they drain buffered values, then receive the zero value with ok=false.",
          "Blocked senders are also awakened, but their operation panics because sending after close is invalid.",
          "select first checks cases in a permuted order. If one or more are ready, one is chosen without a user-visible priority guarantee.",
          "If none is ready and no default exists, the G registers wait records with the involved channels using a consistent lock order, then parks.",
          "A winning operation wakes the G; registrations for losing cases are removed before select returns.",
        ],
      },
      {
        type: "callout",
        tone: "warn",
        body: "Closing is not cancellation for senders that may still send. Coordinate producer shutdown first, or let the single producer close. 'Recover from send on closed channel' masks a broken ownership protocol.",
      },
      {
        type: "prose",
        title: "Nil channels and fairness edge cases",
        body: "Send and receive on a nil channel block forever; close(nil) panics. This makes nil useful for disabling a select case dynamically. A default case makes select nonblocking and can create a hot spin unless paired with useful work or pacing. Select makes a pseudo-random choice among currently ready cases, but it promises no starvation-free global fairness. Channel values are copied, so sending a pointer or slice transfers a reference to shared data, not exclusive ownership by itself.",
      },
    ],
    quiz: [
      {
        id: "chan-park",
        prompt: "When a channel send cannot proceed, what normally happens?",
        options: ["Its OS thread must remain blocked", "The G is queued and parked so the M can run other work", "The value is dropped", "The channel grows"],
        answerIndex: 1,
        explanation: "A sudog records the wait, and scheduler parking frees the M to execute another G.",
      },
      {
        id: "chan-close",
        prompt: "After a closed buffered channel is drained, what does receive return?",
        options: ["It panics", "Zero value and ok=false", "The last value forever", "nil for every element type"],
        answerIndex: 1,
        explanation: "Buffered values arrive first; subsequent receives immediately return the element zero value and false.",
      },
      {
        id: "chan-nil",
        prompt: "Why assign a select input channel to nil?",
        options: ["To close it", "To disable that case because nil-channel operations never become ready", "To empty its buffer", "To prioritize it"],
        answerIndex: 1,
        explanation: "A nil channel blocks forever, so its select case is excluded until the variable becomes non-nil.",
      },
      {
        id: "chan-buffer",
        prompt: "What guarantee does channel capacity provide?",
        options: ["No races on referenced objects", "Bounded queued transfers before send must wait", "FIFO scheduling of goroutines", "Automatic cancellation"],
        answerIndex: 1,
        explanation: "Capacity bounds buffered elements; it does not grant ownership or a global scheduling order.",
      },
    ],
  },
  {
    slug: "interface-and-escape",
    track: "internals",
    title: "Interfaces and Escape Analysis",
    subtitle: "Connect interface representation and compiler data-flow proofs to stack, heap, dispatch, and nil behavior.",
    difficulty: "advanced",
    minutes: 50,
    tags: ["interfaces", "escape-analysis", "compiler", "allocation"],
    prerequisites: ["interfaces", "pointers and methods"],
    blocks: [
      {
        type: "steps",
        title: "Learning goals",
        items: [
          "Model an interface value as dynamic type information plus dynamic data.",
          "Explain typed nil, method sets, boxing, and dynamic dispatch.",
          "Predict common stack-versus-heap outcomes using lifetime and aliasing.",
          "Read compiler escape diagnostics without treating every escape as a bug.",
        ],
      },
      {
        type: "prose",
        title: "Mental model: two words with important distinctions",
        body: "Conceptually, an empty interface stores a pointer to concrete type metadata and a data word; a method-bearing interface additionally needs information linking the concrete type's method implementations to the interface. The exact runtime representation is internal. An interface is nil only when both dynamic type and dynamic value are absent. Putting a typed nil pointer into an interface supplies a dynamic type, so the interface itself is non-nil.",
      },
      {
        type: "code",
        title: "Typed nil is not a nil interface",
        language: "go",
        code: `type Problem struct{ Message string }

func (p *Problem) Error() string {
	if p == nil {
		return "<nil problem>"
	}
	return p.Message
}

var p *Problem = nil
var err error = p
fmt.Println(p == nil)   // true
fmt.Println(err == nil) // false: dynamic type is *Problem`,
      },
      {
        type: "prose",
        title: "Dispatch, boxing, and method sets",
        body: "Calling through an interface dispatches using the dynamic type's method implementation. The compiler may devirtualize when it can prove the concrete type, but open-ended interface calls can inhibit inlining. Converting a value to an interface is often called boxing; it may need storage for a copy of the concrete value, but it does not inevitably allocate on the heap. Context decides. Method sets also matter: methods with value receivers belong to T and *T, while pointer-receiver methods belong only to *T.",
      },
      {
        type: "code",
        title: "Stack and heap outcomes are about lifetime",
        language: "go",
        code: `type Point struct{ X, Y int }

func sum() int {
	p := Point{2, 3}
	return p.X + p.Y // p can stay in this stack frame
}

func newPoint() *Point {
	p := Point{2, 3}
	return &p // p must remain valid after this frame returns
}

var sink any
func publish() {
	p := Point{5, 8}
	sink = p // data stored in a global interface outlives publish
}`,
      },
      {
        type: "steps",
        title: "Worked escape reasoning",
        items: [
          "For sum, no reference to p survives the call. The compiler can place p in the frame or optimize it away.",
          "newPoint returns p's address. Go permits this safely because the compiler moves p's storage to the heap.",
          "publish stores p into a global interface. The boxed value is reachable after publish returns, so backing storage escapes.",
          "Passing &p to an inlined helper does not automatically escape: if analysis proves the helper retains nothing, p can remain local.",
          "Compiler decisions can change with inlining and release versions; the semantic result is fixed, but placement is not part of Go's API.",
        ],
      },
      {
        type: "code",
        title: "Inspect and validate allocation decisions",
        language: "go",
        code: `func writeLocal(w io.Writer) {
	buf := []byte("hello")
	_, _ = w.Write(buf)
}

// Diagnostics:
// go build -gcflags='all=-m=2' ./...
// go test -run='^$' -bench=. -benchmem
//
// Read why a value flows to heap, then measure allocs/op.`,
      },
      {
        type: "prose",
        title: "Stacks grow; addresses remain valid",
        body: "Goroutine stacks begin small and grow as needed. The runtime can move/copy stack contents and adjust known pointers, so taking a local address is safe regardless of whether that local ultimately lives on a stack or heap. Escape analysis is an optimization and correctness mechanism managed by the compiler—not a restriction programmers must manually satisfy as in languages with fixed stack lifetimes.",
      },
      {
        type: "callout",
        tone: "warn",
        body: "Do not rewrite clear APIs merely because a diagnostic says 'escapes to heap.' Heap allocation matters only when profiles or benchmarks show allocation rate, retention, or GC pressure is significant.",
      },
      {
        type: "prose",
        title: "Edge cases",
        body: "Returning a pointer does not always create a separately observable allocation if inlining lets the caller contain the value. A large local may be heap-placed even without an outward pointer because stack size is constrained. Interface equality compares dynamic types and then dynamic values; it panics when the dynamic value is not comparable, such as a slice. A type assertion with the comma-ok form avoids panic, while a one-result failed assertion panics.",
      },
    ],
    quiz: [
      {
        id: "iface-nil",
        prompt: "Why is an error interface holding (*Problem)(nil) non-nil?",
        options: ["Pointers cannot be nil", "Its dynamic type is present", "Error adds a hidden value", "The GC replaces nil"],
        answerIndex: 1,
        explanation: "A nil interface requires both type and data components to be absent.",
      },
      {
        id: "escape-return",
        prompt: "What generally forces local p to outlive its frame?",
        options: ["Reading p.X", "Returning &p", "Using a value receiver", "Comparing p"],
        answerIndex: 1,
        explanation: "The returned pointer remains usable by the caller, so p needs suitable long-lived storage.",
      },
      {
        id: "escape-interface",
        prompt: "Does converting a concrete value to an interface always heap-allocate?",
        options: ["Yes", "No; placement depends on data flow and lifetime", "Only on one P", "Only for pointer values"],
        answerIndex: 1,
        explanation: "Boxing needs a representation, but escape analysis can keep nonescaping storage local or optimize it away.",
      },
      {
        id: "iface-compare",
        prompt: "What happens when two interface values with dynamic slice values are compared?",
        options: ["false", "true when lengths match", "Runtime panic because slices are not comparable", "Compile-time error in every case"],
        answerIndex: 2,
        explanation: "Interface comparison reaches the dynamic value at runtime and panics if its dynamic type is uncomparable.",
      },
    ],
  },
  {
    slug: "sync-primitives",
    track: "internals",
    title: "Synchronization Primitives Deep Dive",
    subtitle: "Understand Mutex, RWMutex, Once, Pool, Cond, WaitGroup, and atomic through invariants and handoffs.",
    difficulty: "advanced",
    minutes: 60,
    tags: ["sync", "mutex", "atomic", "memory-model"],
    prerequisites: ["goroutines", "channels", "memory-model-happens-before"],
    blocks: [
      {
        type: "steps",
        title: "Learning goals",
        items: [
          "Protect an invariant with Mutex and know when RWMutex helps or hurts.",
          "Apply Once, Pool, Cond, and WaitGroup with their actual lifetime semantics.",
          "Use typed atomics for single-variable state without composing invalid multi-variable protocols.",
          "Recognize copying, reentrancy, starvation, and false-sharing pitfalls.",
        ],
      },
      {
        type: "prose",
        title: "Mutex mental model: ownership of an invariant",
        body: "sync.Mutex combines a fast path that attempts an atomic state transition with a runtime-assisted slow path that queues and parks contenders. Unlock makes a waiter eligible to run and establishes the memory ordering needed for protected data. The lock protects a logical invariant, not a line of code. Keep the invariant explicit, avoid I/O or callbacks while holding the lock, and use defer when it improves correctness without extending the critical section.",
      },
      {
        type: "code",
        title: "Protect related fields as one invariant",
        language: "go",
        code: `type Account struct {
	mu      sync.Mutex
	balance int64
	entries []int64
}

func (a *Account) Deposit(n int64) {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.balance += n
	a.entries = append(a.entries, n)
}

func (a *Account) Snapshot() (int64, []int64) {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.balance, slices.Clone(a.entries)
}`,
      },
      {
        type: "prose",
        title: "RWMutex and writer progress",
        body: "RWMutex permits multiple readers or one writer. Once a writer is waiting, new readers are blocked so a stream of readers does not starve it. That policy means recursive read locking is unsafe, and an RLock cannot be upgraded atomically to Lock. Reader bookkeeping and cache contention can make RWMutex slower than Mutex for tiny sections, modest contention, or frequent writes. Benchmark the real access pattern.",
      },
      {
        type: "code",
        title: "Once and atomic publication",
        language: "go",
        code: `var (
	loadOnce sync.Once
	cfg      *Config
	loadErr  error
)

func ConfigValue() (*Config, error) {
	loadOnce.Do(func() {
		cfg, loadErr = readConfig()
	})
	return cfg, loadErr
}

type Stats struct{ requests atomic.Uint64 }
func (s *Stats) MarkRequest() { s.requests.Add(1) }
func (s *Stats) Requests() uint64 { return s.requests.Load() }`,
      },
      {
        type: "steps",
        title: "Once, WaitGroup, and Pool semantics",
        items: [
          "Once.Do executes one function to completion; later calls return after that completion. If the function panics, the Once is still considered done.",
          "A WaitGroup is a task counter, not a reusable event. Add work before starting goroutines, each task calls Done, and Wait observes counter zero.",
          "A Pool is an opportunistic cache for temporary, interchangeable objects. Any item may disappear at a GC, so correctness cannot depend on retention.",
          "Pool.Get may return nil unless New is set. Reset objects before Put to prevent data retention or cross-request leakage.",
          "None of these types may be copied after first use.",
        ],
      },
      {
        type: "code",
        title: "Cond for a predicate over shared state",
        language: "go",
        code: `type Queue struct {
	mu    sync.Mutex
	ready *sync.Cond
	items []string
}

func NewQueue() *Queue {
	q := &Queue{}
	q.ready = sync.NewCond(&q.mu)
	return q
}

func (q *Queue) Pop() string {
	q.mu.Lock()
	defer q.mu.Unlock()
	for len(q.items) == 0 { // loop: wakeup means recheck, not guaranteed truth
		q.ready.Wait() // atomically unlocks, waits, then relocks
	}
	x := q.items[0]
	q.items = q.items[1:]
	return x
}`,
      },
      {
        type: "prose",
        title: "Signal, Broadcast, and atomic limits",
        body: "Cond.Signal wakes one waiter and Broadcast wakes all; the caller usually changes the predicate while holding the Cond's Locker first. Cond does not remember signals, so checking the predicate in a loop is essential. Atomics provide indivisible operations and memory ordering for one location, making them excellent for counters, immutable-pointer publication, and state machines designed as one word. Two atomic fields do not become one atomic invariant: a reader may observe a combination that never existed under a lock.",
      },
      {
        type: "callout",
        tone: "warn",
        body: "Go mutexes are not reentrant. Calling a method that takes the same lock while it is held deadlocks. Also never copy a struct containing Mutex, RWMutex, Once, Pool, Cond, WaitGroup, or atomic types after use; use pointer receivers and run go vet's copylocks check.",
      },
      {
        type: "tradeoff",
        title: "Choose by semantics",
        choices: [
          {
            label: "Mutex / RWMutex",
            pros: ["Protects multi-field invariants", "Straightforward ownership"],
            cons: ["Contention and deadlock risk", "RWMutex has reader bookkeeping"],
            when: "Shared mutable state must change atomically.",
          },
          {
            label: "Channels / Cond",
            pros: ["Channels transfer ownership", "Cond expresses repeated predicates"],
            cons: ["Channels may complicate state queries", "Cond is easy to misuse"],
            when: "Use channels for events/ownership; Cond when many goroutines wait on shared-state conditions.",
          },
          {
            label: "Atomics",
            pros: ["Very small fast path", "Good for counters and one-word publication"],
            cons: ["Protocols are hard to prove", "Cannot compose independent fields"],
            when: "The invariant genuinely fits one atomic state transition.",
          },
        ],
      },
      {
        type: "prose",
        title: "Edge cases",
        body: "TryLock is rarely a cure for lock-order problems and often turns blocking into unreliable retry loops. Unlocking an unlocked Mutex is a fatal error. A WaitGroup must not be reused until a prior Wait has returned. Atomic values must be naturally aligned; typed sync/atomic wrappers simplify this, especially on 32-bit targets. Heavy writes to independent atomics on the same cache line can still contend through false sharing.",
      },
    ],
    quiz: [
      {
        id: "sync-rw",
        prompt: "Why can RWMutex lose to Mutex in a read-heavy micro-critical section?",
        options: ["It serializes all readers", "Reader bookkeeping and cache contention can exceed the protected work", "It creates processes", "It disables inlining globally"],
        answerIndex: 1,
        explanation: "Shared reader state is not free; benchmark rather than selecting RWMutex from read percentage alone.",
      },
      {
        id: "sync-once",
        prompt: "What happens if a Once.Do function panics?",
        options: ["It automatically retries", "The Once is considered done", "The Once becomes copyable", "All goroutines ignore the panic"],
        answerIndex: 1,
        explanation: "Once records the call as complete even when f panics.",
      },
      {
        id: "sync-cond",
        prompt: "Why must Cond.Wait be inside a predicate loop?",
        options: ["Wait does not relock", "A wakeup only means recheck; another goroutine may consume the condition", "Signal stores ten events", "Loops make it atomic"],
        answerIndex: 1,
        explanation: "Wait returns holding the lock, but the shared predicate must be tested again.",
      },
      {
        id: "sync-pool",
        prompt: "Which use of sync.Pool is correct?",
        options: ["Durable session storage", "A cache whose entries must survive GC", "Reuse of discardable temporary buffers", "Cross-process locking"],
        answerIndex: 2,
        explanation: "Pool entries may disappear at any time and are only an allocation optimization.",
      },
      {
        id: "sync-atomic",
        prompt: "When are two atomic fields enough to protect a two-field invariant?",
        options: ["Always", "Only when the protocol proves acceptable observations or encodes state in one atomic transition", "When GOMAXPROCS=1", "When reads dominate"],
        answerIndex: 1,
        explanation: "Separate atomic operations can be interleaved; atomicity does not compose automatically.",
      },
    ],
  },
  {
    slug: "memory-model-happens-before",
    track: "internals",
    title: "The Go Memory Model and Happens-Before",
    subtitle: "Prove visibility and ordering with program order and synchronizing operations.",
    difficulty: "advanced",
    minutes: 55,
    tags: ["memory-model", "happens-before", "races", "atomic"],
    prerequisites: ["goroutines", "channels", "sync-primitives"],
    blocks: [
      {
        type: "steps",
        title: "Learning goals",
        items: [
          "Separate source-code order, compiler/CPU reordering, and observable synchronization.",
          "Build a happens-before proof using channels, mutexes, Once, and atomics.",
          "Explain why a data race invalidates intuitive visibility arguments.",
          "Use the race detector while understanding what it can and cannot prove.",
        ],
      },
      {
        type: "prose",
        title: "Mental model: visibility requires an ordering path",
        body: "Within one goroutine, operations behave according to the language's sequenced-before rules. Across goroutines, a read is guaranteed to observe a write only when synchronization creates a happens-before path (or when both use a valid atomic protocol). Compilers and CPUs may reorder implementation operations as long as a single goroutine cannot tell. Synchronizing operations constrain those freedoms and publish earlier writes to later readers.",
      },
      {
        type: "code",
        title: "A channel publication proof",
        language: "go",
        code: `var config map[string]string
ready := make(chan struct{})

go func() {
	config = map[string]string{"region": "eu"} // W
	close(ready)                              // C
}()

<-ready                                    // R
fmt.Println(config["region"])              // L

// W is sequenced before C.
// C synchronizes before R.
// R is sequenced before L.
// Therefore W happens before L.`,
      },
      {
        type: "steps",
        title: "Compose a happens-before chain",
        items: [
          "Start with sequenced-before edges inside each goroutine.",
          "Add a synchronizes-before edge: here, closing ready precedes the receive that observes closure.",
          "Use transitivity to join W → C → R → L.",
          "The map is not concurrently accessed: the reader cannot reach L until publication completes.",
          "If the writer mutates config again after close, that later mutation has no path to the reader and may race.",
        ],
      },
      {
        type: "code",
        title: "The tempting flag race",
        language: "go",
        code: `var (
	data  int
	ready bool
)

go func() {
	data = 42
	ready = true
}()

for !ready {}       // data race on ready; may never observe true
fmt.Println(data)    // no valid publication proof

// Replacing ready with atomic.Bool creates ordering for the
// preceding data write when used as a release/acquire publication.`,
      },
      {
        type: "prose",
        title: "Key synchronizing relationships",
        body: "Unlock on a Mutex synchronizes before a later successful Lock on that mutex. A channel send synchronizes before completion of the matching receive; channel close synchronizes before a receive that observes the closed state. Once's completed function synchronizes before later Do returns. Atomic operations participate in a single total order consistent with the program and can publish preceding writes when used correctly. WaitGroup coordinates task completion in supported usage, but it should not replace ownership of data that continues mutating.",
      },
      {
        type: "code",
        title: "Immutable snapshot publication",
        language: "go",
        code: `type Snapshot struct {
	Version int
	Names   []string // never mutate after Store
}

var current atomic.Pointer[Snapshot]

func Publish(v int, names []string) {
	next := &Snapshot{Version: v, Names: slices.Clone(names)}
	current.Store(next)
}

func Read() *Snapshot {
	return current.Load()
}`,
      },
      {
        type: "prose",
        title: "Race-free is sequentially consistent in the useful sense",
        body: "For ordinary Go programs with no data races, executions can be understood as interleavings that respect synchronization and goroutine order. Once a program has a race, outcomes are constrained more than arbitrary memory corruption but are not a portable basis for logic. 'It works on amd64' is not a proof: compiler optimization, architecture, timing, and small code edits can expose the missing edge.",
      },
      {
        type: "callout",
        tone: "warn",
        body: "An atomic flag does not make the object it points to safe for later mutation. Publish an immutable snapshot, or synchronize every subsequent read and write to mutable fields.",
      },
      {
        type: "prose",
        title: "Race detector and edge cases",
        body: "go test -race instruments memory accesses and reports conflicting operations observed in the tested execution. It is dynamic: an unexecuted race remains invisible, and timing changes under instrumentation. Expand tests, integration workloads, and realistic concurrency. A buffered channel's kth receive is related to a later send according to capacity rules, enabling bounded-semaphore patterns, but buffer capacity should not be hand-waved as a universal publication edge. Goroutine creation alone does not make later parent writes visible to the child.",
      },
    ],
    quiz: [
      {
        id: "mm-proof",
        prompt: "What turns two per-goroutine operation sequences into a visibility guarantee?",
        options: ["Similar variable names", "A transitive happens-before path through synchronization", "Running on one core", "A short sleep"],
        answerIndex: 1,
        explanation: "Program order plus a synchronizes-before edge composes transitively across goroutines.",
      },
      {
        id: "mm-close",
        prompt: "Which write is published by closing a channel?",
        options: ["Every future write", "Writes sequenced before close to a receiver that observes closure", "Only writes to the channel variable", "No writes"],
        answerIndex: 1,
        explanation: "The close/receive relationship orders earlier writes, not later unsynchronized mutation.",
      },
      {
        id: "mm-race",
        prompt: "Does go test -race prove a passing program is race-free?",
        options: ["Yes, statically", "No; it reports races exercised in that run", "Only on Windows", "Only when tests have no channels"],
        answerIndex: 1,
        explanation: "The race detector is dynamic and cannot observe paths or interleavings the workload never executes.",
      },
      {
        id: "mm-atomic",
        prompt: "After atomically publishing *Snapshot, when may readers access its slice without more locks?",
        options: ["When the snapshot is immutable after publication", "Whenever append is rare", "Only with GOMAXPROCS=1", "Never"],
        answerIndex: 0,
        explanation: "Safe publication plus immutability avoids concurrent writes to the shared object.",
      },
    ],
  },
  {
    slug: "profiling-pprof-trace",
    track: "internals",
    title: "Profiling with pprof and runtime/trace",
    subtitle: "Choose the right evidence, interpret samples, and turn runtime symptoms into tested fixes.",
    difficulty: "advanced",
    minutes: 55,
    tags: ["pprof", "trace", "performance", "diagnostics"],
    prerequisites: ["scheduler-gpm", "garbage-collector"],
    blocks: [
      {
        type: "steps",
        title: "Learning goals",
        items: [
          "Choose CPU, heap, allocs, goroutine, mutex, or block profiles for a hypothesis.",
          "Interpret flat versus cumulative costs and sampling limitations.",
          "Use execution traces for scheduler latency and causal timelines.",
          "Follow a baseline-change-verify loop instead of optimizing anecdotes.",
        ],
      },
      {
        type: "prose",
        title: "Mental model: profiles aggregate; traces preserve time",
        body: "A profile attributes sampled events or costs to call stacks over an interval. CPU profiles sample where execution time is spent; heap profiles sample allocation sites and can report currently retained bytes or total allocation churn; mutex and block profiles sample contention. An execution trace records timestamped runtime events such as goroutine transitions, processor activity, syscalls, network waits, GC, and user regions. Use profiles to answer 'where is cost concentrated?' and traces to answer 'what happened when, and why was this goroutine not running?'",
      },
      {
        type: "code",
        title: "Capture application profiles safely",
        language: "go",
        code: `import (
	"net/http"
	_ "net/http/pprof"
)

func startDiagnostics() {
	mux := http.NewServeMux()
	mux.Handle("/debug/pprof/", http.DefaultServeMux)
	srv := &http.Server{
		Addr:              "127.0.0.1:6060",
		Handler:           mux,
		ReadHeaderTimeout: 2 * time.Second,
	}
	go func() { _ = srv.ListenAndServe() }()
}

// Keep diagnostics private and authenticated in real deployments.`,
      },
      {
        type: "code",
        title: "Collection and inspection commands",
        language: "bash",
        code: `go tool pprof -http=:0 http://127.0.0.1:6060/debug/pprof/profile?seconds=30
go tool pprof -http=:0 http://127.0.0.1:6060/debug/pprof/heap
go tool pprof -sample_index=alloc_space app heap.pb.gz
go test -bench=. -benchmem -cpuprofile=cpu.out -memprofile=mem.out ./...`,
      },
      {
        type: "steps",
        title: "Worked CPU profile interpretation",
        items: [
          "Reproduce the slow workload and capture a profile long enough to include steady-state behavior.",
          "Start with top: flat cost is samples in the function itself; cumulative cost includes descendants.",
          "A wrapper with low flat but high cumulative cost is a path to expensive work, not necessarily the implementation to rewrite.",
          "Use list or source views to locate costly lines, and inspect flame graphs for broad call paths.",
          "Form one causal hypothesis, change one thing, and compare the same workload with confidence—not just a faster single run.",
        ],
      },
      {
        type: "code",
        title: "Add trace tasks and regions to business operations",
        language: "go",
        code: `func rebuild(ctx context.Context, ids []int) error {
	ctx, task := trace.NewTask(ctx, "rebuild-index")
	defer task.End()

	trace.WithRegion(ctx, "load", func() {
		loadRecords(ids)
	})
	return trace.WithRegion(ctx, "write", func() error {
		return writeIndex(ids)
	})
}

// Capture in a test with: go test -trace=trace.out
// Inspect with: go tool trace trace.out`,
      },
      {
        type: "prose",
        title: "Profile types and the question each answers",
        body: "CPU asks which stacks consume on-CPU samples. heap/inuse_space asks who retains live bytes; alloc_space asks who allocated bytes over time. goroutine snapshots reveal stacks and leak patterns. Mutex profiles attribute time waiting for contended mutexes, while block profiles cover channel sends/receives and other blocking points. Enable contention profiles deliberately because collection has overhead and sampling rates influence results. Labels can partition CPU/profile samples by request or tenant when cardinality is controlled.",
      },
      {
        type: "steps",
        title: "Trace a latency spike",
        items: [
          "Find the request's user task or region in the timeline.",
          "Separate running time from runnable-but-not-running time and synchronization/network/syscall blocking.",
          "Inspect P utilization: idle Ps plus blocked work suggests dependencies; saturated Ps plus runnable queues suggests CPU pressure.",
          "Correlate GC intervals and assist activity rather than blaming every pause on stop-the-world GC.",
          "Zoom into causal goroutine transitions, then validate the suspected hot code with the appropriate profile.",
        ],
      },
      {
        type: "callout",
        tone: "warn",
        body: "Exposing /debug/pprof publicly leaks stack traces, endpoints, and workload details and can enable expensive profile captures. Bind privately, protect access, and constrain collection in production.",
      },
      {
        type: "prose",
        title: "Edge cases and bias",
        body: "Sampling means small or rare functions may not appear. Inlining changes stack attribution. A heap profile is sampled and scaled, so tiny-object counts are estimates. CPU profiles do not directly measure off-CPU waiting. Trace files can become large and tracing adds overhead, so capture focused windows. Profile-guided optimization is workload-specific: test regressions in throughput, latency percentiles, allocations, and correctness before shipping.",
      },
    ],
    quiz: [
      {
        id: "prof-flat",
        prompt: "A function has low flat cost and high cumulative CPU cost. What does that mean?",
        options: ["It cannot matter", "Most samples occur in functions it calls", "It leaks memory", "It is blocked on a mutex"],
        answerIndex: 1,
        explanation: "Cumulative attribution includes descendant stacks; flat attribution is the function's own body.",
      },
      {
        id: "prof-heap",
        prompt: "Which view best investigates heavy temporary allocation churn?",
        options: ["inuse_space only", "alloc_space", "goroutine count", "threadcreate"],
        answerIndex: 1,
        explanation: "alloc_space attributes all sampled allocated bytes, including objects no longer live.",
      },
      {
        id: "prof-trace",
        prompt: "Which tool best explains a goroutine spending 40ms runnable before execution?",
        options: ["Heap profile", "Execution trace", "Coverage profile", "go doc"],
        answerIndex: 1,
        explanation: "Trace preserves scheduler states and timing, unlike aggregate CPU samples.",
      },
      {
        id: "prof-method",
        prompt: "What is the strongest optimization workflow?",
        options: ["Rewrite the largest function", "Measure, hypothesize, change one factor, and remeasure", "Raise GOMAXPROCS", "Force GC on every request"],
        answerIndex: 1,
        explanation: "Controlled before/after evidence links the change to the observed cost and catches regressions.",
      },
    ],
  },
];
