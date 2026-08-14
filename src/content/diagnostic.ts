export const diagnosticPillars = [
  "Runtime internals",
  "Concurrency",
  "Production Go",
  "Low-level design",
  "System design",
] as const;

export type DiagnosticPillar = (typeof diagnosticPillars)[number];

export type DiagnosticQuestion = {
  id: string;
  prompt: string;
  options: readonly [string, string, string, string];
  answerIndex: 0 | 1 | 2 | 3;
  explanation: string;
  pillar: DiagnosticPillar;
};

export const diagnosticQuestions: readonly DiagnosticQuestion[] = [
  {
    id: "gmp-blocking-syscall",
    prompt:
      "A goroutine enters a blocking syscall while its M owns a P. What can the Go runtime do to keep runnable Go code moving?",
    options: [
      "Keep the P attached until the syscall returns",
      "Detach the P and let another M run Go code with it",
      "Create another P beyond GOMAXPROCS",
      "Move the syscall onto the network poller in every case",
    ],
    answerIndex: 1,
    explanation:
      "The runtime can detach the P from an M blocked in a syscall and associate that P with another M. This preserves Go-code parallelism without increasing the number of Ps.",
    pillar: "Runtime internals",
  },
  {
    id: "gomaxprocs-meaning",
    prompt: "What does GOMAXPROCS primarily control?",
    options: [
      "The maximum number of goroutines in the process",
      "The hard limit on OS threads created by the runtime",
      "The number of Ps available to execute Go code in parallel",
      "The maximum number of concurrent system calls",
    ],
    answerIndex: 2,
    explanation:
      "GOMAXPROCS controls the number of logical processors (Ps), which bounds ordinary Go-code parallelism. Goroutine and OS-thread counts can both be higher.",
    pillar: "Runtime internals",
  },
  {
    id: "select-ready-cases",
    prompt:
      "Two communication cases in the same select are ready at the moment the select executes. Which behavior is safe to rely on?",
    options: [
      "The first source-order case always wins",
      "The least recently selected case wins",
      "One ready case is chosen without a source-order priority guarantee",
      "Both cases run before the select completes",
    ],
    answerIndex: 2,
    explanation:
      "When multiple cases can proceed, select chooses one using pseudo-random selection. Correctness must not depend on source order or a fairness schedule.",
    pillar: "Concurrency",
  },
  {
    id: "nil-channel-select",
    prompt: "What effect does a nil channel have when used in a select case?",
    options: [
      "The case is effectively disabled because it can never proceed",
      "The case runs immediately with the channel element's zero value",
      "The select panics",
      "The channel is allocated lazily on the first send",
    ],
    answerIndex: 0,
    explanation:
      "Sends and receives on a nil channel block forever. Inside select, that makes the case ineligible and is sometimes used intentionally to enable or disable cases.",
    pillar: "Concurrency",
  },
  {
    id: "escape-analysis-evidence",
    prompt:
      "A hot helper returns a pointer, and you suspect an unexpected heap allocation. What is the best first source of evidence?",
    options: [
      "Assume every returned pointer allocates on the heap",
      "Inspect compiler escape diagnostics with go build -gcflags=-m",
      "Increase GOGC so the allocation stays on the stack",
      "Replace every pointer with an interface",
    ],
    answerIndex: 1,
    explanation:
      "Escape analysis is compiler- and context-sensitive; pointer use alone does not prove a heap allocation. Compiler diagnostics show escape decisions, which you can then confirm with allocation benchmarks.",
    pillar: "Runtime internals",
  },
  {
    id: "context-cancel",
    prompt:
      "After calling context.WithTimeout, why should the returned CancelFunc normally be deferred even when the timeout is short?",
    options: [
      "It makes ctx.Done buffered",
      "It releases timer and child-context resources as soon as the operation finishes",
      "It prevents the parent context from being canceled",
      "It converts DeadlineExceeded into Canceled",
    ],
    answerIndex: 1,
    explanation:
      "Calling cancel releases resources associated with the derived context promptly. Waiting for the deadline can retain timers and references longer than necessary.",
    pillar: "Production Go",
  },
  {
    id: "cancellable-send",
    prompt:
      "A worker can block sending a result after its caller has canceled. Which send pattern gives the worker a termination path?",
    options: [
      "Close the result channel from every worker",
      "Use select with the result send and <-ctx.Done()",
      "Add a default case that retries in a tight loop",
      "Start another goroutine for every blocked send",
    ],
    answerIndex: 1,
    explanation:
      "Selecting between the send and ctx.Done lets the worker stop when the consumer leaves. Closing is usually the sender-owner's responsibility, and retries or extra goroutines can leak.",
    pillar: "Production Go",
  },
  {
    id: "typed-nil-interface",
    prompt:
      "A *bytes.Buffer variable is nil and is assigned to an io.Writer interface. What is true about the interface value?",
    options: [
      "It compares equal to nil because its pointer payload is nil",
      "It is non-nil because it contains a dynamic type and a nil dynamic value",
      "The assignment fails to compile",
      "The runtime replaces it with a zero bytes.Buffer",
    ],
    answerIndex: 1,
    explanation:
      "An interface is nil only when both its dynamic type and dynamic value are absent. A typed nil pointer stored in an interface gives it a dynamic type, so interface == nil is false.",
    pillar: "Production Go",
  },
  {
    id: "interface-placement",
    prompt:
      "Where is a small interface usually most useful in idiomatic Go service code?",
    options: [
      "Next to the consumer that needs the behavior",
      "Next to every concrete implementation",
      "In a shared package before any consumer exists",
      "Embedded into all domain structs",
    ],
    answerIndex: 0,
    explanation:
      "Consumer-defined interfaces describe only the behavior that consumer needs. This keeps contracts narrow and allows concrete producers to remain decoupled from speculative abstractions.",
    pillar: "Production Go",
  },
  {
    id: "map-concurrency",
    prompt:
      "One goroutine writes to a built-in map while another reads it, with no synchronization. Which assessment is correct?",
    options: [
      "It is safe if they use different keys",
      "It is safe when the map has spare capacity",
      "It is a data race and may also trigger a runtime failure",
      "Reads automatically observe a copy-on-write snapshot",
    ],
    answerIndex: 2,
    explanation:
      "Built-in maps do not support unsynchronized read/write access, even for different keys. Protect the invariant with synchronization or use an ownership design.",
    pillar: "Concurrency",
  },
  {
    id: "gc-allocation-rate",
    prompt:
      "Why can reducing short-lived allocations improve latency in a high-throughput Go service?",
    options: [
      "It disables write barriers for the whole process",
      "It reduces allocation and garbage-collection work",
      "It guarantees every remaining object is stack allocated",
      "It prevents goroutine preemption during collection",
    ],
    answerIndex: 1,
    explanation:
      "Fewer allocated bytes generally mean less allocator pressure and less GC work. The effect should still be measured because object lifetime, pointer density, and workload all matter.",
    pillar: "Runtime internals",
  },
  {
    id: "token-bucket-burst",
    prompt:
      "A token bucket refills at 100 tokens/second and has capacity 250. What traffic shape does it naturally allow?",
    options: [
      "Exactly 100 requests in every wall-clock second, never more",
      "A burst up to available capacity, then roughly the refill rate",
      "Unlimited bursts as long as the daily average is below 100/second",
      "Only one request at a time",
    ],
    answerIndex: 1,
    explanation:
      "Bucket capacity permits bounded bursts using saved tokens; the refill rate controls sustained throughput. Exact behavior also depends on initial tokens and token cost per request.",
    pillar: "Low-level design",
  },
  {
    id: "distributed-rate-limit",
    prompt:
      "Several API instances must enforce one exact shared quota. What core trade-off appears when choosing only in-memory limiters per instance?",
    options: [
      "They require global coordination but have perfect accuracy",
      "They are low-latency but cannot enforce an exact global total without coordination",
      "They cannot support token buckets",
      "They make the service unavailable whenever one instance fails",
    ],
    answerIndex: 1,
    explanation:
      "Local state is fast and resilient to a coordinator outage, but each instance sees only part of the traffic. Exact shared quotas require coordination or a centralized/partitioned authority, adding latency and failure modes.",
    pillar: "Low-level design",
  },
  {
    id: "cap-partition",
    prompt:
      "During a network partition, what choice does the CAP framing force a distributed data system to make for an affected operation?",
    options: [
      "Between consistency and availability",
      "Between durability and throughput",
      "Between SQL and NoSQL",
      "Between replication and sharding",
    ],
    answerIndex: 0,
    explanation:
      "When nodes cannot communicate, the system must either reject/delay some operations to preserve consistency or serve some responses that may not reflect the latest write.",
    pillar: "System design",
  },
  {
    id: "cache-stampede",
    prompt:
      "A popular cache entry expires and hundreds of requests recompute it at once. Which mitigation most directly addresses this cache stampede?",
    options: [
      "Use a smaller cache key",
      "Coordinate refresh with request coalescing or singleflight",
      "Disable all cache expiration",
      "Add more fields to the cached value",
    ],
    answerIndex: 1,
    explanation:
      "Request coalescing lets one caller refresh while others wait for or reuse that result. Expiry jitter, stale-while-revalidate, and proactive refresh can further reduce synchronized misses.",
    pillar: "System design",
  },
];
