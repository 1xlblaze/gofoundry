import type { Lesson } from "./types";

export const dsaLessons: Lesson[] = [
  {
    slug: "arrays-and-slices",
    track: "dsa",
    title: "Arrays & Slices",
    subtitle: "Contiguous memory, capacity growth, and idiomatic Go slice patterns.",
    difficulty: "beginner",
    minutes: 25,
    tags: ["arrays", "slices", "two-pointers"],
    blocks: [
      {
        type: "prose",
        title: "Mental model",
        body: "In Go, an array is a fixed-length value type. A slice is a descriptor over an underlying array: pointer, length, and capacity. Almost all day-to-day work uses slices. Understanding how append reallocates is the difference between O(1) amortized growth and accidental quadratic copies.",
      },
      {
        type: "code",
        title: "Slice descriptor vs underlying array",
        language: "go",
        code: `package main

import "fmt"

func main() {
	a := [5]int{10, 20, 30, 40, 50}
	s := a[1:4] // len=3, cap=4 (from index 1 to end of array)

	fmt.Println(s, len(s), cap(s)) // [20 30 40] 3 4
	s[0] = 99
	fmt.Println(a) // [10 99 30 40 50] — shared backing array
}`,
      },
      {
        type: "prose",
        title: "Two-pointer patterns",
        body: "Many array problems become clean with left/right indices: reverse in place, pair-sum on a sorted slice, partition around a pivot, or remove duplicates in O(1) extra space.",
      },
      {
        type: "code",
        title: "In-place reverse + remove duplicates",
        language: "go",
        code: `func reverse(nums []int) {
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
}`,
      },
      {
        type: "complexity",
        time: "O(n) for linear scans / two-pointers",
        space: "O(1) extra when mutating in place; O(n) if you copy",
        notes: "append may allocate; pre-size with make([]T, 0, n) when you know the bound.",
      },
      {
        type: "callout",
        tone: "warn",
        body: "Slicing does not copy. Passing s[i:j] to a function that mutates elements will mutate the caller's backing array unless you copy first.",
      },
      {
        type: "steps",
        title: "Practice set",
        items: [
          "Two Sum II (sorted input) with two pointers",
          "Move Zeroes in place",
          "Rotate Array with reverse-reverse trick",
          "Product of Array Except Self without division",
        ],
      },
    ],
    quiz: [
      {
        id: "arr1",
        prompt: "What does a Go slice store?",
        options: [
          "Only a pointer to the first element",
          "Pointer, length, and capacity",
          "A deep copy of the underlying array",
          "Length only; capacity is computed at runtime",
        ],
        answerIndex: 1,
        explanation: "A slice header is {ptr, len, cap}. The elements live in a separate backing array.",
      },
      {
        id: "arr2",
        prompt: "Why can repeated append be amortized O(1) per element?",
        options: [
          "Go preallocates infinite capacity",
          "Capacity grows geometrically, so total copies across n appends are O(n)",
          "append never copies",
          "The garbage collector removes old arrays instantly",
        ],
        answerIndex: 1,
        explanation: "Geometric growth means each element is copied a constant number of times on average.",
      },
    ],
  },
  {
    slug: "strings-and-runes",
    track: "dsa",
    title: "Strings & Runes",
    subtitle: "UTF-8 bytes vs runes, sliding windows, and frequency maps.",
    difficulty: "beginner",
    minutes: 22,
    tags: ["strings", "utf-8", "hashmap"],
    blocks: [
      {
        type: "prose",
        title: "Bytes are not characters",
        body: "A Go string is an immutable sequence of bytes, usually UTF-8. Indexing s[i] yields a byte. Ranging with for _, r := range s yields runes (code points). For DSA interviews, clarify whether the alphabet is ASCII; that unlocks O(1) arrays of size 26/128/256.",
      },
      {
        type: "code",
        title: "Anagram check + longest substring without repeating chars",
        language: "go",
        code: `func isAnagram(a, b string) bool {
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
}`,
      },
      {
        type: "complexity",
        time: "O(n) for sliding window / frequency scans",
        space: "O(k) where k is alphabet size (or distinct chars)",
      },
      {
        type: "callout",
        tone: "tip",
        body: "Prefer []byte(s) when you need mutation, then string(buf). Avoid concatenating strings in a loop — use strings.Builder.",
      },
    ],
    quiz: [
      {
        id: "str1",
        prompt: "What does s[i] return for a string s?",
        options: ["A rune", "A byte", "A string of length 1", "A UTF-8 grapheme cluster"],
        answerIndex: 1,
        explanation: "Indexing returns a byte. Use range or utf8.DecodeRuneInString for runes.",
      },
    ],
  },
  {
    slug: "linked-lists",
    track: "dsa",
    title: "Linked Lists",
    subtitle: "Dummy heads, fast/slow pointers, reversal, and cycle detection.",
    difficulty: "beginner",
    minutes: 28,
    tags: ["linked-list", "pointers"],
    blocks: [
      {
        type: "prose",
        title: "When lists win",
        body: "Linked lists shine for O(1) insert/delete given a node reference and for interview mechanics (pointer rewiring). In Go production code, slices usually win on cache locality — but list problems train pointer fluency you need for trees and graphs.",
      },
      {
        type: "code",
        title: "Reverse list + detect cycle (Floyd)",
        language: "go",
        code: `type ListNode struct {
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
}`,
      },
      {
        type: "complexity",
        time: "O(n)",
        space: "O(1) for iterative reverse / Floyd; O(n) recursion depth if recursive",
      },
      {
        type: "callout",
        tone: "tip",
        body: "Always reach for a dummy (sentinel) node when the head may change — merge, remove-nth-from-end, partition.",
      },
    ],
    quiz: [
      {
        id: "ll1",
        prompt: "Floyd’s cycle detection uses which idea?",
        options: [
          "Hash all visited nodes",
          "Slow moves 1, fast moves 2; they meet iff a cycle exists",
          "Binary search on list length",
          "Reverse the list twice",
        ],
        answerIndex: 1,
        explanation: "If a cycle exists, the faster pointer eventually laps the slower one inside the loop.",
      },
    ],
  },
  {
    slug: "stacks-and-queues",
    track: "dsa",
    title: "Stacks & Queues",
    subtitle: "Monotonic stacks, BFS queues, and Go slice-backed implementations.",
    difficulty: "beginner",
    minutes: 24,
    tags: ["stack", "queue", "monotonic"],
    blocks: [
      {
        type: "prose",
        title: "Idiomatic Go",
        body: "Use a slice as a stack (append / pop last). For queues, a slice with a head index works for interviews; for production hot paths prefer container/list or a ring buffer to avoid unbounded growth from a shrinking front.",
      },
      {
        type: "code",
        title: "Valid parentheses + next greater element",
        language: "go",
        code: `func isValid(s string) bool {
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
}`,
      },
      {
        type: "complexity",
        time: "O(n) amortized for monotonic stack (each index pushed/popped once)",
        space: "O(n)",
      },
    ],
    quiz: [
      {
        id: "sq1",
        prompt: "A monotonic increasing stack is typically used to find…",
        options: [
          "Shortest path in a graph",
          "Next smaller / previous smaller elements efficiently",
          "Strongly connected components",
          "Median of a stream",
        ],
        answerIndex: 1,
        explanation: "Maintaining order on the stack lets you resolve nearest smaller/greater queries in amortized O(1).",
      },
    ],
  },
  {
    slug: "hash-maps-and-sets",
    track: "dsa",
    title: "Hash Maps & Sets",
    subtitle: "Frequency counting, indexing, and average O(1) trade-offs in Go maps.",
    difficulty: "beginner",
    minutes: 20,
    tags: ["hashmap", "set"],
    blocks: [
      {
        type: "prose",
        title: "The interview Swiss army knife",
        body: "Maps turn many O(n²) scans into O(n). In Go, map[K]V is unordered; never rely on iteration order. For sets, use map[T]struct{} to avoid wasting a bool per key.",
      },
      {
        type: "code",
        title: "Two Sum + group anagrams",
        language: "go",
        code: `func twoSum(nums []int, target int) []int {
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
}`,
      },
      {
        type: "callout",
        tone: "note",
        body: "Average O(1) ≠ worst O(1). Pathological hash collisions exist in theory; Go’s map randomizes seeds per map to harden against collision attacks.",
      },
    ],
    quiz: [
      {
        id: "hm1",
        prompt: "Preferred empty-set value type in Go?",
        options: ["map[T]bool", "map[T]struct{}", "map[T]int", "[]T with linear search"],
        answerIndex: 1,
        explanation: "struct{} has zero size; presence is enough for a set.",
      },
    ],
  },
  {
    slug: "binary-trees",
    track: "dsa",
    title: "Binary Trees",
    subtitle: "DFS, BFS, recursion trees, and divide-and-conquer on hierarchies.",
    difficulty: "intermediate",
    minutes: 32,
    tags: ["trees", "dfs", "bfs"],
    blocks: [
      {
        type: "prose",
        title: "Traversal catalog",
        body: "Preorder (root-left-right) serializes structure. Inorder on a BST yields sorted order. Postorder cleans up children first. Level-order (BFS) discovers depth layers — the queue pattern reappears in graphs.",
      },
      {
        type: "code",
        title: "Max depth, invert, level order",
        language: "go",
        code: `type TreeNode struct {
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
}`,
      },
      {
        type: "complexity",
        time: "O(n) — each node visited once",
        space: "O(h) recursion / O(w) BFS queue (h=height, w=max width)",
      },
    ],
    quiz: [
      {
        id: "bt1",
        prompt: "Inorder traversal of a BST produces…",
        options: ["Random order", "Level order", "Sorted ascending values", "Only leaves"],
        answerIndex: 2,
        explanation: "BST inorder visits left subtree, node, right subtree — sorted order.",
      },
    ],
  },
  {
    slug: "bst-and-heaps",
    track: "dsa",
    title: "BSTs & Heaps",
    subtitle: "Ordered trees, priority queues, and top-K patterns in Go.",
    difficulty: "intermediate",
    minutes: 30,
    tags: ["bst", "heap", "topk"],
    blocks: [
      {
        type: "prose",
        title: "Order statistics vs priorities",
        body: "A BST supports ordered operations (predecessor, range queries). A binary heap supports peek-min/max in O(1) and insert/pop in O(log n). In Go, implement heap.Interface from container/heap for interview-grade priority queues.",
      },
      {
        type: "code",
        title: "Min-heap of ints + Kth largest stream sketch",
        language: "go",
        code: `type intHeap []int

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
}`,
      },
      {
        type: "callout",
        tone: "tip",
        body: "For top-K largest, keep a min-heap of size K. For top-K smallest, keep a max-heap of size K.",
      },
    ],
    quiz: [
      {
        id: "bh1",
        prompt: "Insert into a binary heap is typically…",
        options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
        answerIndex: 1,
        explanation: "Bubble-up along the tree height is O(log n).",
      },
    ],
  },
  {
    slug: "graphs-bfs-dfs",
    track: "dsa",
    title: "Graphs — BFS & DFS",
    subtitle: "Adjacency lists, visited sets, connected components, and grid DFS.",
    difficulty: "intermediate",
    minutes: 35,
    tags: ["graphs", "bfs", "dfs"],
    blocks: [
      {
        type: "prose",
        title: "Representation first",
        body: "Prefer adjacency lists: map[int][]int or [][]int. BFS finds shortest paths in unweighted graphs. DFS explores components, detects cycles (with colors/recursion stack), and enables topological thinking.",
      },
      {
        type: "code",
        title: "Number of islands + BFS shortest path length",
        language: "go",
        code: `func numIslands(grid [][]byte) int {
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
}`,
      },
      {
        type: "complexity",
        time: "O(V + E)",
        space: "O(V) for visited / queue / recursion",
      },
    ],
    quiz: [
      {
        id: "g1",
        prompt: "BFS on an unweighted graph yields…",
        options: [
          "Minimum spanning tree",
          "Shortest path in number of edges",
          "Strongly connected components",
          "Topological order always",
        ],
        answerIndex: 1,
        explanation: "Each edge has weight 1; first time you reach a node is via fewest edges.",
      },
    ],
  },
  {
    slug: "graphs-advanced",
    track: "dsa",
    title: "Graphs — Dijkstra, Topo, Union-Find",
    subtitle: "Weighted shortest paths, dependency ordering, and disjoint sets.",
    difficulty: "advanced",
    minutes: 40,
    tags: ["dijkstra", "topo", "union-find"],
    prerequisites: ["graphs-bfs-dfs"],
    blocks: [
      {
        type: "prose",
        title: "Pick the right hammer",
        body: "Dijkstra: non-negative weights, priority queue. Topological sort: DAGs / course schedule. Union-Find (DSU): connectivity, Kruskal MST, redundant connection — nearly O(1) per op with path compression + union by rank.",
      },
      {
        type: "code",
        title: "Union-Find + Kahn topological sort",
        language: "go",
        code: `type DSU struct {
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
}`,
      },
      {
        type: "complexity",
        time: "Topo O(V+E); DSU ~O(α(n)) per op; Dijkstra O((V+E) log V) with binary heap",
        space: "O(V+E)",
      },
    ],
    quiz: [
      {
        id: "ga1",
        prompt: "Union-Find is a poor fit for…",
        options: [
          "Detecting whether two nodes are connected",
          "Building an MST with Kruskal",
          "Finding shortest paths with weights",
          "Checking redundant edges in an undirected graph",
        ],
        answerIndex: 2,
        explanation: "DSU tracks components, not distances. Use Dijkstra/Bellman-Ford for shortest paths.",
      },
    ],
  },
  {
    slug: "recursion-backtracking",
    track: "dsa",
    title: "Recursion & Backtracking",
    subtitle: "State trees, choose/explore/unchoose, and pruning.",
    difficulty: "intermediate",
    minutes: 30,
    tags: ["recursion", "backtracking"],
    blocks: [
      {
        type: "prose",
        title: "The template",
        body: "Backtracking builds candidates incrementally and abandons a candidate as soon as it cannot lead to a valid solution. Classic Go interview set: subsets, permutations, combination sum, N-Queens, word search.",
      },
      {
        type: "code",
        title: "Subsets + combination sum",
        language: "go",
        code: `func subsets(nums []int) [][]int {
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
}`,
      },
      {
        type: "callout",
        tone: "warn",
        body: "When appending cur to results, copy it: append([]int{}, cur...). Otherwise every result shares the same backing array.",
      },
    ],
    quiz: [
      {
        id: "rb1",
        prompt: "Backtracking differs from plain recursion mainly by…",
        options: [
          "Never using a call stack",
          "Undoing choices (unchoose) after exploring a branch",
          "Only working on trees",
          "Guaranteeing O(n) time",
        ],
        answerIndex: 1,
        explanation: "The choose → explore → unchoose cycle reuses one path buffer across branches.",
      },
    ],
  },
  {
    slug: "dynamic-programming",
    track: "dsa",
    title: "Dynamic Programming",
    subtitle: "Overlapping subproblems, optimal substructure, and bottom-up tables in Go.",
    difficulty: "advanced",
    minutes: 45,
    tags: ["dp", "memoization"],
    blocks: [
      {
        type: "prose",
        title: "How to invent a DP",
        body: "1) Define state clearly (what indices / remaining capacity mean). 2) Write the recurrence. 3) Identify base cases. 4) Decide top-down memo vs bottom-up. 5) Optimize space if only prior rows/cols matter. Patterns: 1D climb/house-robber, 0/1 knapsack, unbounded knapsack, LCS/edit distance, interval DP, digit DP (advanced).",
      },
      {
        type: "code",
        title: "Climb stairs, knapsack 0/1, coin change",
        language: "go",
        code: `func climbStairs(n int) int {
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
}`,
      },
      {
        type: "complexity",
        time: "Depends on state space — e.g. coin change O(amount * |coins|)",
        space: "Often reducible from O(n*W) to O(W)",
      },
    ],
    quiz: [
      {
        id: "dp1",
        prompt: "DP requires which pair of properties?",
        options: [
          "Greedy choice and matroid structure",
          "Overlapping subproblems and optimal substructure",
          "Sorted input and two pointers",
          "Immutable graphs only",
        ],
        answerIndex: 1,
        explanation: "You reuse solutions to subproblems that combine into an optimal global answer.",
      },
    ],
  },
  {
    slug: "sliding-window-two-pointers",
    track: "dsa",
    title: "Sliding Window & Two Pointers",
    subtitle: "Subarray/substring constraints without O(n²) restarts.",
    difficulty: "intermediate",
    minutes: 26,
    tags: ["sliding-window", "two-pointers"],
    blocks: [
      {
        type: "prose",
        title: "Fixed vs variable window",
        body: "Fixed window: maintain sum/product of k elements. Variable window: expand right, shrink left while invariant broken (at most K distinct, sum ≤ target, etc.). Same-direction two pointers often equal a sliding window.",
      },
      {
        type: "code",
        title: "Min window substring (ASCII) + max sum subarray of size k",
        language: "go",
        code: `func maxSumSubarray(nums []int, k int) int {
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
}`,
      },
    ],
    quiz: [
      {
        id: "sw1",
        prompt: "Variable sliding window shrinks the left pointer when…",
        options: [
          "The array is unsorted",
          "The current window violates the problem invariant",
          "BFS finishes a level",
          "A heap overflows",
        ],
        answerIndex: 1,
        explanation: "Expand to include new candidates; shrink until the window is valid again.",
      },
    ],
  },
  {
    slug: "sorting-searching",
    track: "dsa",
    title: "Sorting & Binary Search",
    subtitle: "sort package, custom order, and search on answer space.",
    difficulty: "intermediate",
    minutes: 28,
    tags: ["sorting", "binary-search"],
    blocks: [
      {
        type: "prose",
        title: "Binary search beyond arrays",
        body: "Besides finding a value, binary search works on monotonic predicates: minimize capacity to ship packages, maximize mid-distance between cows, lower_bound on answer space. In Go use sort.Slice and sort.Search.",
      },
      {
        type: "code",
        title: "sort.Search lower bound + search on answer",
        language: "go",
        code: `func lowerBound(a []int, target int) int {
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
}`,
      },
      {
        type: "complexity",
        time: "Binary search O(log R * cost(check)); sorting O(n log n)",
        space: "Usually O(1) extra for iterative search",
      },
    ],
    quiz: [
      {
        id: "ss1",
        prompt: "sort.Search returns the smallest index i where f(i) is true, assuming…",
        options: [
          "f is random",
          "f is false for a prefix then true afterward (monotonic)",
          "The slice is a max-heap",
          "i must be a power of two",
        ],
        answerIndex: 1,
        explanation: "Binary search requires a monotonic predicate.",
      },
    ],
  },
  {
    slug: "tries-and-bitmask",
    track: "dsa",
    title: "Tries & Bit Manipulation",
    subtitle: "Prefix trees, bitmask DP starters, and bit tricks in Go.",
    difficulty: "advanced",
    minutes: 30,
    tags: ["trie", "bits"],
    blocks: [
      {
        type: "prose",
        title: "Prefixes and bits",
        body: "Tries (prefix trees) accelerate autocomplete and word-break style problems. Bit tricks: x&-x isolates lowest set bit; XOR finds unique numbers; bitmasks represent subsets when n ≤ 20.",
      },
      {
        type: "code",
        title: "Trie insert/search + single-number XOR",
        language: "go",
        code: `type TrieNode struct {
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
}`,
      },
    ],
    quiz: [
      {
        id: "tb1",
        prompt: "XOR of a number with itself is…",
        options: ["The number", "1", "0", "Undefined"],
        answerIndex: 2,
        explanation: "x^x = 0, which is why XOR cancels pairs.",
      },
    ],
  },
]
