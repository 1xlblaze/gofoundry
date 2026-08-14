import type { PlatformProblem } from "@/lib/platform/types";

type DsaDef = {
  id: string;
  title: string;
  trackId: string;
  difficulty: string;
  funcName: string;
  signature: string;
  algorithmicSpecs: PlatformProblem["algorithmicSpecs"];
  testCases: string;
  benchSetup: string;
  benchCall: string;
  maxAllocs: number;
};

function makeStarter(def: DsaDef): string {
  return `package dsa

// ${def.title}
// Staff bar: ${def.algorithmicSpecs.timeComplexity} time, ${def.algorithmicSpecs.spaceComplexity} space
func ${def.funcName}${def.signature} {
\t// TODO: implement
\tpanic("not implemented")
}
`;
}

function makeTests(def: DsaDef): string {
  return `package dsa

import (
\t"testing"
\t"go.uber.org/goleak"
)

func Test${def.funcName}_Correctness(t *testing.T) {
\tdefer goleak.VerifyNone(t)
${def.testCases}
}

func Benchmark${def.funcName}_Staff(b *testing.B) {
${def.benchSetup}
\tb.ReportAllocs()
\tb.ResetTimer()
\tfor i := 0; i < b.N; i++ {
\t\t${def.benchCall}
\t}
}

func Test${def.funcName}_AllocBudget(t *testing.T) {
${def.benchSetup.replace(/\tb\./g, "\t")}
\tallocs := testing.AllocsPerRun(100, func() {
\t\t${def.benchCall}
\t})
\tif allocs > ${def.maxAllocs} {
\t\tt.Errorf("Staff violation: expected <= ${def.maxAllocs} allocs/run, got %.2f", allocs)
\t}
}
`;
}

function build(def: DsaDef): PlatformProblem {
  return {
    ...def,
    starterCode: makeStarter(def),
    solutionCode: `package dsa\n\n// Reference solution — implement in Temper stage\n`,
    testSuiteCode: makeTests(def),
    runtimeInvariants: {
      maxHeapAllocsPerRun: def.maxAllocs,
      allowedRaceConditions: 0,
      goroutineLeakThreshold: 0,
      enforceSliceCapacityReuse: def.maxAllocs === 0,
    },
  };
}

