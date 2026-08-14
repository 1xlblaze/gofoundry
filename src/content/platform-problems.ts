import type { PlatformProblem } from "@/lib/platform/types";

const slidingWindowStarter = `package dsa

// SlidingWindowMax returns the maximum value in each sliding window of size k.
// Staff bar: O(N) time, O(K) space, <= 1 heap allocation per call (result slice).
func SlidingWindowMax(nums []int, k int) []int {
\tif len(nums) == 0 || k <= 0 {
\t\treturn nil
\t}
\t// TODO: implement with monotonic deque and slice reuse
\tresult := make([]int, 0, len(nums)-k+1)
\t_ = result
\treturn nil
}
`;

const slidingWindowSolution = `package dsa

func SlidingWindowMax(nums []int, k int) []int {
\tif len(nums) == 0 || k <= 0 {
\t\treturn nil
\t}
\tif k == 1 {
\t\tout := make([]int, len(nums))
\t\tcopy(out, nums)
\t\treturn out
\t}

\tdeque := make([]int, 0, k)
\tresult := make([]int, 0, len(nums)-k+1)

\tpush := func(idx int) {
\t\tfor len(deque) > 0 && nums[deque[len(deque)-1]] <= nums[idx] {
\t\t\tdeque = deque[:len(deque)-1]
\t\t}
\t\tdeque = append(deque, idx)
\t}

\tfor i := 0; i < len(nums); i++ {
\t\tpush(i)
\t\tif deque[0] <= i-k {
\t\t\tdeque = deque[1:]
\t\t}
\t\tif i >= k-1 {
\t\t\tresult = append(result, nums[deque[0]])
\t\t}
\t}
\treturn result
}
`;

const slidingWindowTests = `package dsa

import (
	"slices"
	"testing"

	"go.uber.org/goleak"
)

func TestSlidingWindowMax_Correctness(t *testing.T) {
	defer goleak.VerifyNone(t)

	tests := []struct {
		name     string
		nums     []int
		k        int
		expected []int
	}{
		{"Standard Case", []int{1, 3, -1, -3, 5, 3, 6, 7}, 3, []int{3, 3, 5, 5, 6, 7}},
		{"K equals 1", []int{4, 2, 8}, 1, []int{4, 2, 8}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := SlidingWindowMax(tt.nums, tt.k)
			if !slices.Equal(result, tt.expected) {
				t.Fatalf("expected %v, got %v", tt.expected, result)
			}
		})
	}
}

func BenchmarkSlidingWindowMax_ZeroAlloc(b *testing.B) {
	nums := make([]int, 100_000)
	for i := range nums {
		nums[i] = i % 1000
	}
	k := 50

	b.ReportAllocs()
	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		_ = SlidingWindowMax(nums, k)
	}
}

func TestSlidingWindowMax_StrictZeroAlloc(t *testing.T) {
	nums := []int{1, 3, -1, -3, 5, 3, 6, 7}
	k := 3

	allocs := testing.AllocsPerRun(100, func() {
		_ = SlidingWindowMax(nums, k)
	})

	if allocs > 1 {
		t.Errorf("Staff Violation: Expected <= 1 allocation, got %.2f allocs/run", allocs)
	}
}
`;

export const platformProblems: PlatformProblem[] = [
  {
    id: "dsa-sliding-window-maximum",
    title: "Monotonic Queue Maximum with Zero-Allocation Slice Reuse",
    trackId: "dsa",
    difficulty: "Staff / Hard",
    algorithmicSpecs: {
      timeComplexity: "O(N)",
      spaceComplexity: "O(K)",
    },
    runtimeInvariants: {
      maxHeapAllocsPerRun: 1,
      allowedRaceConditions: 0,
      goroutineLeakThreshold: 0,
      enforceSliceCapacityReuse: true,
    },
    starterCode: slidingWindowStarter,
    solutionCode: slidingWindowSolution,
    testSuiteCode: slidingWindowTests,
  },
  {
    id: "lld-sharded-lru-cache",
    title: "Zero-Alloc In-Memory LRU Cache with Sharded Buckets",
    trackId: "lld",
    difficulty: "Staff / Hard",
    algorithmicSpecs: {
      timeComplexity: "O(1) amortized",
      spaceComplexity: "O(Capacity)",
    },
    runtimeInvariants: {
      maxHeapAllocsPerRun: 0,
      allowedRaceConditions: 0,
      goroutineLeakThreshold: 0,
    },
    starterCode: `package lld

type Cache struct {
\t// TODO: sharded buckets + sync.RWMutex per shard
}

func New(capacity int) *Cache {
\treturn &Cache{}
}

func (c *Cache) Get(key string) (int, bool) {
\treturn 0, false
}

func (c *Cache) Put(key string, value int) {}
`,
    solutionCode: `package lld

// Reference solution omitted from starter — implement in Temper stage.
`,
    testSuiteCode: `package lld_test

import "testing"

func TestCache_Basic(t *testing.T) {
\tc := New(2)
\tc.Put("a", 1)
\tif v, ok := c.Get("a"); !ok || v != 1 {
\t\tt.Fatalf("expected 1, got %d ok=%v", v, ok)
\t}
}
`,
  },
];

const byId = new Map(platformProblems.map((p) => [p.id, p]));

export function getPlatformProblem(id: string): PlatformProblem | undefined {
  return byId.get(id);
}

export function listPlatformProblems(): PlatformProblem[] {
  return platformProblems;
}
