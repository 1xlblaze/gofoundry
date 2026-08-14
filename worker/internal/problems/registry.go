package problems

type Problem struct {
	ID            string
	GoMod         string
	TestSuite     string
	MaxHeapAllocs int
}

var registry = map[string]Problem{
	"dsa-sliding-window-maximum": {
		ID: "dsa-sliding-window-maximum",
		GoMod: `module gofoundry/dsa-sliding-window-maximum

go 1.22

require go.uber.org/goleak v1.3.0
`,
		MaxHeapAllocs: 1,
		TestSuite: slidingWindowTestSuite,
	},
}

func Get(id string) (Problem, bool) {
	p, ok := registry[id]
	return p, ok
}

const slidingWindowTestSuite = `package dsa

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
`
