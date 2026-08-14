import type { PlatformProblem } from "@/lib/platform/types";

export const lldPlatformProblems: PlatformProblem[] = [
  {
    id: "lld-01-lru-cache",
    title: "Zero-Alloc In-Memory LRU Cache with Sharded Buckets",
    trackId: "lld",
    difficulty: "Staff / Hard",
    algorithmicSpecs: { timeComplexity: "O(1)", spaceComplexity: "O(Capacity)" },
    runtimeInvariants: { maxHeapAllocsPerRun: 0, allowedRaceConditions: 0, goroutineLeakThreshold: 0 },
    starterCode: `package lld

type ShardedLRU struct{}

func NewShardedLRU(shards, capPerShard int) *ShardedLRU { return &ShardedLRU{} }
func (c *ShardedLRU) Get(key string) (int, bool) { return 0, false }
func (c *ShardedLRU) Put(key string, val int) {}
`,
    solutionCode: `package lld\n// Reference solution`,
    testSuiteCode: `package lld

import "testing"

func TestShardedLRU_Basic(t *testing.T) {
\tc := NewShardedLRU(4, 64)
\tc.Put("a", 1)
\tif v, ok := c.Get("a"); !ok || v != 1 { t.Fatal("get failed") }
}`,
  },
  {
    id: "lld-02-rate-limiter",
    title: "Distributed-Ready Sliding Window Rate Limiter",
    trackId: "lld",
    difficulty: "Staff / Hard",
    algorithmicSpecs: { timeComplexity: "O(1)", spaceComplexity: "O(W)" },
    runtimeInvariants: { maxHeapAllocsPerRun: 0, allowedRaceConditions: 0 },
    starterCode: `package lld

type SlidingWindowLimiter struct{}

func NewSlidingWindowLimiter(limit int, windowMs int64) *SlidingWindowLimiter { return &SlidingWindowLimiter{} }
func (l *SlidingWindowLimiter) Allow(key string, nowMs int64) bool { return false }
`,
    solutionCode: `package lld\n// Reference solution`,
    testSuiteCode: `package lld

import "testing"

func TestSlidingWindowLimiter(t *testing.T) {
\tl := NewSlidingWindowLimiter(10, 1000)
\tif !l.Allow("user", 0) { t.Fatal("first should pass") }
}`,
  },
  {
    id: "lld-03-connection-pool",
    title: "Resilient Database Connection Pool with Health Checking",
    trackId: "lld",
    difficulty: "Staff / Hard",
    algorithmicSpecs: { timeComplexity: "O(1)", spaceComplexity: "O(MaxConns)" },
    runtimeInvariants: { maxHeapAllocsPerRun: 1, goroutineLeakThreshold: 0 },
    starterCode: `package lld

type ConnPool struct{}

func NewConnPool(max int) *ConnPool { return &ConnPool{} }
func (p *ConnPool) Acquire() (int, error) { return 0, nil }
func (p *ConnPool) Release(id int) {}
`,
    solutionCode: `package lld\n// Reference solution`,
    testSuiteCode: `package lld

import "testing"

func TestConnPool(t *testing.T) {
\tp := NewConnPool(4)
\tid, err := p.Acquire()
\tif err != nil || id < 0 { t.Fatal("acquire") }
\tp.Release(id)
}`,
  },
  {
    id: "lld-04-singleflight",
    title: "SingleFlight: Deduplicating Concurrent Expensive Queries",
    trackId: "lld",
    difficulty: "Staff / Hard",
    algorithmicSpecs: { timeComplexity: "O(1) amortized", spaceComplexity: "O(in-flight)" },
    runtimeInvariants: { maxHeapAllocsPerRun: 1, goroutineLeakThreshold: 0 },
    starterCode: `package lld

type Group struct{}

func (g *Group) Do(key string, fn func() (any, error)) (any, error) { return nil, nil }
`,
    solutionCode: `package lld\n// Reference solution`,
    testSuiteCode: `package lld

import "testing"

func TestSingleFlight(t *testing.T) {
\tvar g Group
\tv, err := g.Do("k", func() (any, error) { return 42, nil })
\tif err != nil || v.(int) != 42 { t.Fatal("do") }
}`,
  },
  {
    id: "lld-05-ring-logger",
    title: "Lock-Free Ring Buffer Logger with Batching Disk Flushers",
    trackId: "lld",
    difficulty: "Staff / Hard",
    algorithmicSpecs: { timeComplexity: "O(1)", spaceComplexity: "O(Buffer)" },
    runtimeInvariants: { maxHeapAllocsPerRun: 0, allowedRaceConditions: 0 },
    starterCode: `package lld

type RingLogger struct{}

func NewRingLogger(size int) *RingLogger { return &RingLogger{} }
func (l *RingLogger) Log(msg string) bool { return false }
`,
    solutionCode: `package lld\n// Reference solution`,
    testSuiteCode: `package lld

import "testing"

func TestRingLogger(t *testing.T) {
\tl := NewRingLogger(1024)
\tif !l.Log("hello") { t.Fatal("log") }
}`,
  },
];
