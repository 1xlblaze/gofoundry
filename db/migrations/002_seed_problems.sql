-- Seed platform problems into PostgreSQL
INSERT INTO problems (id, title, track_id, difficulty, algorithmic_specs, runtime_invariants, starter_code, solution_code, test_suite_code)
VALUES (
  'dsa-sliding-window-maximum',
  'Monotonic Queue Maximum with Zero-Allocation Slice Reuse',
  'dsa',
  'Staff / Hard',
  '{"timeComplexity": "O(N)", "spaceComplexity": "O(K)"}',
  '{"maxHeapAllocsPerRun": 1, "allowedRaceConditions": 0, "goroutineLeakThreshold": 0, "enforceSliceCapacityReuse": true}',
  E'package dsa\n\nfunc SlidingWindowMax(nums []int, k int) []int {\n\treturn nil\n}',
  E'package dsa\n\n// Reference solution in src/content/platform-problems.ts',
  E'package dsa\n\nimport "testing"\n\nfunc TestSlidingWindowMax_Correctness(t *testing.T) {}'
)
ON CONFLICT (id) DO NOTHING;