const definitions: DsaDef[] = [
  {
    id: "dsa-01-slice-headers",
    title: "Slice Headers, 3-Index Slicing, and Buffer Retention Prevention",
    trackId: "dsa",
    difficulty: "Staff / Hard",
    funcName: "CompactUnique",
    signature: "(nums []int) []int",
    algorithmicSpecs: { timeComplexity: "O(N)", spaceComplexity: "O(1) extra" },
    maxAllocs: 0,
    testCases: `\tnums := []int{1, 1, 2, 2, 3, 3, 4}
\tgot := CompactUnique(nums)
\tif len(got) != 4 { t.Fatalf("expected 4 unique, got %d", len(got)) }`,
    benchSetup: `\tnums := make([]int, 10000)
\tfor i := range nums { nums[i] = i % 100 }`,
    benchCall: `_ = CompactUnique(nums)`,
  },
  {
    id: "dsa-02-ring-buffer",
    title: "High-Performance Ring Buffer Using Contiguous Arrays",
    trackId: "dsa",
    difficulty: "Staff / Hard",
    funcName: "RingBufferPush",
    signature: "(buf []int, head, tail, cap, val int) (int, int)",
    algorithmicSpecs: { timeComplexity: "O(1)", spaceComplexity: "O(Capacity)" },
    maxAllocs: 0,
    testCases: `\tbuf := make([]int, 4)
\thead, tail := RingBufferPush(buf, 0, 0, 4, 42)
\tif buf[0] != 42 || tail != 1 { t.Fatal("push failed") }
\t_ = head`,
    benchSetup: `\tbuf := make([]int, 1024)
\thead, tail := 0, 0`,
    benchCall: `head, tail = RingBufferPush(buf, head, tail, 1024, i%256)`,
  },
  {
    id: "dsa-03-map-internals",
    title: "map Internals: Zero-Alloc Iteration Pattern",
    trackId: "dsa",
    difficulty: "Staff / Hard",
    funcName: "CountFreq",
    signature: "(words []string) map[string]int",
    algorithmicSpecs: { timeComplexity: "O(N)", spaceComplexity: "O(U)" },
    maxAllocs: 1,
    testCases: `\tm := CountFreq([]string{"go", "go", "rust"})
\tif m["go"] != 2 { t.Fatalf("expected 2, got %d", m["go"]) }`,
    benchSetup: `\twords := make([]string, 1000)
\tfor i := range words { words[i] = "token" }`,
    benchCall: `_ = CountFreq(words)`,
  },
  {
    id: "dsa-04-string-internals",
    title: "String Internals: UTF-8 Byte Processing Without Allocations",
    trackId: "dsa",
    difficulty: "Staff / Hard",
    funcName: "CountRunes",
    signature: "(s string) int",
    algorithmicSpecs: { timeComplexity: "O(N)", spaceComplexity: "O(1)" },
    maxAllocs: 0,
    testCases: `\tif CountRunes("hello") != 5 { t.Fatal("rune count") }
\tif CountRunes("🧿") != 1 { t.Fatal("emoji rune") }`,
    benchSetup: `\ts := "the quick brown fox jumps over the lazy dog"`,
    benchCall: `_ = CountRunes(s)`,
  },
  {
    id: "dsa-05-cache-locality",
    title: "Cache-Locality: Contiguous Flat Arrays vs Pointer Chasing",
    trackId: "dsa",
    difficulty: "Staff / Hard",
    funcName: "FlatSum",
    signature: "(flat []int, stride int) int64",
    algorithmicSpecs: { timeComplexity: "O(N)", spaceComplexity: "O(1)" },
    maxAllocs: 0,
    testCases: `\tflat := []int{1, 2, 3, 4}
\tif FlatSum(flat, 2) != 10 { t.Fatalf("sum mismatch") }`,
    benchSetup: `\tflat := make([]int, 10000)
\tfor i := range flat { flat[i] = i }`,
    benchCall: `_ = FlatSum(flat, 1)`,
  },
  {
    id: "dsa-06-generic-heap",
    title: "Generic Heaps: Type-Safe Priority Queue Without any Boxing",
    trackId: "dsa",
    difficulty: "Staff / Hard",
    funcName: "HeapPush",
    signature: "(h []int, x int) []int",
    algorithmicSpecs: { timeComplexity: "O(log N)", spaceComplexity: "O(N)" },
    maxAllocs: 1,
    testCases: `\th := HeapPush(nil, 3)
\th = HeapPush(h, 1)
\tif h[0] != 1 { t.Fatalf("min heap violated: %v", h) }`,
    benchSetup: `\th := make([]int, 0, 256)`,
    benchCall: `h = HeapPush(h, i%1000)`,
  },
  {
    id: "dsa-07-bitset-bloom",
    title: "Bitsets and Bloom Filters for Ultra-Low Memory Membership",
    trackId: "dsa",
    difficulty: "Staff / Hard",
    funcName: "BloomMaybeContains",
    signature: "(bits []uint64, hash uint64) bool",
    algorithmicSpecs: { timeComplexity: "O(1)", spaceComplexity: "O(1)" },
    maxAllocs: 0,
    testCases: `\tbits := make([]uint64, 1)
\tif BloomMaybeContains(bits, 42) { t.Fatal("empty bloom should miss") }`,
    benchSetup: `\tbits := make([]uint64, 16)`,
    benchCall: `_ = BloomMaybeContains(bits, uint64(i))`,
  },
  {
    id: "dsa-08-monotonic-deque",
    title: "Monotonic Deque for Sliding Window Extremes",
    trackId: "dsa",
    difficulty: "Staff / Hard",
    funcName: "MonotonicDequeMax",
    signature: "(nums []int, k int) []int",
    algorithmicSpecs: { timeComplexity: "O(N)", spaceComplexity: "O(K)" },
    maxAllocs: 1,
    testCases: `\tgot := MonotonicDequeMax([]int{1,3,-1,-3,5,3,6,7}, 3)
\tif len(got) != 5 { t.Fatalf("expected 5 windows, got %d", len(got)) }`,
    benchSetup: `\tnums := make([]int, 100000)
\tfor i := range nums { nums[i] = i % 1000 }
\tk := 50`,
    benchCall: `_ = MonotonicDequeMax(nums, k)`,
  },
  {
    id: "dsa-09-treap",
    title: "Treap: Randomized BST with O(log N) Expected Operations",
    trackId: "dsa",
    difficulty: "Staff / Hard",
    funcName: "TreapInsert",
    signature: "(root *TreapNode, key int) *TreapNode",
    algorithmicSpecs: { timeComplexity: "O(log N) expected", spaceComplexity: "O(N)" },
    maxAllocs: 1,
    testCases: `\troot := TreapInsert(nil, 5)
\troot = TreapInsert(root, 3)
\tif root == nil { t.Fatal("nil root") }`,
    benchSetup: `\tvar root *TreapNode`,
    benchCall: `root = TreapInsert(root, i%10000)`,
  },
  {
    id: "dsa-10-radix-tree",
    title: "Radix Tree for Prefix Compression",
    trackId: "dsa",
    difficulty: "Staff / Hard",
    funcName: "RadixInsert",
    signature: "(root *RadixNode, key string) *RadixNode",
    algorithmicSpecs: { timeComplexity: "O(L)", spaceComplexity: "O(N*L)" },
    maxAllocs: 1,
    testCases: `\troot := RadixInsert(nil, "go")
\troot = RadixInsert(root, "gopher")
\tif root == nil { t.Fatal("nil root") }`,
    benchSetup: `\tvar root *RadixNode
\tkeys := []string{"api", "app", "apple", "apt"}`,
    benchCall: `root = RadixInsert(root, keys[i%4])`,
  },
  {
    id: "dsa-11-skip-list",
    title: "Skip List: Probabilistic Ordered Structure",
    trackId: "dsa",
    difficulty: "Staff / Hard",
    funcName: "SkipListSearch",
    signature: "(head *SkipNode, target int) bool",
    algorithmicSpecs: { timeComplexity: "O(log N) expected", spaceComplexity: "O(N)" },
    maxAllocs: 0,
    testCases: `\tif SkipListSearch(nil, 1) { t.Fatal("empty list") }`,
    benchSetup: `\tvar head *SkipNode`,
    benchCall: `_ = SkipListSearch(head, i%1000)`,
  },
  {
    id: "dsa-12-graph-bfs",
    title: "Graph BFS with Pre-Allocated Queue Slice",
    trackId: "dsa",
    difficulty: "Staff / Hard",
    funcName: "BFSLevels",
    signature: "(adj [][]int, start int) [][]int",
    algorithmicSpecs: { timeComplexity: "O(V+E)", spaceComplexity: "O(V)" },
    maxAllocs: 2,
    testCases: `\tadj := [][]int{{1,2},{2},{}}
\tlevels := BFSLevels(adj, 0)
\tif len(levels) != 2 { t.Fatalf("expected 2 levels, got %d", len(levels)) }`,
    benchSetup: `\tadj := [][]int{{1},{2},{3},{4},{}}`,
    benchCall: `_ = BFSLevels(adj, 0)`,
  },
  {
    id: "dsa-13-graph-dfs",
    title: "Graph DFS with Iterative Stack Reuse",
    trackId: "dsa",
    difficulty: "Staff / Hard",
    funcName: "DFSOrder",
    signature: "(adj [][]int, start int) []int",
    algorithmicSpecs: { timeComplexity: "O(V+E)", spaceComplexity: "O(V)" },
    maxAllocs: 1,
    testCases: `\tadj := [][]int{{1},{2},{}}
\torder := DFSOrder(adj, 0)
\tif len(order) != 3 { t.Fatalf("expected 3 nodes, got %d", len(order)) }`,
    benchSetup: `\tadj := [][]int{{1},{2},{3},{4},{}}`,
    benchCall: `_ = DFSOrder(adj, 0)`,
  },
  {
    id: "dsa-14-union-find",
    title: "Union-Find with Path Compression and Union by Rank",
    trackId: "dsa",
    difficulty: "Staff / Hard",
    funcName: "UnionFindConnected",
    signature: "(parent []int, rank []int, a, b int) bool",
    algorithmicSpecs: { timeComplexity: "O(α(N))", spaceComplexity: "O(N)" },
    maxAllocs: 0,
    testCases: `\tparent := []int{0,1,2}
\trank := []int{0,0,0}
\tif UnionFindConnected(parent, rank, 0, 1) { t.Fatal("not connected yet") }
\t_ = parent`,
    benchSetup: `\tparent := make([]int, 1000)
\trank := make([]int, 1000)
\tfor i := range parent { parent[i] = i }`,
    benchCall: `_ = UnionFindConnected(parent, rank, i%999, (i+1)%999)`,
  },
  {
    id: "dsa-15-topological-sort",
    title: "Topological Sort with Kahn's Algorithm",
    trackId: "dsa",
    difficulty: "Staff / Hard",
    funcName: "TopoSort",
    signature: "(n int, edges [][2]int) ([]int, bool)",
    algorithmicSpecs: { timeComplexity: "O(V+E)", spaceComplexity: "O(V)" },
    maxAllocs: 2,
    testCases: `\torder, ok := TopoSort(3, [][2]int{{0,1},{1,2}})
\tif !ok || len(order) != 3 { t.Fatalf("topo failed: %v %v", order, ok) }`,
    benchSetup: `\tedges := [][2]int{{0,1},{1,2},{2,3},{3,4}}`,
    benchCall: `_, _ = TopoSort(5, edges)`,
  },
  {
    id: "dsa-16-dijkstra",
    title: "Dijkstra with Binary Heap and Slice Pool",
    trackId: "dsa",
    difficulty: "Staff / Hard",
    funcName: "Dijkstra",
    signature: "(adj [][] [2]int, start int) []int",
    algorithmicSpecs: { timeComplexity: "O((V+E) log V)", spaceComplexity: "O(V)" },
    maxAllocs: 2,
    testCases: `\tdist := Dijkstra([][] [2]int{{{1,1}},{}}, 0)
\tif len(dist) != 2 { t.Fatalf("expected 2 distances") }`,
    benchSetup: `\tadj := [][] [2]int{{{1,1},{2,4}},{{2,2}},{{3,1}},{}}`,
    benchCall: `_ = Dijkstra(adj, 0)`,
  },
  {
    id: "dsa-17-lru-cache",
    title: "In-Memory LRU with O(1) Get/Put",
    trackId: "dsa",
    difficulty: "Staff / Hard",
    funcName: "LRUGet",
    signature: "(cache *LRUCache, key int) (int, bool)",
    algorithmicSpecs: { timeComplexity: "O(1)", spaceComplexity: "O(Capacity)" },
    maxAllocs: 0,
    testCases: `\tc := NewLRU(2)
\tc.Put(1, 10)
\tv, ok := LRUGet(c, 1)
\tif !ok || v != 10 { t.Fatal("lru get") }`,
    benchSetup: `\tc := NewLRU(128)
\tfor j := 0; j < 128; j++ { c.Put(j, j) }`,
    benchCall: `_, _ = LRUGet(c, i%128)`,
  },
  {
    id: "dsa-18-rate-limiter",
    title: "Token Bucket Rate Limiter",
    trackId: "dsa",
    difficulty: "Staff / Hard",
    funcName: "TokenBucketAllow",
    signature: "(bucket *TokenBucket) bool",
    algorithmicSpecs: { timeComplexity: "O(1)", spaceComplexity: "O(1)" },
    maxAllocs: 0,
    testCases: `\tb := NewTokenBucket(10, 10)
\tif !TokenBucketAllow(b) { t.Fatal("should allow first") }`,
    benchSetup: `\tb := NewTokenBucket(1000, 1000)`,
    benchCall: `_ = TokenBucketAllow(b)`,
  },
  {
    id: "dsa-19-work-queue",
    title: "Bounded Worker Pool with Graceful Drain",
    trackId: "dsa",
    difficulty: "Staff / Hard",
    funcName: "ProcessBatch",
    signature: "(jobs []int, workers int) int",
    algorithmicSpecs: { timeComplexity: "O(N)", spaceComplexity: "O(workers)" },
    maxAllocs: 1,
    testCases: `\tjobs := []int{1,2,3,4}
\tif ProcessBatch(jobs, 2) != 10 { t.Fatal("sum mismatch") }`,
    benchSetup: `\tjobs := make([]int, 1000)
\tfor j := range jobs { jobs[j] = 1 }`,
    benchCall: `_ = ProcessBatch(jobs, 4)`,
  },
  {
    id: "dsa-sliding-window-maximum",
    title: "Monotonic Queue Maximum with Zero-Allocation Slice Reuse",
    trackId: "dsa",
    difficulty: "Staff / Hard",
    funcName: "SlidingWindowMax",
    signature: "(nums []int, k int) []int",
    algorithmicSpecs: { timeComplexity: "O(N)", spaceComplexity: "O(K)" },
    maxAllocs: 1,
    testCases: `\tgot := SlidingWindowMax([]int{1,3,-1,-3,5,3,6,7}, 3)
\tif len(got) != 5 { t.Fatalf("expected 5, got %d", len(got)) }`,
    benchSetup: `\tnums := make([]int, 100000)
\tfor j := range nums { nums[j] = j % 1000 }
\tk := 50`,
    benchCall: `_ = SlidingWindowMax(nums, k)`,
  },
];

export const dsaPlatformProblems: PlatformProblem[] = definitions.map(build);

// Supporting types referenced in stubs
export const dsaSupportTypes = `
type TreapNode struct { Key, Priority int; Left, Right *TreapNode }
type RadixNode struct { Prefix string; Children map[byte]*RadixNode; Terminal bool }
type SkipNode struct { Key int; Forward []*SkipNode }
type LRUCache struct { cap int; data map[int]*lruEntry }
type lruEntry struct { key, val int; prev, next *lruEntry }
type TokenBucket struct { tokens float64; rate, capacity float64; last int64 }
func NewLRU(cap int) *LRUCache { return &LRUCache{cap: cap, data: map[int]*lruEntry{}} }
func (c *LRUCache) Put(key, val int) {}
func NewTokenBucket(rate, cap int) *TokenBucket { return &TokenBucket{tokens: float64(cap), rate: float64(rate), capacity: float64(cap)} }
`;
