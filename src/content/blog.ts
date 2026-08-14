export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  readingMinutes: number;
  body: string;
};

export const blogPosts: BlogPost[] = [
  {
    slug: "why-go-maps-are-not-thread-safe",
    title: "Why Go Maps Are Not Thread-Safe (Under the Hood)",
    description:
      "Trace Go map lookups, bucket growth, and the runtime's concurrent-write guard, then choose between sync.Map and a mutex-protected map.",
    date: "2026-08-12",
    tags: ["Go internals", "Concurrency", "Maps"],
    readingMinutes: 8,
    body: `A Go map looks like a single value, but a mutation can touch a surprising amount of shared state. That mismatch is the reason “one goroutine reads while another only changes an unrelated key” is not a safe argument. The language specification deliberately does not promise atomic map operations or concurrent read/write safety. Multiple goroutines may read the same map when no goroutine is writing it. Once a write is possible, callers must establish synchronization.

The classic runtime implementation explains the danger well. In Go releases before the Swiss Table redesign, a map header was represented internally by runtime.hmap. The header tracked the element count, flags, a hash seed, the current bucket exponent, pointers to current and old bucket arrays, and progress through an incremental grow. User code held a small descriptor that led to this shared state; assigning a map did not copy all entries. Although current runtime details are version-dependent, the ownership lesson has not changed: operations coordinate through mutable metadata and shared storage.

In that classic design, each bucket held up to eight key/value slots plus compact “top hash” bytes used to reject nonmatching entries quickly. Hash bits selected a bucket, and the top hash narrowed the scan inside it. Collisions could add overflow buckets. A lookup therefore was not equivalent to reading one fixed address. It inspected bucket metadata, keys, and potentially an overflow chain. Go 1.24 introduced a Swiss Table-inspired implementation with groups and control words, so hmap-and-eight-slot-bucket diagrams describe the historical implementation rather than a forever-stable ABI. Neither design makes unsynchronized writes valid.

Insertion is more invasive. It hashes the key, searches for an existing slot, may allocate overflow storage, writes the key and value, updates the count, and can trigger growth. In the classic implementation, growth was incremental: the runtime allocated a larger bucket array and evacuated old buckets during later map operations. A single assignment could therefore participate in moving entries and updating grow state. A reader racing that process might follow old storage while a writer changes evacuation markers or publishes data in new storage. Protecting “different keys” does not protect the shared index structure.

Deletion and update have the same fundamental issue. A deletion changes occupancy metadata and clears key/value storage so the garbage collector no longer retains referenced objects. An update can replace a value while another goroutine reads it. Even when a machine naturally performs a word-sized store atomically, the Go memory model does not create a happens-before relationship from wishful thinking. The reader can observe stale state, and larger values may involve multiple writes. Memory safety and logical consistency require synchronization, not assumptions about the processor.

The runtime does contain a useful fail-fast check. Map write paths mark that a write is in progress; another conflicting operation may detect the state and terminate the process with messages such as “concurrent map writes” or “concurrent map read and map write.” This is a fatal runtime error, not a recoverable panic. More importantly, it is not a lock and not a complete race detector. The checks are intentionally lightweight, so a racy program is invalid even if it appears to work or never emits the fatal message. Run tests with go test -race to find many of these violations, then fix ownership rather than relying on detection.

The default fix is usually a normal map guarded by a mutex. Put the map and its lock in the same type, keep them private, and make every access go through methods. Use Lock for mutations and RLock for read-only operations if an RWMutex is justified. Do not return internal slices, pointers, or maps that allow callers to mutate protected state after unlocking. For compound logic such as “load, check, then insert,” hold one lock across the entire invariant; two individually locked methods can still create a check-then-act race.

A plain Mutex is often better than an RWMutex until measurements say otherwise. RWMutex can help when critical sections are read-heavy and long enough for concurrent readers to matter, but it adds bookkeeping and can suffer under write contention. Tiny map lookups may be faster behind a simple Mutex because the critical section is short. Sharding is another option for measured hotspots: hash keys across several independently locked maps. It reduces contention but complicates operations that need a global snapshot or transaction across shards.

sync.Map is a specialized concurrent map, not a universal faster map. It provides methods such as Load, Store, LoadOrStore, Swap, CompareAndSwap, and Delete, with documented memory-model guarantees between writes and reads that observe them. Internally it maintains structures optimized to let many reads avoid a lock while coordinating misses and updates. Its strongest use cases are entries written once and read many times, such as caches that only grow, or workloads where goroutines mostly operate on disjoint keys. It also avoids forcing callers to coordinate a separate lock for each basic operation.

The tradeoffs are real. sync.Map stores keys and values as any, so wrappers are needed to recover static type safety. Its Range is not a consistent snapshot, and cross-key invariants still need external coordination. A workload that repeatedly overwrites a small hot key set may perform worse than a mutex-protected typed map. Clear and newer atomic-style methods are useful, but they do not make multi-step business rules atomic. Choose sync.Map because the access pattern matches its contract and benchmarks support it, not because the type name says “sync.”

Another robust design is single-goroutine ownership. Other goroutines send commands over a channel, and the owner alone reads or writes the map. This can make ordering and complex state transitions explicit, especially in event loops. It also introduces queueing, cancellation, and shutdown concerns, so it is not automatically simpler or faster. The key is that channels transfer work or ownership; merely passing the map through a channel once does not stop two receivers from retaining aliases and racing later.

In an interview, connect the surface rule to the mechanism: maps are shared mutable hash-table structures; writes can modify metadata, storage, and growth state; the runtime’s fatal check is best-effort diagnosis rather than synchronization. Then make the engineering choice explicit. Start with an encapsulated map plus Mutex for typed data and compound invariants. Consider RWMutex or sharding only after measuring contention. Reach for sync.Map when reads dominate stable entries or goroutines use disjoint keys. That explanation demonstrates both runtime understanding and production judgment.`,
  },
  {
    slug: "kubernetes-go-channels",
    title: "How Kubernetes Leverages Go Channels",
    description:
      "Follow events from client-go informers into controller workqueues, and see how channels and contexts shape cancellation, backpressure, and shutdown.",
    date: "2026-08-09",
    tags: ["Kubernetes", "Go channels", "Controllers"],
    readingMinutes: 9,
    body: `Kubernetes controllers are a useful study in disciplined concurrency, but “Kubernetes is built from channels” is too simple. Controllers combine HTTP watches, caches, queues, locks, goroutines, channels, and contexts. Channels are most valuable at lifecycle boundaries: delivering notifications, waking workers, and signaling shutdown. The durable design idea is not to pipe every object through a raw channel. It is to separate observation from reconciliation and make repeated work safe.

Start with the control loop. A controller observes desired state from the API server, compares it with cached or external state, and takes action until the two converge. Events are hints that some key may need reconciliation; they are not a transaction log that a controller must process exactly once. Watches can close, events can be duplicated, and several changes can collapse into one queue entry. Therefore a reconcile function should be idempotent and should fetch the current object by namespace/name instead of trusting an old event payload.

In client-go, a SharedInformer usually begins with a list-and-watch source. A Reflector lists objects to establish a baseline and resource version, then watches for changes. If the watch expires or disconnects, it relists and resumes. The Reflector writes observed changes into a store-oriented queue such as a DeltaFIFO. That component can accumulate deltas for an object and coordinate initial population. A controller does not need to open one API watch per worker, which reduces load on the API server.

The informer consumes that queue, updates a local indexer cache, and distributes notifications to registered event handlers. SharedInformerFactory lets multiple controllers share informers and caches for the same resource type. Distribution uses internal concurrency machinery, including channels between parts of the shared processor, but handlers should still be quick. A handler normally computes a stable key and adds it to a workqueue. Performing network calls or a full reconciliation in the handler would delay notification delivery and tie event ingestion to slow business logic.

That key-only handoff is important. Suppose a Pod is updated five times before a worker runs. The controller usually needs the latest Pod, not five expensive reconciliations against obsolete versions. A client-go workqueue coalesces duplicate keys using internal dirty and processing state. Add marks a key dirty; Get gives a worker one item; Done reports completion. If the same key becomes dirty during processing, it can be queued again after Done. This gives “at least once until the latest state is handled” behavior without pretending every watch event is preserved.

A workqueue is not merely a public chan interface. Its implementation uses synchronization and signaling internally while exposing controller-specific semantics: deduplication, shutdown, queue length, and coordination between Add, Get, and Done. Typed workqueues improve key safety in current client-go APIs. Rate-limiting queues add AddRateLimited and Forget so controllers can apply delay after failures. Treating the abstraction as a raw channel loses the policies that make a controller stable under bursts and repeated errors.

The canonical worker loop reflects those semantics. A worker calls Get, exits when the queue reports shutdown, and guarantees Done for every retrieved item. It reconciles the key, calls Forget after success, and calls AddRateLimited after a retryable error. After a retry budget is exhausted, it can Forget the key and report the error to an operator-visible sink. Forget matters because rate limiters retain failure history. Omitting Done or Forget can leave queue state or backoff accounting incorrect.

Backpressure belongs in this discussion. Informer event handlers should enqueue quickly, while a fixed worker count bounds concurrent reconciliation. During a burst, queue depth grows instead of creating an unbounded goroutine per event. This protects downstream APIs and makes overload observable through queue metrics. Rate limiting controls retries, not just initial throughput: an immediate requeue loop during an outage can become a thundering herd. Production controllers often combine per-item exponential backoff with an overall token-bucket limiter.

Channels also appear in startup and shutdown APIs. Traditional client-go code passes a stop channel to Run and cache.WaitForCacheSync. Closing that channel broadcasts cancellation to all receivers because receives complete immediately after buffered values are drained. The owner should be the only closer; workers should observe the signal, not compete to send stop values. Closing is superior to sending N tokens because it naturally broadcasts to an unknown number of goroutines. Newer APIs increasingly use context.Context, but many established informer examples still expose stop channels.

Context cancellation carries the same broadcast concept with more structure. The process root creates a context canceled by SIGTERM or SIGINT. Controller Run methods derive child contexts, and reconciliation passes ctx into Kubernetes clients, HTTP requests, database calls, and blocking waits. Selecting on ctx.Done lets loops stop even when no work arrives. A context should normally be the first parameter, should not be stored indefinitely in a struct, and should not be replaced with context.Background deep in the call tree. Breaking propagation causes shutdown to hang behind work that can no longer be canceled.

Bridging queue shutdown and context shutdown requires an explicit plan because a worker blocked in Get may not be selecting directly on ctx.Done. The controller typically arranges for cancellation to call ShutDown or ShutDownWithDrain on the queue. That wakes blocked Get calls and prevents or limits further additions. Draining can be appropriate when in-flight work should finish before exit, but it must be bounded by the platform’s termination grace period. The ordering is usually: stop accepting new observations, signal queue shutdown, let workers finish according to policy, and wait for their goroutines.

Channels create their own failure modes when used without ownership rules. Sending on a closed channel panics, so the producer or lifecycle owner should close it. Closing an informer notification channel from a consumer is invalid. An unbuffered send can leak a goroutine forever if the receiver exits; cancellation-aware sends use select with a ctx.Done case. A default case can avoid blocking, but in a loop it may spin at full CPU or silently drop important work. Buffer size is a capacity decision, not a substitute for backpressure semantics.

For interview reasoning, draw the path as API server list/watch, Reflector, DeltaFIFO, indexer cache, event handler, keyed workqueue, worker, reconcile, and API write. Then annotate where cancellation enters and where retries return to the queue. Clarify that cache state can lag the API server and that events only prompt another convergence attempt. This avoids the common but inaccurate claim that a controller processes an ordered, exactly-once channel of objects.

The broader lesson is how Kubernetes constrains concurrency. Shared informers amortize watches and maintain local read models. Small handlers turn changes into stable keys. Workqueues coalesce duplicates and bound workers. Contexts and stop channels broadcast lifecycle transitions. Reconciliation remains idempotent because every delivery mechanism can reconnect, repeat, or collapse work. Channels are an enabling primitive, but the reliability comes from the protocol built around them.`,
  },
  {
    slug: "gmp-scheduler-visual-guide",
    title: "GMP Scheduler: A Visual Guide for Interviewers",
    description:
      "Build a precise mental model of goroutines, OS threads, processors, run queues, work stealing, syscalls, netpoll, and GOMAXPROCS.",
    date: "2026-08-05",
    tags: ["Go runtime", "Scheduler", "Interviews"],
    readingMinutes: 9,
    body: `The GMP model explains how Go runs huge numbers of goroutines on a smaller, changing set of operating-system threads. Draw three boxes before discussing any optimization. G is a goroutine: its stack, saved register state, and scheduling metadata. M is a machine: an OS thread executing runtime or Go code. P is a logical processor: the runtime resource that owns scheduling state and is required for an M to execute ordinary Go code. At a moment in time, an M with a P runs one G.

A useful visual is P0 with a local runnable queue, attached to M0, which currently executes G7. Other Gs wait in P0’s queue. P1 may be attached to M1 and execute another G at the same time. This is multiplexing: goroutines are not permanently bound to threads, and threads are not permanently bound to processors. The runtime moves runnable work and reassigns Ps as goroutines block, wake, enter syscalls, or finish.

GOMAXPROCS sets the maximum number of Ps available for executing Go code simultaneously. It does not set the number of goroutines, and it is not a hard cap on OS threads. With GOMAXPROCS equal to four, the runtime has four Ps and can normally execute four goroutines in parallel on four cores. It may still create additional Ms because some threads are blocked in syscalls, because runtime tasks need threads, or because a goroutine has locked itself to an OS thread. Recent Go versions can choose a container-aware default, but the conceptual role remains the number of Ps.

When code executes go f(), the runtime creates a runnable G and usually places it on a P’s local scheduling structures. Local queues preserve locality and reduce contention on a central lock. There is also a global runnable queue for work that cannot stay local and for fairness. The scheduler periodically checks global work rather than draining only its own queue forever. Exact queue sizes and check intervals are runtime implementation details, so use them to read source or traces, not as language guarantees.

Now draw P0 running out of local work while P1 still has a crowded queue. P0’s M searches other sources and may steal runnable goroutines from another P, typically taking a portion rather than one item. Work stealing balances uneven fan-out without routing every spawn through the global queue. The searching M also considers the global queue, timers, garbage-collector work, and the network poller. Randomized victim selection and limits on spinning threads reduce the chance that all idle workers contend for the same queue.

Work stealing answers an interview favorite: “If each P has a local queue, can one core remain idle while another is overloaded?” Not for long under normal conditions, because idle workers actively search. It does not guarantee perfectly even distribution. A goroutine can run a long computation, affinity can constrain work, and scheduler decisions cost time. The model targets throughput, latency, and locality together rather than mathematically equal queue lengths.

Blocking syscalls show why M and P are separate. Suppose G7 on M0 enters a syscall that may block in the kernel. The runtime can detach P0 from that M and hand P0 to another M so runnable Go work continues. M0 remains blocked with the syscall. When it returns, G7 becomes eligible to continue, but M0 may need to acquire an available P; otherwise the goroutine is made runnable and another scheduler path executes it. The runtime can retain or create enough threads to avoid letting blocked kernel calls consume all Go execution capacity.

Not every I/O operation needs a blocked thread. For pollable network descriptors, Go integrates with the operating system’s readiness mechanism through the runtime network poller. A goroutine waiting for network readiness is parked, meaning its G is not runnable and its M can run something else. When epoll, kqueue, IOCP, or another platform mechanism reports readiness, netpoll marks the relevant goroutine runnable and injects it back into scheduling. This is a major reason a server can manage many connections without one live OS thread per idle socket.

Parking is different from busy waiting. Channel receive, mutex contention, timers, and other runtime-aware operations can move a goroutine into a waiting state. Its stack and state remain represented by G, but it consumes no P while asleep. A wake-up makes it runnable; it still must wait in a queue before executing. This distinction helps explain why a program may have one hundred thousand goroutines but only a small number running at once.

Preemption prevents a runnable goroutine from monopolizing a P indefinitely. Historically, scheduling opportunities depended heavily on function calls and safe points. Modern Go includes asynchronous preemption, introduced in Go 1.14, so the runtime can interrupt many long-running goroutines at safe locations even when they do not make cooperative calls frequently. Preemption improves latency and garbage-collection progress, but it is not an arbitrary instruction-level guarantee. Tight loops, cgo, runtime critical sections, and platform details can still affect when a goroutine yields.

The runtime also maintains a special system-monitor goroutine, commonly called sysmon, that operates without a normal P. It watches timers, preemption needs, long syscalls, and network polling opportunities. If an M has held a P while blocked in a syscall beyond the runtime’s threshold, sysmon can help retake that P. This background role connects the diagrams: scheduling is not performed only by the M currently executing application code.

Fairness is practical rather than strict. Go does not promise that runnable goroutines execute in FIFO order, that channel peers wake in a contractual order, or that each goroutine receives an equal time slice. Local queues and locality mean two runnable goroutines can experience different delays. Code must synchronize based on channels, locks, atomics, and contexts, never on hoped-for scheduler ordering. Calling runtime.Gosched yields the processor voluntarily, but using it to repair correctness is almost always a design error.

When diagnosing scheduler behavior, move from the diagram to evidence. runtime.NumGoroutine offers only a count. Goroutine profiles reveal stacks and blocked states. go tool trace visualizes goroutine transitions, processor utilization, syscalls, network waits, and scheduler latency. CPU profiles show where running time goes, while block and mutex profiles expose waiting and contention. A high goroutine count may be expected fan-out or a leak; the states and creation stacks decide which.

A concise interview soundbite is: “G is the work, M is the OS execution thread, and P is the permission plus local scheduling context needed to run Go code.” Follow with: “GOMAXPROCS controls Ps, local queues improve locality, idle Ps steal work, blocking syscalls can release a P, and netpoll parks network waiters without tying up threads.” That is more accurate than saying Go simply maps N goroutines onto M threads, because P is what makes handoff and bounded parallelism intelligible.

Finish with one caveat that signals seniority: GMP is a runtime implementation model, not an API contract for program ordering. It is invaluable for explaining performance, thread growth, blocked syscalls, and traces. It should not leak into correctness assumptions. Design goroutines to block rather than spin, bound concurrency around scarce dependencies, propagate cancellation, and profile before tuning GOMAXPROCS. The best scheduler optimization is often giving the runtime clear, finite work with explicit lifecycle control.`,
  },
];

export function getBlogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}
