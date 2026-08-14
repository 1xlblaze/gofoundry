(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,28499,e=>{"use strict";let t=[{id:"dsa",title:"Data Structures & Algorithms",short:"DSA",description:"Arrays to DP — interview-ready patterns implemented idiomatic Go.",accent:"var(--accent-dsa)"},{id:"concepts",title:"Go Concepts",short:"Concepts",description:"Interfaces, concurrency, context, errors, generics, and performance habits.",accent:"var(--accent-concepts)"},{id:"internals",title:"Runtime Internals",short:"Internals",description:"Scheduler, GC, maps, channels, escape analysis, and sync primitives.",accent:"var(--accent-internals)"},{id:"lld",title:"Low-Level Design",short:"LLD",description:"SOLID, patterns, and component designs: cache, limiter, shortener, and more.",accent:"var(--accent-lld)"},{id:"hld",title:"High-Level Design",short:"HLD",description:"Distributed systems foundations and full case studies you can defend in interviews.",accent:"var(--accent-hld)"}],n=[{slug:"arrays-and-slices",track:"dsa",title:"Arrays & Slices",subtitle:"Contiguous memory, capacity growth, and idiomatic Go slice patterns.",difficulty:"beginner",minutes:25,tags:["arrays","slices","two-pointers"],blocks:[{type:"prose",title:"Mental model",body:"In Go, an array is a fixed-length value type. A slice is a descriptor over an underlying array: pointer, length, and capacity. Almost all day-to-day work uses slices. Understanding how append reallocates is the difference between O(1) amortized growth and accidental quadratic copies."},{type:"code",title:"Slice descriptor vs underlying array",language:"go",code:`package main

import "fmt"

func main() {
	a := [5]int{10, 20, 30, 40, 50}
	s := a[1:4] // len=3, cap=4 (from index 1 to end of array)

	fmt.Println(s, len(s), cap(s)) // [20 30 40] 3 4
	s[0] = 99
	fmt.Println(a) // [10 99 30 40 50] — shared backing array
}`},{type:"prose",title:"Two-pointer patterns",body:"Many array problems become clean with left/right indices: reverse in place, pair-sum on a sorted slice, partition around a pivot, or remove duplicates in O(1) extra space."},{type:"code",title:"In-place reverse + remove duplicates",language:"go",code:`func reverse(nums []int) {
	l, r := 0, len(nums)-1
	for l < r {
		nums[l], nums[r] = nums[r], nums[l]
		l++
		r--
	}
}

// Remove duplicates from a sorted slice; returns new length.
func uniqueSorted(nums []int) int {
	if len(nums) == 0 {
		return 0
	}
	w := 1
	for r := 1; r < len(nums); r++ {
		if nums[r] != nums[w-1] {
			nums[w] = nums[r]
			w++
		}
	}
	return w
}`},{type:"complexity",time:"O(n) for linear scans / two-pointers",space:"O(1) extra when mutating in place; O(n) if you copy",notes:"append may allocate; pre-size with make([]T, 0, n) when you know the bound."},{type:"callout",tone:"warn",body:"Slicing does not copy. Passing s[i:j] to a function that mutates elements will mutate the caller's backing array unless you copy first."},{type:"steps",title:"Practice set",items:["Two Sum II (sorted input) with two pointers","Move Zeroes in place","Rotate Array with reverse-reverse trick","Product of Array Except Self without division"]}],quiz:[{id:"arr1",prompt:"What does a Go slice store?",options:["Only a pointer to the first element","Pointer, length, and capacity","A deep copy of the underlying array","Length only; capacity is computed at runtime"],answerIndex:1,explanation:"A slice header is {ptr, len, cap}. The elements live in a separate backing array."},{id:"arr2",prompt:"Why can repeated append be amortized O(1) per element?",options:["Go preallocates infinite capacity","Capacity grows geometrically, so total copies across n appends are O(n)","append never copies","The garbage collector removes old arrays instantly"],answerIndex:1,explanation:"Geometric growth means each element is copied a constant number of times on average."}]},{slug:"strings-and-runes",track:"dsa",title:"Strings & Runes",subtitle:"UTF-8 bytes vs runes, sliding windows, and frequency maps.",difficulty:"beginner",minutes:22,tags:["strings","utf-8","hashmap"],blocks:[{type:"prose",title:"Bytes are not characters",body:"A Go string is an immutable sequence of bytes, usually UTF-8. Indexing s[i] yields a byte. Ranging with for _, r := range s yields runes (code points). For DSA interviews, clarify whether the alphabet is ASCII; that unlocks O(1) arrays of size 26/128/256."},{type:"code",title:"Anagram check + longest substring without repeating chars",language:"go",code:`func isAnagram(a, b string) bool {
	if len(a) != len(b) {
		return false
	}
	var freq [26]int
	for i := 0; i < len(a); i++ {
		freq[a[i]-'a']++
		freq[b[i]-'a']--
	}
	for _, v := range freq {
		if v != 0 {
			return false
		}
	}
	return true
}

func lengthOfLongestSubstring(s string) int {
	last := make(map[byte]int)
	best, left := 0, 0
	for right := 0; right < len(s); right++ {
		c := s[right]
		if i, ok := last[c]; ok && i >= left {
			left = i + 1
		}
		last[c] = right
		if right-left+1 > best {
			best = right - left + 1
		}
	}
	return best
}`},{type:"complexity",time:"O(n) for sliding window / frequency scans",space:"O(k) where k is alphabet size (or distinct chars)"},{type:"callout",tone:"tip",body:"Prefer []byte(s) when you need mutation, then string(buf). Avoid concatenating strings in a loop — use strings.Builder."}],quiz:[{id:"str1",prompt:"What does s[i] return for a string s?",options:["A rune","A byte","A string of length 1","A UTF-8 grapheme cluster"],answerIndex:1,explanation:"Indexing returns a byte. Use range or utf8.DecodeRuneInString for runes."}]},{slug:"linked-lists",track:"dsa",title:"Linked Lists",subtitle:"Dummy heads, fast/slow pointers, reversal, and cycle detection.",difficulty:"beginner",minutes:28,tags:["linked-list","pointers"],blocks:[{type:"prose",title:"When lists win",body:"Linked lists shine for O(1) insert/delete given a node reference and for interview mechanics (pointer rewiring). In Go production code, slices usually win on cache locality — but list problems train pointer fluency you need for trees and graphs."},{type:"code",title:"Reverse list + detect cycle (Floyd)",language:"go",code:`type ListNode struct {
	Val  int
	Next *ListNode
}

func reverseList(head *ListNode) *ListNode {
	var prev *ListNode
	cur := head
	for cur != nil {
		next := cur.Next
		cur.Next = prev
		prev = cur
		cur = next
	}
	return prev
}

func hasCycle(head *ListNode) bool {
	slow, fast := head, head
	for fast != nil && fast.Next != nil {
		slow = slow.Next
		fast = fast.Next.Next
		if slow == fast {
			return true
		}
	}
	return false
}

func mergeTwoLists(a, b *ListNode) *ListNode {
	dummy := &ListNode{}
	tail := dummy
	for a != nil && b != nil {
		if a.Val <= b.Val {
			tail.Next, a = a, a.Next
		} else {
			tail.Next, b = b, b.Next
		}
		tail = tail.Next
	}
	if a != nil {
		tail.Next = a
	} else {
		tail.Next = b
	}
	return dummy.Next
}`},{type:"complexity",time:"O(n)",space:"O(1) for iterative reverse / Floyd; O(n) recursion depth if recursive"},{type:"callout",tone:"tip",body:"Always reach for a dummy (sentinel) node when the head may change — merge, remove-nth-from-end, partition."}],quiz:[{id:"ll1",prompt:"Floyd’s cycle detection uses which idea?",options:["Hash all visited nodes","Slow moves 1, fast moves 2; they meet iff a cycle exists","Binary search on list length","Reverse the list twice"],answerIndex:1,explanation:"If a cycle exists, the faster pointer eventually laps the slower one inside the loop."}]},{slug:"stacks-and-queues",track:"dsa",title:"Stacks & Queues",subtitle:"Monotonic stacks, BFS queues, and Go slice-backed implementations.",difficulty:"beginner",minutes:24,tags:["stack","queue","monotonic"],blocks:[{type:"prose",title:"Idiomatic Go",body:"Use a slice as a stack (append / pop last). For queues, a slice with a head index works for interviews; for production hot paths prefer container/list or a ring buffer to avoid unbounded growth from a shrinking front."},{type:"code",title:"Valid parentheses + next greater element",language:"go",code:`func isValid(s string) bool {
	stack := make([]rune, 0, len(s))
	pair := map[rune]rune{')': '(', ']': '[', '}': '{'}
	for _, c := range s {
		if open, ok := pair[c]; ok {
			if len(stack) == 0 || stack[len(stack)-1] != open {
				return false
			}
			stack = stack[:len(stack)-1]
		} else {
			stack = append(stack, c)
		}
	}
	return len(stack) == 0
}

// Next greater element to the right; -1 if none.
func nextGreater(nums []int) []int {
	n := len(nums)
	ans := make([]int, n)
	for i := range ans {
		ans[i] = -1
	}
	stack := []int{} // indices, increasing values
	for i, v := range nums {
		for len(stack) > 0 && nums[stack[len(stack)-1]] < v {
			idx := stack[len(stack)-1]
			stack = stack[:len(stack)-1]
			ans[idx] = v
		}
		stack = append(stack, i)
	}
	return ans
}`},{type:"complexity",time:"O(n) amortized for monotonic stack (each index pushed/popped once)",space:"O(n)"}],quiz:[{id:"sq1",prompt:"A monotonic increasing stack is typically used to find…",options:["Shortest path in a graph","Next smaller / previous smaller elements efficiently","Strongly connected components","Median of a stream"],answerIndex:1,explanation:"Maintaining order on the stack lets you resolve nearest smaller/greater queries in amortized O(1)."}]},{slug:"hash-maps-and-sets",track:"dsa",title:"Hash Maps & Sets",subtitle:"Frequency counting, indexing, and average O(1) trade-offs in Go maps.",difficulty:"beginner",minutes:20,tags:["hashmap","set"],blocks:[{type:"prose",title:"The interview Swiss army knife",body:"Maps turn many O(n²) scans into O(n). In Go, map[K]V is unordered; never rely on iteration order. For sets, use map[T]struct{} to avoid wasting a bool per key."},{type:"code",title:"Two Sum + group anagrams",language:"go",code:`func twoSum(nums []int, target int) []int {
	idx := make(map[int]int, len(nums))
	for i, v := range nums {
		if j, ok := idx[target-v]; ok {
			return []int{j, i}
		}
		idx[v] = i
	}
	return nil
}

func groupAnagrams(strs []string) [][]string {
	groups := map[string][]string{}
	for _, s := range strs {
		var cnt [26]byte
		for i := 0; i < len(s); i++ {
			cnt[s[i]-'a']++
		}
		key := string(cnt[:]) // compact signature
		groups[key] = append(groups[key], s)
	}
	out := make([][]string, 0, len(groups))
	for _, g := range groups {
		out = append(out, g)
	}
	return out
}`},{type:"callout",tone:"note",body:"Average O(1) ≠ worst O(1). Pathological hash collisions exist in theory; Go’s map randomizes seeds per map to harden against collision attacks."}],quiz:[{id:"hm1",prompt:"Preferred empty-set value type in Go?",options:["map[T]bool","map[T]struct{}","map[T]int","[]T with linear search"],answerIndex:1,explanation:"struct{} has zero size; presence is enough for a set."}]},{slug:"binary-trees",track:"dsa",title:"Binary Trees",subtitle:"DFS, BFS, recursion trees, and divide-and-conquer on hierarchies.",difficulty:"intermediate",minutes:32,tags:["trees","dfs","bfs"],blocks:[{type:"prose",title:"Traversal catalog",body:"Preorder (root-left-right) serializes structure. Inorder on a BST yields sorted order. Postorder cleans up children first. Level-order (BFS) discovers depth layers — the queue pattern reappears in graphs."},{type:"code",title:"Max depth, invert, level order",language:"go",code:`type TreeNode struct {
	Val         int
	Left, Right *TreeNode
}

func maxDepth(root *TreeNode) int {
	if root == nil {
		return 0
	}
	l, r := maxDepth(root.Left), maxDepth(root.Right)
	if l > r {
		return l + 1
	}
	return r + 1
}

func invertTree(root *TreeNode) *TreeNode {
	if root == nil {
		return nil
	}
	root.Left, root.Right = invertTree(root.Right), invertTree(root.Left)
	return root
}

func levelOrder(root *TreeNode) [][]int {
	if root == nil {
		return nil
	}
	var res [][]int
	q := []*TreeNode{root}
	for len(q) > 0 {
		n := len(q)
		level := make([]int, 0, n)
		for i := 0; i < n; i++ {
			node := q[0]
			q = q[1:]
			level = append(level, node.Val)
			if node.Left != nil {
				q = append(q, node.Left)
			}
			if node.Right != nil {
				q = append(q, node.Right)
			}
		}
		res = append(res, level)
	}
	return res
}`},{type:"complexity",time:"O(n) — each node visited once",space:"O(h) recursion / O(w) BFS queue (h=height, w=max width)"}],quiz:[{id:"bt1",prompt:"Inorder traversal of a BST produces…",options:["Random order","Level order","Sorted ascending values","Only leaves"],answerIndex:2,explanation:"BST inorder visits left subtree, node, right subtree — sorted order."}]},{slug:"bst-and-heaps",track:"dsa",title:"BSTs & Heaps",subtitle:"Ordered trees, priority queues, and top-K patterns in Go.",difficulty:"intermediate",minutes:30,tags:["bst","heap","topk"],blocks:[{type:"prose",title:"Order statistics vs priorities",body:"A BST supports ordered operations (predecessor, range queries). A binary heap supports peek-min/max in O(1) and insert/pop in O(log n). In Go, implement heap.Interface from container/heap for interview-grade priority queues."},{type:"code",title:"Min-heap of ints + Kth largest stream sketch",language:"go",code:`type intHeap []int

func (h intHeap) Len() int            { return len(h) }
func (h intHeap) Less(i, j int) bool  { return h[i] < h[j] }
func (h intHeap) Swap(i, j int)       { h[i], h[j] = h[j], h[i] }
func (h *intHeap) Push(x interface{}) { *h = append(*h, x.(int)) }
func (h *intHeap) Pop() interface{} {
	old := *h
	n := len(old)
	x := old[n-1]
	*h = old[:n-1]
	return x
}

// Maintain a min-heap of size k; top is the kth largest.
type KthLargest struct {
	k    int
	heap intHeap
}

func (k *KthLargest) Add(val int) int {
	heap.Push(&k.heap, val)
	if k.heap.Len() > k.k {
		heap.Pop(&k.heap)
	}
	return k.heap[0]
}`},{type:"callout",tone:"tip",body:"For top-K largest, keep a min-heap of size K. For top-K smallest, keep a max-heap of size K."}],quiz:[{id:"bh1",prompt:"Insert into a binary heap is typically…",options:["O(1)","O(log n)","O(n)","O(n log n)"],answerIndex:1,explanation:"Bubble-up along the tree height is O(log n)."}]},{slug:"graphs-bfs-dfs",track:"dsa",title:"Graphs — BFS & DFS",subtitle:"Adjacency lists, visited sets, connected components, and grid DFS.",difficulty:"intermediate",minutes:35,tags:["graphs","bfs","dfs"],blocks:[{type:"prose",title:"Representation first",body:"Prefer adjacency lists: map[int][]int or [][]int. BFS finds shortest paths in unweighted graphs. DFS explores components, detects cycles (with colors/recursion stack), and enables topological thinking."},{type:"code",title:"Number of islands + BFS shortest path length",language:"go",code:`func numIslands(grid [][]byte) int {
	if len(grid) == 0 {
		return 0
	}
	rows, cols := len(grid), len(grid[0])
	var dfs func(r, c int)
	dfs = func(r, c int) {
		if r < 0 || c < 0 || r >= rows || c >= cols || grid[r][c] != '1' {
			return
		}
		grid[r][c] = '0'
		dfs(r+1, c)
		dfs(r-1, c)
		dfs(r, c+1)
		dfs(r, c-1)
	}
	count := 0
	for r := 0; r < rows; r++ {
		for c := 0; c < cols; c++ {
			if grid[r][c] == '1' {
				count++
				dfs(r, c)
			}
		}
	}
	return count
}

func shortestPathBinaryMatrix(grid [][]int) int {
	n := len(grid)
	if grid[0][0] != 0 || grid[n-1][n-1] != 0 {
		return -1
	}
	type cell struct{ r, c, d int }
	q := []cell{{0, 0, 1}}
	grid[0][0] = 1
	dirs := [][2]int{{-1, -1}, {-1, 0}, {-1, 1}, {0, -1}, {0, 1}, {1, -1}, {1, 0}, {1, 1}}
	for len(q) > 0 {
		cur := q[0]
		q = q[1:]
		if cur.r == n-1 && cur.c == n-1 {
			return cur.d
		}
		for _, d := range dirs {
			nr, nc := cur.r+d[0], cur.c+d[1]
			if nr >= 0 && nc >= 0 && nr < n && nc < n && grid[nr][nc] == 0 {
				grid[nr][nc] = 1
				q = append(q, cell{nr, nc, cur.d + 1})
			}
		}
	}
	return -1
}`},{type:"complexity",time:"O(V + E)",space:"O(V) for visited / queue / recursion"}],quiz:[{id:"g1",prompt:"BFS on an unweighted graph yields…",options:["Minimum spanning tree","Shortest path in number of edges","Strongly connected components","Topological order always"],answerIndex:1,explanation:"Each edge has weight 1; first time you reach a node is via fewest edges."}]},{slug:"graphs-advanced",track:"dsa",title:"Graphs — Dijkstra, Topo, Union-Find",subtitle:"Weighted shortest paths, dependency ordering, and disjoint sets.",difficulty:"advanced",minutes:40,tags:["dijkstra","topo","union-find"],prerequisites:["graphs-bfs-dfs"],blocks:[{type:"prose",title:"Pick the right hammer",body:"Dijkstra: non-negative weights, priority queue. Topological sort: DAGs / course schedule. Union-Find (DSU): connectivity, Kruskal MST, redundant connection — nearly O(1) per op with path compression + union by rank."},{type:"code",title:"Union-Find + Kahn topological sort",language:"go",code:`type DSU struct {
	parent, rank []int
}

func NewDSU(n int) *DSU {
	p := make([]int, n)
	for i := range p {
		p[i] = i
	}
	return &DSU{parent: p, rank: make([]int, n)}
}

func (d *DSU) Find(x int) int {
	if d.parent[x] != x {
		d.parent[x] = d.Find(d.parent[x])
	}
	return d.parent[x]
}

func (d *DSU) Union(a, b int) bool {
	ra, rb := d.Find(a), d.Find(b)
	if ra == rb {
		return false
	}
	if d.rank[ra] < d.rank[rb] {
		ra, rb = rb, ra
	}
	d.parent[rb] = ra
	if d.rank[ra] == d.rank[rb] {
		d.rank[ra]++
	}
	return true
}

func canFinish(numCourses int, prerequisites [][]int) bool {
	graph := make([][]int, numCourses)
	indeg := make([]int, numCourses)
	for _, e := range prerequisites {
		a, b := e[0], e[1] // b -> a
		graph[b] = append(graph[b], a)
		indeg[a]++
	}
	q := []int{}
	for i, d := range indeg {
		if d == 0 {
			q = append(q, i)
		}
	}
	seen := 0
	for len(q) > 0 {
		u := q[0]
		q = q[1:]
		seen++
		for _, v := range graph[u] {
			indeg[v]--
			if indeg[v] == 0 {
				q = append(q, v)
			}
		}
	}
	return seen == numCourses
}`},{type:"complexity",time:"Topo O(V+E); DSU ~O(α(n)) per op; Dijkstra O((V+E) log V) with binary heap",space:"O(V+E)"}],quiz:[{id:"ga1",prompt:"Union-Find is a poor fit for…",options:["Detecting whether two nodes are connected","Building an MST with Kruskal","Finding shortest paths with weights","Checking redundant edges in an undirected graph"],answerIndex:2,explanation:"DSU tracks components, not distances. Use Dijkstra/Bellman-Ford for shortest paths."}]},{slug:"recursion-backtracking",track:"dsa",title:"Recursion & Backtracking",subtitle:"State trees, choose/explore/unchoose, and pruning.",difficulty:"intermediate",minutes:30,tags:["recursion","backtracking"],blocks:[{type:"prose",title:"The template",body:"Backtracking builds candidates incrementally and abandons a candidate as soon as it cannot lead to a valid solution. Classic Go interview set: subsets, permutations, combination sum, N-Queens, word search."},{type:"code",title:"Subsets + combination sum",language:"go",code:`func subsets(nums []int) [][]int {
	res := [][]int{}
	cur := []int{}
	var dfs func(start int)
	dfs = func(start int) {
		tmp := append([]int{}, cur...)
		res = append(res, tmp)
		for i := start; i < len(nums); i++ {
			cur = append(cur, nums[i])
			dfs(i + 1)
			cur = cur[:len(cur)-1]
		}
	}
	dfs(0)
	return res
}

func combinationSum(candidates []int, target int) [][]int {
	sort.Ints(candidates)
	res := [][]int{}
	cur := []int{}
	var dfs func(start, remain int)
	dfs = func(start, remain int) {
		if remain == 0 {
			res = append(res, append([]int{}, cur...))
			return
		}
		for i := start; i < len(candidates); i++ {
			if candidates[i] > remain {
				break
			}
			cur = append(cur, candidates[i])
			dfs(i, remain-candidates[i]) // reuse allowed
			cur = cur[:len(cur)-1]
		}
	}
	dfs(0, target)
	return res
}`},{type:"callout",tone:"warn",body:"When appending cur to results, copy it: append([]int{}, cur...). Otherwise every result shares the same backing array."}],quiz:[{id:"rb1",prompt:"Backtracking differs from plain recursion mainly by…",options:["Never using a call stack","Undoing choices (unchoose) after exploring a branch","Only working on trees","Guaranteeing O(n) time"],answerIndex:1,explanation:"The choose → explore → unchoose cycle reuses one path buffer across branches."}]},{slug:"dynamic-programming",track:"dsa",title:"Dynamic Programming",subtitle:"Overlapping subproblems, optimal substructure, and bottom-up tables in Go.",difficulty:"advanced",minutes:45,tags:["dp","memoization"],blocks:[{type:"prose",title:"How to invent a DP",body:"1) Define state clearly (what indices / remaining capacity mean). 2) Write the recurrence. 3) Identify base cases. 4) Decide top-down memo vs bottom-up. 5) Optimize space if only prior rows/cols matter. Patterns: 1D climb/house-robber, 0/1 knapsack, unbounded knapsack, LCS/edit distance, interval DP, digit DP (advanced)."},{type:"code",title:"Climb stairs, knapsack 0/1, coin change",language:"go",code:`func climbStairs(n int) int {
	if n <= 2 {
		return n
	}
	a, b := 1, 2
	for i := 3; i <= n; i++ {
		a, b = b, a+b
	}
	return b
}

// max value with capacity W; weights w, values v
func knapsack(w, v []int, W int) int {
	dp := make([]int, W+1)
	for i := 0; i < len(w); i++ {
		for cap := W; cap >= w[i]; cap-- {
			if dp[cap-w[i]]+v[i] > dp[cap] {
				dp[cap] = dp[cap-w[i]] + v[i]
			}
		}
	}
	return dp[W]
}

func coinChange(coins []int, amount int) int {
	const inf = int(1e9)
	dp := make([]int, amount+1)
	for i := 1; i <= amount; i++ {
		dp[i] = inf
	}
	for a := 1; a <= amount; a++ {
		for _, c := range coins {
			if c <= a && dp[a-c]+1 < dp[a] {
				dp[a] = dp[a-c] + 1
			}
		}
	}
	if dp[amount] >= inf {
		return -1
	}
	return dp[amount]
}`},{type:"complexity",time:"Depends on state space — e.g. coin change O(amount * |coins|)",space:"Often reducible from O(n*W) to O(W)"}],quiz:[{id:"dp1",prompt:"DP requires which pair of properties?",options:["Greedy choice and matroid structure","Overlapping subproblems and optimal substructure","Sorted input and two pointers","Immutable graphs only"],answerIndex:1,explanation:"You reuse solutions to subproblems that combine into an optimal global answer."}]},{slug:"sliding-window-two-pointers",track:"dsa",title:"Sliding Window & Two Pointers",subtitle:"Subarray/substring constraints without O(n²) restarts.",difficulty:"intermediate",minutes:26,tags:["sliding-window","two-pointers"],blocks:[{type:"prose",title:"Fixed vs variable window",body:"Fixed window: maintain sum/product of k elements. Variable window: expand right, shrink left while invariant broken (at most K distinct, sum ≤ target, etc.). Same-direction two pointers often equal a sliding window."},{type:"code",title:"Min window substring (ASCII) + max sum subarray of size k",language:"go",code:`func maxSumSubarray(nums []int, k int) int {
	sum := 0
	for i := 0; i < k; i++ {
		sum += nums[i]
	}
	best := sum
	for i := k; i < len(nums); i++ {
		sum += nums[i] - nums[i-k]
		if sum > best {
			best = sum
		}
	}
	return best
}

func minWindow(s, t string) string {
	need := [128]int{}
	for i := 0; i < len(t); i++ {
		need[t[i]]++
	}
	missing := len(t)
	bestL, bestLen := 0, len(s)+1
	left := 0
	for right := 0; right < len(s); right++ {
		c := s[right]
		need[c]--
		if need[c] >= 0 {
			missing--
		}
		for missing == 0 {
			if right-left+1 < bestLen {
				bestL, bestLen = left, right-left+1
			}
			d := s[left]
			need[d]++
			if need[d] > 0 {
				missing++
			}
			left++
		}
	}
	if bestLen == len(s)+1 {
		return ""
	}
	return s[bestL : bestL+bestLen]
}`}],quiz:[{id:"sw1",prompt:"Variable sliding window shrinks the left pointer when…",options:["The array is unsorted","The current window violates the problem invariant","BFS finishes a level","A heap overflows"],answerIndex:1,explanation:"Expand to include new candidates; shrink until the window is valid again."}]},{slug:"sorting-searching",track:"dsa",title:"Sorting & Binary Search",subtitle:"sort package, custom order, and search on answer space.",difficulty:"intermediate",minutes:28,tags:["sorting","binary-search"],blocks:[{type:"prose",title:"Binary search beyond arrays",body:"Besides finding a value, binary search works on monotonic predicates: minimize capacity to ship packages, maximize mid-distance between cows, lower_bound on answer space. In Go use sort.Slice and sort.Search."},{type:"code",title:"sort.Search lower bound + search on answer",language:"go",code:`func lowerBound(a []int, target int) int {
	return sort.Search(len(a), func(i int) bool {
		return a[i] >= target
	})
}

// Minimize max load when splitting nums into at most m subarrays.
func splitArray(nums []int, m int) int {
	lo, hi := 0, 0
	for _, v := range nums {
		if v > lo {
			lo = v
		}
		hi += v
	}
	return lo + sort.Search(hi-lo+1, func(x int) bool {
		limit := lo + x
		need, sum := 1, 0
		for _, v := range nums {
			if sum+v > limit {
				need++
				sum = v
			} else {
				sum += v
			}
		}
		return need <= m
	})
}`},{type:"complexity",time:"Binary search O(log R * cost(check)); sorting O(n log n)",space:"Usually O(1) extra for iterative search"}],quiz:[{id:"ss1",prompt:"sort.Search returns the smallest index i where f(i) is true, assuming…",options:["f is random","f is false for a prefix then true afterward (monotonic)","The slice is a max-heap","i must be a power of two"],answerIndex:1,explanation:"Binary search requires a monotonic predicate."}]},{slug:"tries-and-bitmask",track:"dsa",title:"Tries & Bit Manipulation",subtitle:"Prefix trees, bitmask DP starters, and bit tricks in Go.",difficulty:"advanced",minutes:30,tags:["trie","bits"],blocks:[{type:"prose",title:"Prefixes and bits",body:"Tries (prefix trees) accelerate autocomplete and word-break style problems. Bit tricks: x&-x isolates lowest set bit; XOR finds unique numbers; bitmasks represent subsets when n ≤ 20."},{type:"code",title:"Trie insert/search + single-number XOR",language:"go",code:`type TrieNode struct {
	children [26]*TrieNode
	end      bool
}

type Trie struct{ root *TrieNode }

func Constructor() Trie { return Trie{root: &TrieNode{}} }

func (t *Trie) Insert(word string) {
	cur := t.root
	for i := 0; i < len(word); i++ {
		idx := word[i] - 'a'
		if cur.children[idx] == nil {
			cur.children[idx] = &TrieNode{}
		}
		cur = cur.children[idx]
	}
	cur.end = true
}

func (t *Trie) Search(word string) bool {
	cur := t.root
	for i := 0; i < len(word); i++ {
		idx := word[i] - 'a'
		if cur.children[idx] == nil {
			return false
		}
		cur = cur.children[idx]
	}
	return cur.end
}

func singleNumber(nums []int) int {
	x := 0
	for _, v := range nums {
		x ^= v
	}
	return x
}`}],quiz:[{id:"tb1",prompt:"XOR of a number with itself is…",options:["The number","1","0","Undefined"],answerIndex:2,explanation:"x^x = 0, which is why XOR cancels pairs."}]},{slug:"go-fundamentals",track:"concepts",title:"Go Fundamentals",subtitle:"Packages, types, zero values, control flow, and idiomatic structure.",difficulty:"beginner",minutes:20,tags:["basics","packages"],blocks:[{type:"prose",title:"Zero values matter",body:'Every type has a zero value (0, "", nil, false). Idiomatic Go leans on zeros instead of constructors when possible. Exported identifiers start with uppercase. Organize by package responsibility, not by layer folders alone.'},{type:"code",title:"Structs, methods, and pointers",language:"go",code:`type User struct {
	ID   int
	Name string
}

func (u User) Display() string { // value receiver — copy
	return u.Name
}

func (u *User) Rename(name string) { // pointer receiver — mutates
	u.Name = name
}`},{type:"callout",tone:"tip",body:"Use pointer receivers when the method mutates state, for large structs, or for consistency across the method set."}],quiz:[{id:"cf1",prompt:"Zero value of a slice is…",options:["Empty slice with len 0 cap 0 backing array","nil","[]T{}","panic"],answerIndex:1,explanation:"A slice’s zero value is nil (len=0, cap=0, no backing array)."}]},{slug:"interfaces",track:"concepts",title:"Interfaces",subtitle:"Implicit satisfaction, small interfaces, and composition.",difficulty:"beginner",minutes:25,tags:["interfaces"],blocks:[{type:"prose",title:"Accept interfaces, return structs",body:"Go interfaces are satisfied implicitly. Define interfaces where they are consumed (consumer side), keep them small (io.Reader), and compose them. interface{} / any erases type — prefer generics or concrete types when you can."},{type:"code",title:"Small interface + compile-time assertion",language:"go",code:`type Store interface {
	Get(ctx context.Context, id string) ([]byte, error)
	Put(ctx context.Context, id string, val []byte) error
}

type MemoryStore struct {
	mu sync.RWMutex
	m  map[string][]byte
}

func (s *MemoryStore) Get(ctx context.Context, id string) ([]byte, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	v, ok := s.m[id]
	if !ok {
		return nil, errNotFound
	}
	return append([]byte(nil), v...), nil
}

var _ Store = (*MemoryStore)(nil) // fails compile if methods missing`}],quiz:[{id:"iface1",prompt:"Does a type need to declare that it implements an interface?",options:["Yes, with implements","Yes, in the package clause","No — method set match is enough","Only for exported interfaces"],answerIndex:2,explanation:"Satisfaction is implicit in Go."}]},{slug:"concurrency-goroutines",track:"concepts",title:"Goroutines & Channels",subtitle:"CSP-style concurrency, ownership of data, and select.",difficulty:"intermediate",minutes:35,tags:["goroutines","channels","select"],blocks:[{type:"prose",title:"Do not communicate by sharing memory",body:"Share memory by communicating. Prefer channel ownership patterns: one writer closes; receivers range until close. Use context for cancellation. Bounded concurrency via worker pools / semaphores (chan struct{}, n)."},{type:"code",title:"Worker pool + select timeout",language:"go",code:`func processAll(ctx context.Context, jobs []Job, workers int) error {
	ch := make(chan Job)
	errCh := make(chan error, 1)
	var wg sync.WaitGroup
	for i := 0; i < workers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for j := range ch {
				if err := j.Do(ctx); err != nil {
					select {
					case errCh <- err:
					default:
					}
					return
				}
			}
		}()
	}
	go func() {
		defer close(ch)
		for _, j := range jobs {
			select {
			case <-ctx.Done():
				return
			case ch <- j:
			}
		}
	}()
	wg.Wait()
	select {
	case err := <-errCh:
		return err
	default:
		return ctx.Err()
	}
}`},{type:"callout",tone:"warn",body:"Goroutine leaks happen when a sender blocks forever or a receiver never drains. Always define who closes and how cancellation unblocks waiters."}],quiz:[{id:"conc1",prompt:"Who should close a channel?",options:["Any receiver","The sender / owner that knows when no more values will be sent","The garbage collector","Both ends simultaneously"],answerIndex:1,explanation:"Closing is a signal from the producer side; multiple closers panic."}]},{slug:"context-and-errors",track:"concepts",title:"Context & Error Handling",subtitle:"Cancellation trees, wrapping, and sentinel vs typed errors.",difficulty:"intermediate",minutes:28,tags:["context","errors"],blocks:[{type:"prose",title:"Context is request-scoped",body:'Pass ctx as the first parameter. Never store contexts in structs (except rare short-lived helpers). Derive WithCancel / WithTimeout at boundaries. For errors: fmt.Errorf("...: %w", err), errors.Is / errors.As, and avoid panics for expected failures.'},{type:"code",title:"Wrap + Is / As",language:"go",code:`var ErrNotFound = errors.New("not found")

func LoadUser(ctx context.Context, id string) (*User, error) {
	u, err := db.Find(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, fmt.Errorf("user %s: %w", id, ErrNotFound)
		}
		return nil, fmt.Errorf("load user %s: %w", id, err)
	}
	return u, nil
}`}],quiz:[{id:"ce1",prompt:"errors.Is walks the error chain looking for…",options:["Stack traces only","A matching sentinel / comparable error","HTTP status codes","Panic values"],answerIndex:1,explanation:"Is unwraps through %w wrappers until it finds a match."}]},{slug:"generics-and-testing",track:"concepts",title:"Generics & Testing",subtitle:"Type parameters, constraints, table-driven tests, and fuzzing.",difficulty:"intermediate",minutes:30,tags:["generics","testing"],blocks:[{type:"prose",title:"Generics where duplication hurts",body:"Use type parameters for containers, optional helpers, and algorithms over comparable/ordered data. Prefer interfaces when behavior varies by method sets. Tests: table-driven, t.Parallel carefully with isolation, go test -fuzz for parsers."},{type:"code",title:"Generic Map + table test",language:"go",code:`func Map[T, U any](in []T, f func(T) U) []U {
	out := make([]U, len(in))
	for i, v := range in {
		out[i] = f(v)
	}
	return out
}

func TestAdd(t *testing.T) {
	tests := []struct {
		name string
		a, b int
		want int
	}{
		{"pos", 1, 2, 3},
		{"neg", -1, -1, -2},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			if got := tc.a + tc.b; got != tc.want {
				t.Fatalf("got %d want %d", got, tc.want)
			}
		})
	}
}`}],quiz:[{id:"gt1",prompt:"Table-driven tests help primarily by…",options:["Avoiding the testing package","Expressing many cases with one harness","Making code run on the GPU","Replacing fuzzing entirely"],answerIndex:1,explanation:"One loop over cases keeps assertions consistent and easy to extend."}]},{slug:"memory-and-performance",track:"concepts",title:"Memory & Performance Habits",subtitle:"Allocations, escape analysis intuition, pooling, and profiling.",difficulty:"advanced",minutes:32,tags:["performance","pprof"],blocks:[{type:"prose",title:"Measure first",body:"Use go test -bench, pprof (cpu/heap/block/mutex), and escape analysis (go build -gcflags=-m). Reduce allocations in hot paths: preallocate slices, reuse buffers with sync.Pool carefully, avoid interface boxing in tight loops, prefer value types when small."},{type:"steps",title:"Profiling workflow",items:["Write a benchmark that mirrors production shape","Capture CPU and heap profiles under load","Fix the top offenders; re-bench","Watch for regressions in CI benchmarks"]}],quiz:[{id:"mp1",prompt:"sync.Pool is best for…",options:["Long-lived database connections","Reusable temporary objects in hot paths","Cross-process shared memory","Guaranteed retention of objects"],answerIndex:1,explanation:"Pool may drop objects anytime (e.g. GC); it is for ephemeral reuse."}]},{slug:"scheduler-gpm",track:"internals",title:"Scheduler: G, M, P",subtitle:"How Go multiplexes goroutines onto OS threads.",difficulty:"advanced",minutes:35,tags:["scheduler","runtime"],blocks:[{type:"prose",title:"The triad",body:"G = goroutine, M = OS thread (machine), P = processor (logical resource required to run Go code). GOMAXPROCS Ps cooperate to run runnable Gs. Work-stealing balances run queues. Blocking syscalls can detach M from P so other Ms keep running Go code."},{type:"prose",title:"Preemption",body:"Modern Go uses asynchronous preemption (signals) so tight loops without function calls can still be preempted for GC/scheduling fairness. Understanding this explains why a busy-spin without calls can still yield — and why CPU-bound code needs enough Ps."},{type:"callout",tone:"note",body:"GOMAXPROCS defaults to the CPU count. Raising it beyond CPUs rarely helps CPU-bound work; it can help when threads block in cgo/syscalls."},{type:"steps",title:"What to remember for interviews",items:["Goroutines are cheap user-space tasks, not 1:1 OS threads","P owns a run queue; M must hold a P to execute Go code","Network poller unblocks Gs waiting on sockets","Hand off on syscalls keeps Ps busy"]}],quiz:[{id:"sched1",prompt:"What does P stand for in the Go scheduler?",options:["Process","Processor (logical)","Priority","Page"],answerIndex:1,explanation:"P is a logical processor required to run Go code; count tied to GOMAXPROCS."}]},{slug:"garbage-collector",track:"internals",title:"Garbage Collector",subtitle:"Tri-color marking, write barriers, and pacing.",difficulty:"advanced",minutes:35,tags:["gc","memory"],blocks:[{type:"prose",title:"Concurrent mark-sweep",body:"Go’s GC is a concurrent, tri-color mark-and-sweep collector. Mutators run while marking proceeds; write barriers keep the color invariant. GC pacing aims to meet a heap goal (GOGC / GOMEMLIMIT) without long STW. STW still occurs for brief mark termination / sweep prep."},{type:"prose",title:"Practical knobs",body:"GOGC controls heap growth relative to live data (100 ≈ double). GOMEMLIMIT sets a soft memory limit. Reducing allocations often beats tuning. Use runtime/metrics and pprof heap profiles before changing knobs."},{type:"callout",tone:"tip",body:"Pointers in many tiny objects increase scan work. Sometimes []struct{} layout or arena-like batching (carefully) reduces GC pressure more than micro-optimizations."}],quiz:[{id:"gc1",prompt:"GOGC=100 approximately means…",options:["GC runs every 100ms","Heap can grow to ~2× live data before GC triggers","Only 100 goroutines allowed","Disable GC"],answerIndex:1,explanation:"GOGC is a percentage of live heap growth target."}]},{slug:"slices-maps-internals",track:"internals",title:"Slices & Maps Internals",subtitle:"Headers, growth strategy, hmap buckets, and evacuation.",difficulty:"advanced",minutes:30,tags:["slices","maps"],blocks:[{type:"prose",title:"Slice header",body:"runtime representation is roughly {array unsafe.Pointer, len int, cap int}. append grows by cloning to a larger array when len==cap. Growth factor is size-dependent (not always 2× for large slices)."},{type:"prose",title:"Map structure",body:"Maps use an hmap pointing to buckets (bmap). Keys hash to buckets; overflow chains handle collisions. During growth, incremental evacuation moves entries to a new bucket array. Iteration order is randomized intentionally."},{type:"callout",tone:"warn",body:"Concurrent map read+write without sync panics (detected). Use sync.Map for specific patterns or a mutex around a normal map."}],quiz:[{id:"smi1",prompt:"Why is map iteration order randomized?",options:["Hardware requirement","To prevent programs from relying on unstable order and to mitigate collision attacks","Because keys are always sorted","GC requirement"],answerIndex:1,explanation:"Random seeds / iteration start discourage dependency on order and harden hashing."}]},{slug:"channels-internals",track:"internals",title:"Channels Internals",subtitle:"Buffers, wait queues, and sudog parking.",difficulty:"advanced",minutes:28,tags:["channels","runtime"],blocks:[{type:"prose",title:"Under the hood",body:"An hchan holds a circular buffer (if buffered), mutex, and wait queues for senders/receivers (sudogs). Unbuffered send synchronizes directly with a receiver. Select builds a set of cases, randomizes order for fairness, and may park until a case is ready."},{type:"steps",title:"Design implications",items:["Unbuffered channel = rendezvous synchronization","Buffered channel decouples burstiness up to capacity","Closing broadcasts to waiting receivers","Sending on closed channel panics — treat close as ownership signal"]}],quiz:[{id:"ch1",prompt:"An unbuffered channel send completes when…",options:["The value is copied into a buffer","A receiver is ready (rendezvous)","GC runs","GOMAXPROCS > 1"],answerIndex:1,explanation:"Unbuffered transfers happen directly between goroutines."}]},{slug:"interface-and-escape",track:"internals",title:"Interfaces & Escape Analysis",subtitle:"itab, dynamic dispatch, stack vs heap decisions.",difficulty:"advanced",minutes:30,tags:["interfaces","escape-analysis"],blocks:[{type:"prose",title:"iface / eface",body:"An interface value is a pair: type metadata + data pointer (roughly). For interfaces with methods, itab connects concrete type to method table. Calling through an interface is an indirect call — harder for inlining. Boxing a concrete value into an interface often allocates."},{type:"prose",title:"Escape analysis",body:"The compiler keeps values on the stack when it proves they do not outlive the frame. Returning pointers, storing into heap structures, or interface conversion can force heap allocation. Check with go build -gcflags='-m'."},{type:"code",title:"Seeing escapes",language:"bash",code:`go build -gcflags='-m -m' ./...
# Look for: "moved to heap"`}],quiz:[{id:"ie1",prompt:"Storing a concrete value in an interface often…",options:["Deletes the value","May allocate (box) on the heap","Forces GOMAXPROCS=1","Disables inlining globally"],answerIndex:1,explanation:"Interface conversion frequently causes escape/boxing."}]},{slug:"sync-primitives",track:"internals",title:"Sync Primitives Deep Dive",subtitle:"Mutex, RWMutex, WaitGroup, Cond, Once, and atomic.",difficulty:"advanced",minutes:32,tags:["sync","atomic"],blocks:[{type:"prose",title:"Choosing tools",body:"Mutex: exclusive critical sections. RWMutex: many readers / rare writers. WaitGroup: fork-join. Cond: wait for complex conditions (easy to misuse — prefer channels when possible). Once: safe init. atomic: lock-free counters/flags; not a substitute for invariants spanning multiple variables."},{type:"code",title:"Copy-on-read cache with RWMutex",language:"go",code:`type Cache struct {
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
}`},{type:"callout",tone:"warn",body:"Never copy a sync.Mutex (pass pointers). Embedding Mutex in structs is fine; copying the struct locks a different mutex."}],quiz:[{id:"sp1",prompt:"RWMutex is a win when…",options:["Writes dominate","Reads dominate and critical sections are short","You need cross-process locks","You avoid all memory fences"],answerIndex:1,explanation:"Readers share the lock; write-heavy workloads often do better with a plain Mutex."}]},{slug:"solid-in-go",track:"lld",title:"SOLID in Go",subtitle:"Applying SOLID with packages, interfaces, and composition.",difficulty:"intermediate",minutes:30,tags:["solid","design"],blocks:[{type:"prose",title:"Go-flavored SOLID",body:"S: one reason to change per type/package. O: extend via new types satisfying interfaces, not giant switch edits. L: behave as the interface promises. I: small interfaces (segregate). D: depend on abstractions at boundaries (Store, Clock, Publisher)."},{type:"code",title:"Dependency inversion at the edge",language:"go",code:`type Clock interface{ Now() time.Time }

type OrderService struct {
	store Store
	clock Clock
	bus   Publisher
}

func (s *OrderService) Place(ctx context.Context, cmd PlaceOrder) error {
	o := Order{ID: newID(), At: s.clock.Now(), Items: cmd.Items}
	if err := s.store.Save(ctx, o); err != nil {
		return err
	}
	return s.bus.Publish(ctx, OrderPlaced{ID: o.ID})
}`},{type:"callout",tone:"tip",body:"Do not interface everything. Abstract where you need tests or multiple implementations; keep internals concrete."}],quiz:[{id:"solid1",prompt:"Interface segregation in Go usually means…",options:["One mega interface for the app","Many small interfaces defined near consumers","No interfaces at all","Interfaces only in /pkg"],answerIndex:1,explanation:"Small, consumer-defined interfaces keep deps narrow."}]},{slug:"strategy-factory-observer",track:"lld",title:"Strategy, Factory & Observer",subtitle:"Classic patterns mapped to idiomatic Go.",difficulty:"intermediate",minutes:28,tags:["patterns"],blocks:[{type:"prose",title:"Patterns without ceremony",body:"Strategy = interface with interchangeable implementations. Factory = constructor functions / registries. Observer = callbacks or channels / event bus. Prefer functions and interfaces over class hierarchies."},{type:"code",title:"Strategy + simple factory registry",language:"go",code:`type Hasher interface{ Sum([]byte) string }

type MD5 struct{}
func (MD5) Sum(b []byte) string { return fmt.Sprintf("%x", md5.Sum(b)) }

type SHA256 struct{}
func (SHA256) Sum(b []byte) string { return fmt.Sprintf("%x", sha256.Sum256(b)) }

func NewHasher(name string) (Hasher, error) {
	switch name {
	case "md5":
		return MD5{}, nil
	case "sha256":
		return SHA256{}, nil
	default:
		return nil, fmt.Errorf("unknown hasher %q", name)
	}
}`}],quiz:[{id:"pat1",prompt:"Strategy pattern in Go is typically…",options:["Inheritance trees","An interface with pluggable implementations","Global mutable function pointers only","A Kubernetes CRD"],answerIndex:1,explanation:"Swap behaviors by injecting different interface implementations."}]},{slug:"rate-limiter-lld",track:"lld",title:"LLD: Rate Limiter",subtitle:"Token bucket and sliding window designs in Go.",difficulty:"intermediate",minutes:35,tags:["rate-limit","concurrency"],blocks:[{type:"prose",title:"Requirements",body:"Allow N requests per window per key (IP/user). Must be concurrency-safe. Optional burst. Discuss in-memory vs Redis for multi-instance. Algorithms: fixed window (simple, bursty at edges), sliding window log/counter, token bucket, leaky bucket."},{type:"code",title:"Token bucket (per process)",language:"go",code:`type TokenBucket struct {
	mu         sync.Mutex
	tokens     float64
	capacity   float64
	refillPerS float64
	last       time.Time
}

func NewTokenBucket(capacity, refillPerS float64) *TokenBucket {
	return &TokenBucket{
		tokens: capacity, capacity: capacity,
		refillPerS: refillPerS, last: time.Now(),
	}
}

func (b *TokenBucket) Allow() bool {
	b.mu.Lock()
	defer b.mu.Unlock()
	now := time.Now()
	elapsed := now.Sub(b.last).Seconds()
	b.last = now
	b.tokens += elapsed * b.refillPerS
	if b.tokens > b.capacity {
		b.tokens = b.capacity
	}
	if b.tokens < 1 {
		return false
	}
	b.tokens--
	return true
}`},{type:"steps",title:"Interview checklist",items:["Clarify key granularity and limits","Single node vs distributed","Burst vs smooth shaping","Failure mode: fail open vs closed","Observability: metrics for rejects"]}],quiz:[{id:"rl1",prompt:"Token bucket allows bursts up to…",options:["Infinity","The bucket capacity","GOMAXPROCS","TCP window size only"],answerIndex:1,explanation:"Capacity caps how many tokens (requests) can be saved for bursts."}]},{slug:"lru-cache-lld",track:"lld",title:"LLD: LRU Cache",subtitle:"Hash map + doubly linked list with capacity eviction.",difficulty:"intermediate",minutes:30,tags:["cache","lru"],blocks:[{type:"prose",title:"Design",body:"O(1) get/put with capacity. Map key → node; list maintains recency (head=MRU, tail=LRU). On get: move to head. On put: update/move or insert; if over capacity, evict tail. Add mutex for concurrent use."},{type:"code",title:"LRU sketch",language:"go",code:`type node struct {
	key, val   int
	prev, next *node
}

type LRUCache struct {
	cap        int
	items      map[int]*node
	head, tail *node
}

func Constructor(capacity int) LRUCache {
	h, t := &node{}, &node{}
	h.next, t.prev = t, h
	return LRUCache{cap: capacity, items: map[int]*node{}, head: h, tail: t}
}

func (c *LRUCache) Get(key int) int {
	n, ok := c.items[key]
	if !ok {
		return -1
	}
	c.moveToHead(n)
	return n.val
}`},{type:"complexity",time:"O(1) get/put average",space:"O(capacity)"}],quiz:[{id:"lru1",prompt:"Why pair a map with a doubly linked list for LRU?",options:["Lists sort faster than maps","Map gives O(1) lookup; list gives O(1) reorder/evict","GC requires lists","To avoid hashing"],answerIndex:1,explanation:"Together they provide O(1) access and O(1) recency updates."}]},{slug:"url-shortener-lld",track:"lld",title:"LLD: URL Shortener",subtitle:"API, ID generation, storage schema, and collisions.",difficulty:"intermediate",minutes:35,tags:["url-shortener"],blocks:[{type:"prose",title:"Components",body:"API: POST /shorten → code; GET /{code} → 302 redirect. ID generation: counter+Base62, hash+truncate with collision retry, or UUID truncated (worse). Store: code → long URL, created_at, optional expiry & user_id. Analytics optional async."},{type:"code",title:"Base62 encode",language:"go",code:`const alphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

func ToBase62(n uint64) string {
	if n == 0 {
		return "0"
	}
	var b [11]byte
	i := len(b)
	for n > 0 {
		i--
		b[i] = alphabet[n%62]
		n /= 62
	}
	return string(b[i:])
}`},{type:"steps",title:"Class diagram (logical)",items:["ShortenService depends on IDGenerator + URLRepository","HTTP handler translates DTOs ↔ domain","Redirect path is read-heavy — cache layer optional","Unique index on code; optional unique on long URL for idempotency"]}],quiz:[{id:"us1",prompt:"A common ID strategy for short codes is…",options:["Only MD5 of URL with no collision handling","Monotonic ID encoded as Base62","Store the full URL as the path","Use port numbers"],answerIndex:1,explanation:"Counters/snowflakes + Base62 produce compact unique codes."}]},{slug:"parking-lot-lld",track:"lld",title:"LLD: Parking Lot",subtitle:"Spots, vehicles, allocation strategies, and fees.",difficulty:"intermediate",minutes:32,tags:["ood"],blocks:[{type:"prose",title:"Model",body:"Vehicle types (bike/car/bus) map to spot sizes. ParkingLot has floors → spots. Ticket issued on entry; fee calculator on exit. Strategy for finding next spot (nearest, balanced floors). Thread-safe allocation under concurrency."},{type:"code",title:"Core types",language:"go",code:`type SpotSize int
const (
	Bike SpotSize = iota
	Car
	Bus
)

type Spot struct {
	ID       string
	Size     SpotSize
	Occupied bool
	Vehicle  *Vehicle
}

type ParkingLot struct {
	mu    sync.Mutex
	spots []*Spot
	fees  FeePolicy
}

func (p *ParkingLot) Park(v Vehicle) (*Ticket, error) {
	p.mu.Lock()
	defer p.mu.Unlock()
	for _, s := range p.spots {
		if !s.Occupied && s.Size >= v.Size {
			s.Occupied, s.Vehicle = true, &v
			return &Ticket{SpotID: s.ID, In: time.Now()}, nil
		}
	}
	return nil, errFull
}`}],quiz:[{id:"pl1",prompt:"Why use a strategy for spot allocation?",options:["To avoid structs","So policies (nearest, even fill) can change without rewriting the lot core","Because SQL requires it","To disable concurrency"],answerIndex:1,explanation:"Strategy isolates allocation policy from the parking lot aggregate."}]},{slug:"notification-system-lld",track:"lld",title:"LLD: Notification System",subtitle:"Channels, templates, retries, and fan-out.",difficulty:"advanced",minutes:34,tags:["notifications"],blocks:[{type:"prose",title:"Design sketch",body:"NotificationService accepts a NotifyCommand (user, template, data, channels). TemplateRenderer fills content. ChannelSender interface: Email, SMS, Push. Outbox/queue for async delivery; retry with backoff; idempotency keys; preference service for opt-out."},{type:"code",title:"Sender interface",language:"go",code:`type Sender interface {
	Send(ctx context.Context, msg Message) error
}

type Dispatcher struct {
	senders map[Channel]Sender
	prefs   PreferenceService
}

func (d *Dispatcher) Dispatch(ctx context.Context, n Notification) error {
	channels := d.prefs.ChannelsFor(ctx, n.UserID, n.Kind)
	var errs []error
	for _, ch := range channels {
		s, ok := d.senders[ch]
		if !ok {
			continue
		}
		if err := s.Send(ctx, n.ToMessage(ch)); err != nil {
			errs = append(errs, err)
		}
	}
	return errors.Join(errs...)
}`}],quiz:[{id:"ns1",prompt:"Why put notifications on a queue?",options:["Queues make email HTML prettier","Decouple request latency from slow providers and enable retries","To avoid interfaces","Because SMTP forbids sync calls"],answerIndex:1,explanation:"Async delivery absorbs provider latency and supports retry/backoff."}]},{slug:"connection-pool-lld",track:"lld",title:"LLD: Connection Pool",subtitle:"Acquire/release, health checks, and idle timeouts.",difficulty:"advanced",minutes:28,tags:["pooling"],blocks:[{type:"prose",title:"Requirements",body:"Max open connections, max idle, max lifetime, borrow timeout. Protect against thundering herd. In Go, database/sql already pools — knowing the design helps you tune SetMaxOpenConns / SetConnMaxLifetime and build pools for other resources (gRPC, SSH)."},{type:"steps",title:"Lifecycle",items:["Acquire: reuse idle or open new if under max","Use: caller owns until release","Release: health check; discard bad; idle queue","Reaper: close idle/expired conns"]}],quiz:[{id:"cp1",prompt:"SetMaxOpenConns primarily prevents…",options:["DNS failures","Overwhelming the database with too many concurrent connections","GC pauses","JSON encoding costs"],answerIndex:1,explanation:"Caps concurrent DB connections from that process."}]},{slug:"system-design-foundations",track:"hld",title:"System Design Foundations",subtitle:"Requirements, capacity, APIs, and the classic building blocks.",difficulty:"intermediate",minutes:30,tags:["foundations"],blocks:[{type:"prose",title:"Interview flow",body:"1) Clarify functional + non-functional requirements. 2) Estimate QPS, storage, bandwidth. 3) Sketch API. 4) High-level components. 5) Deep-dive bottlenecks. 6) Failures, scaling, observability. Speak trade-offs out loud."},{type:"steps",title:"Building blocks",items:["Load balancer / API gateway","App servers (stateless)","Cache (Redis/Memcached)","Database (SQL/NoSQL) + replicas","Object storage / CDN","Message queue / log","Search index"]},{type:"callout",tone:"tip",body:"Always ask: read vs write ratio, consistency needs, latency SLO, multi-region, and abuse cases."}],quiz:[{id:"sdf1",prompt:"Why prefer stateless app servers?",options:["They use less electricity by law","Horizontal scaling and easy replaceability behind a load balancer","They remove the need for databases","They guarantee strong consistency"],answerIndex:1,explanation:"Any instance can handle any request; scale by adding boxes."}]},{slug:"cap-consistency",track:"hld",title:"CAP, Consistency & Consensus",subtitle:"Trade-offs in distributed data: CP/AP, quorum, and consensus.",difficulty:"advanced",minutes:35,tags:["cap","consistency"],blocks:[{type:"prose",title:"CAP in practice",body:"Under network partition you lean toward Consistency (reject/serve only primary) or Availability (serve possibly stale). Most systems offer tunable consistency: eventual, read-your-writes, quorum (R+W>N), linearizability via consensus (Raft/Paxos) for control planes / metadata."},{type:"prose",title:"Patterns",body:"Single leader replication: simple reads/writes, failover complexity. Multi-leader: write availability, conflict resolution. Leaderless (Dynamo-style): quorums + vector clocks/CRDTs. Pick based on conflict tolerance."}],quiz:[{id:"cap1",prompt:"Raft is typically used to provide…",options:["Best-effort UDP delivery","Replicated state machine consensus for strong leadership/consistency","CDN caching","JSON schema validation"],answerIndex:1,explanation:"Raft elects a leader and replicates a log for consistent state machines."}]},{slug:"caching-cdn",track:"hld",title:"Caching & CDN",subtitle:"Where to cache, invalidation, and stampede control.",difficulty:"intermediate",minutes:28,tags:["cache","cdn"],blocks:[{type:"prose",title:"Layers",body:"Browser → CDN → reverse proxy → app → Redis → DB. Each layer needs TTL and invalidation strategy. Problems: stampede (thundering herd), stampede on expiry, hot keys, cache penetration (misses for missing keys)."},{type:"steps",title:"Mitigations",items:["Request coalescing / singleflight","Probabilistic early expiration","Negative caching for misses","Hot key replication / local cache","Write-through vs write-back vs invalidate-on-write"]},{type:"code",title:"singleflight for stampede",language:"go",code:`var group singleflight.Group

func GetUser(ctx context.Context, id string) (*User, error) {
	v, err, _ := group.Do("user:"+id, func() (interface{}, error) {
		return repo.FindUser(ctx, id)
	})
	if err != nil {
		return nil, err
	}
	return v.(*User), nil
}`}],quiz:[{id:"cc1",prompt:"Cache stampede happens when…",options:["TTLs are infinite","Many requests concurrently miss and hit the origin for the same key","CDN is disabled by law","You use HTTPS"],answerIndex:1,explanation:"Coalescing/singleflight prevents duplicate origin fetches."}]},{slug:"databases-scaling",track:"hld",title:"Databases & Scaling",subtitle:"Indexing, replication, sharding, and when to go NoSQL.",difficulty:"advanced",minutes:40,tags:["database","sharding"],blocks:[{type:"prose",title:"Scale ladder",body:"Vertical scale → indexes & query tuning → read replicas → caching → partitioning/sharding → specialized stores. Sharding needs a key that balances load and supports queries; cross-shard transactions are expensive."},{type:"prose",title:"SQL vs NoSQL (pragmatic)",body:"SQL: rich queries, joins, strong transactions. Document/KV: flexible docs, easy horizontal scale for simple access patterns. Wide-column: time series / huge writes. Search engines for full-text. Often polyglot: OLTP SQL + Redis + object store + search."},{type:"callout",tone:"note",body:"In Go services, prefer clear repository boundaries so storage engines can change without rewriting domain logic."}],quiz:[{id:"db1",prompt:"A good shard key usually…",options:["Is constantly updated","Distributes load evenly and matches primary access patterns","Is a random UUID always with heavy range scans by date","Is the server hostname"],answerIndex:1,explanation:"Balance + query affinity beat theoretically unique but impractical keys."}]},{slug:"messaging-queues",track:"hld",title:"Messaging & Event-Driven Design",subtitle:"Queues vs logs, delivery semantics, and outbox.",difficulty:"advanced",minutes:35,tags:["messaging","events"],blocks:[{type:"prose",title:"Semantics",body:"At-most-once, at-least-once, exactly-once (usually effective exactly-once via idempotency). Queues (SQS/Rabbit) for task distribution; logs (Kafka) for replayable event streams. Consumer groups, DLQs, ordering keys, and backpressure matter."},{type:"prose",title:"Transactional outbox",body:"Write business row + outbox row in one DB transaction; a publisher relays outbox to the broker. Avoids dual-write races between DB and queue."},{type:"steps",title:"Go service checklist",items:["Idempotent handlers (dedupe keys)","Bounded worker pools","Context deadlines on processing","Metrics: lag, retries, DLQ depth"]}],quiz:[{id:"mq1",prompt:"Transactional outbox primarily solves…",options:["TLS termination","Dual-write inconsistency between DB and message broker","DNS caching","Frontend routing"],answerIndex:1,explanation:"Atomic DB write of state+event, then async publish."}]},{slug:"url-shortener-hld",track:"hld",title:"HLD: URL Shortener",subtitle:"End-to-end design: scale, storage, and redirects.",difficulty:"intermediate",minutes:40,tags:["case-study"],prerequisites:["url-shortener-lld","system-design-foundations"],blocks:[{type:"prose",title:"Scale picture",body:"Redirects are extremely read-heavy. Cache code→URL in Redis + CDN for custom domains. Write path: API → ID service (range-allocated counters) → primary DB. Analytics via async events. Estimate: 100B URLs × ~100 bytes ≈ tens of TB with replication overhead."},{type:"steps",title:"Deep dives to offer",items:["ID generation without global lock (ticket servers / Snowflake)","DB sharding by code hash","Cache invalidation on delete/update","Abuse: spam URLs, rate limits","301 vs 302 SEO/caching implications"]}],quiz:[{id:"ush1",prompt:"Why is redirect path usually cached aggressively?",options:["Writes dominate","Read QPS dominates and mappings are mostly immutable","Caches replace the need for uniqueness","HTTP forbids DB reads"],answerIndex:1,explanation:"Immutable mappings + huge read volume → cache/CDN wins."}]},{slug:"chat-system-hld",track:"hld",title:"HLD: Chat / Messaging",subtitle:"Real-time delivery, fan-out, and storage choices.",difficulty:"advanced",minutes:45,tags:["case-study","realtime"],blocks:[{type:"prose",title:"Core challenges",body:"Persistent connections (WebSocket), presence, online fan-out vs offline push, group chat fan-out (write fan-out vs read fan-out), message ordering per conversation, media via object storage, multi-device sync."},{type:"prose",title:"Fan-out strategies",body:"Write fan-out (push message into each member inbox) helps read-heavy feeds but hurts large groups. Read fan-out (store once, read pulls) scales groups better with more work on read. Hybrid: fan-out for small chats, pull for huge channels."},{type:"steps",title:"Go-centric view",items:["Connection gateway tier holds sockets; sticky sessions or conn-registry","Pub/sub (Redis/NATS/Kafka) bridges gateways","Message service persists then publishes","Push service for offline devices"]}],quiz:[{id:"chat1",prompt:"Large group chats often prefer…",options:["Write fan-out to millions of inboxes per message","Store once and pull / hybrid fan-out","Only email delivery","Single global mutex"],answerIndex:1,explanation:"Avoid exploding writes for huge membership lists."}]},{slug:"rate-limiter-hld",track:"hld",title:"HLD: Distributed Rate Limiting",subtitle:"Global limits across many Go service instances.",difficulty:"advanced",minutes:32,tags:["rate-limit","redis"],prerequisites:["rate-limiter-lld"],blocks:[{type:"prose",title:"Distributed approaches",body:"Central Redis counters / token buckets with Lua for atomicity. Alternative: local limits + global async reconciliation (approximate). Edge gateway enforces coarse limits; services enforce fine-grained per-user quotas. Consistency vs latency trade-off: slightly soft limits often OK."},{type:"steps",title:"Design talk track",items:["Where enforced (CDN, gateway, service)","Accuracy vs speed","Redis hotspot keys — shard by user hash","Fail open vs fail closed on Redis outage"]}],quiz:[{id:"rlh1",prompt:"Redis + Lua is popular for rate limits because…",options:["Lua is required by HTTP","Scripts execute atomically server-side for check-and-decrement","It removes the need for keys","It replaces TLS"],answerIndex:1,explanation:"Atomic scripts avoid racey read-modify-write across clients."}]},{slug:"news-feed-hld",track:"hld",title:"HLD: News Feed",subtitle:"Fan-out, ranking, and timeline storage.",difficulty:"advanced",minutes:40,tags:["case-study","feed"],blocks:[{type:"prose",title:"Timeline design",body:"Push model precomputes feeds on post (good for active users with modest follow graphs). Pull model aggregates at read time (good for celebrities). Hybrid is industry norm. Ranking mixes recency, affinity, and ML features; cache top of feed."},{type:"prose",title:"Storage",body:"Post service owns content. Fan-out workers write feed entries (user_id, post_id, score/ts) into Cassandra/Redis lists. Media in object storage + CDN. Soft deletes and privacy checks at serving time."}],quiz:[{id:"nf1",prompt:"Celebrity posts are hard for pure write fan-out because…",options:["They use UTF-8","Millions of follower inbox writes per post","Caches refuse large images","SQL cannot store text"],answerIndex:1,explanation:"Hybrid systems pull celebrity content instead of exploding fan-out."}]},{slug:"observability-resilience",track:"hld",title:"Observability & Resilience",subtitle:"SLOs, retries, circuit breakers, and graceful degradation.",difficulty:"intermediate",minutes:30,tags:["sre","resilience"],blocks:[{type:"prose",title:"Operate what you design",body:"Golden signals: latency, traffic, errors, saturation. Structured logs + trace IDs (OpenTelemetry) + metrics. Resilience: timeouts, bounded retries with jitter, circuit breakers, bulkheads, deadline propagation via context in Go."},{type:"code",title:"Retry with jitter sketch",language:"go",code:`func DoWithRetry(ctx context.Context, attempts int, fn func(context.Context) error) error {
	var err error
	for i := 0; i < attempts; i++ {
		if err = fn(ctx); err == nil {
			return nil
		}
		delay := time.Duration(math.Pow(2, float64(i))) * 50 * time.Millisecond
		delay += time.Duration(rand.Intn(50)) * time.Millisecond
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(delay):
		}
	}
	return err
}`},{type:"callout",tone:"warn",body:"Retries without jitter amplify incidents. Always cap attempts and honor ctx deadlines."}],quiz:[{id:"or1",prompt:"Deadline propagation in Go services is typically done with…",options:["Global variables","context.Context","GOMAXPROCS","file locks"],answerIndex:1,explanation:"context carries cancellation and deadlines across API boundaries."}]}];n.map(e=>[e.slug,e]),e.s(["allLessons",0,n,"getTrack",0,function(e){return t.find(t=>t.id===e)},"lessonsForTrack",0,function(e){return n.filter(t=>t.track===e)},"searchLessons",0,function(e){let t=e.trim().toLowerCase();return t?n.filter(e=>[e.title,e.subtitle,e.slug,...e.tags,e.track].join(" ").toLowerCase().includes(t)):[]},"tracks",0,t],28499)}]);