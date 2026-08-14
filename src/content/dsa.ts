import type {
  ContentBlock,
  DiagramKind,
  Difficulty,
  Lesson,
  QuizQuestion,
} from "./types";

type Implementation = {
  title: string;
  code: string;
};

type DsaLessonConfig = {
  slug: string;
  title: string;
  subtitle: string;
  difficulty: Difficulty;
  minutes: number;
  tags: string[];
  prerequisites?: string[];
  clarify: string[];
  model: string[];
  mentalModel: string;
  invariant: string;
  diagram?: { kind: DiagramKind; title: string; caption: string };
  implementations: Implementation[];
  time: string;
  space: string;
  complexityNotes: string;
  dryRun: string[];
  pitfalls: string[];
  recognition: string;
  answer: { opening: string; beats: string[]; closing: string };
  quiz: QuizQuestion[];
};

const q = (
  id: string,
  prompt: string,
  correct: string,
  wrong: [string, string, string],
  explanation: string,
): QuizQuestion => {
  const options = [correct, ...wrong];
  let seed = 0;
  for (let i = 0; i < id.length; i++) seed = (seed * 31 + id.charCodeAt(i)) >>> 0;
  for (let i = options.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const j = seed % (i + 1);
    const tmp = options[i]!;
    options[i] = options[j]!;
    options[j] = tmp;
  }
  return {
    id,
    prompt,
    options,
    answerIndex: options.indexOf(correct),
    explanation,
  };
};

const makeDsaLesson = (config: DsaLessonConfig): Lesson => {
  const blocks: ContentBlock[] = [
    {
      type: "think",
      title: "HEAT · Think before typing",
      clarify: config.clarify,
      model: config.model,
      pitfalls: config.pitfalls,
    },
  ];

  if (config.diagram) {
    blocks.push({
      type: "diagram",
      title: config.diagram.title,
      kind: config.diagram.kind,
      caption: config.diagram.caption,
    });
  }

  blocks.push(
    {
      type: "prose",
      title: "Mental model and invariant",
      body: `${config.mentalModel}\n\nInvariant: ${config.invariant}`,
    },
    ...config.implementations.map(
      (implementation): ContentBlock => ({
        type: "code",
        title: implementation.title,
        language: "go",
        code: implementation.code,
      }),
    ),
    {
      type: "complexity",
      time: config.time,
      space: config.space,
      notes: config.complexityNotes,
    },
    {
      type: "steps",
      title: "Concrete dry run",
      items: config.dryRun,
    },
    {
      type: "callout",
      tone: "warn",
      body: `Edge cases and pitfalls: ${config.pitfalls.join(" · ")}`,
    },
    {
      type: "prose",
      title: "Pattern recognition — when to reach for this",
      body: config.recognition,
    },
    {
      type: "answer",
      title: "HEAT · Interview answer",
      opening: config.answer.opening,
      beats: config.answer.beats,
      closing: config.answer.closing,
    },
  );

  return {
    slug: config.slug,
    track: "dsa",
    title: config.title,
    subtitle: config.subtitle,
    difficulty: config.difficulty,
    minutes: config.minutes,
    tags: config.tags,
    prerequisites: config.prerequisites,
    blocks,
    quiz: config.quiz,
  };
};

export const dsaLessons: Lesson[] = [
  makeDsaLesson({
    slug: "arrays-and-slices",
    title: "Arrays & Slices",
    subtitle: "Backing arrays, aliasing, prefix state, and in-place pointer patterns.",
    difficulty: "beginner",
    minutes: 45,
    tags: ["arrays", "slices", "two-pointers", "prefix-sum"],
    clarify: [
      "May I mutate the input, and must relative order be preserved?",
      "Is the data sorted, bounded, or large enough that allocation matters?",
      "Should the result share storage with the input or own a defensive copy?",
    ],
    model: [
      "A Go slice is a pointer-length-capacity descriptor over a backing array.",
      "Translate nested scans into maintained state: two pointers, a write index, or a prefix sum.",
      "State what the processed prefix means before moving an index.",
    ],
    mentalModel:
      "Arrays own fixed-size storage and are copied on assignment; slices describe part of an array. Element writes through either alias are visible to both. append writes into spare capacity when possible and otherwise allocates a new array, so an alias may unexpectedly stop sharing. Algorithmically, indices are cheap state: opposite pointers exploit order, read/write pointers compact data, and prefix sums turn a range sum into subtraction.",
    invariant:
      "For compaction, nums[:write] is exactly the valid, final output built from nums[:read]. For opposite pointers on sorted data, every discarded pair is provably too small or too large.",
    diagram: {
      kind: "two-pointers",
      title: "Read/write and opposite-pointer motion",
      caption: "Pointers move only after the current invariant proves an index cannot improve the answer.",
    },
    implementations: [
      {
        title: "Brute force: pair sum with all index pairs",
        code: `func twoSumBrute(nums []int, target int) [2]int {
	for i := 0; i < len(nums); i++ {
		for j := i + 1; j < len(nums); j++ {
			if nums[i]+nums[j] == target {
				return [2]int{i, j}
			}
		}
	}
	return [2]int{-1, -1}
}`,
      },
      {
        title: "Optimal on sorted input: converging pointers",
        code: `func twoSumSorted(nums []int, target int) [2]int {
	left, right := 0, len(nums)-1
	for left < right {
		sum := nums[left] + nums[right]
		switch {
		case sum == target:
			return [2]int{left, right}
		case sum < target:
			left++ // any pair using the old left is too small
		default:
			right-- // any pair using the old right is too large
		}
	}
	return [2]int{-1, -1}
}

func removeDuplicates(nums []int) int {
	if len(nums) == 0 {
		return 0
	}
	write := 1
	for read := 1; read < len(nums); read++ {
		if nums[read] != nums[write-1] {
			nums[write] = nums[read]
			write++
		}
	}
	return write
}`,
      },
      {
        title: "Variant: immutable range sums with a prefix array",
        code: `func prefixSums(nums []int) []int64 {
	prefix := make([]int64, len(nums)+1)
	for i, value := range nums {
		prefix[i+1] = prefix[i] + int64(value)
	}
	return prefix
}

// rangeSum returns the inclusive sum nums[left:right+1].
func rangeSum(prefix []int64, left, right int) int64 {
	return prefix[right+1] - prefix[left]
}`,
      },
    ],
    time: "Brute pair search O(n²); sorted two pointers O(n); prefix build O(n) and each query O(1)",
    space: "O(1) for in-place pointers; O(n) for prefix sums or a defensive copy",
    complexityNotes:
      "append is amortized O(1), not worst-case O(1). Preallocate when the output bound is known, and use int64 for sums that may exceed int.",
    dryRun: [
      "For sorted [1, 2, 4, 6, 10], target 8: left=1 and right=10 give 11, so discard 10 by moving right.",
      "1+6=7 is too small, so discard 1 by moving left; 2+6=8 returns indices (1,3).",
      "For compaction [1,1,2,2,3], write starts at 1; reads of 2 and 3 write to positions 1 and 2, yielding valid prefix [1,2,3].",
    ],
    pitfalls: [
      "Slicing does not copy; append may or may not detach from the original backing array",
      "len(nums)-1 is -1 for an empty slice, so loops and indexing must guard emptiness",
      "Two-pointer elimination requires sorted data or another monotonic property",
    ],
    recognition:
      "Reach for arrays and pointer invariants when the prompt says in place, sorted pair, partition, deduplicate, move zeroes, rotate, contiguous range, or many immutable range-sum queries. Ask whether order lets one index eliminate many candidates; if not, a hash map may be the right optimization.",
    answer: {
      opening:
        "I will clarify mutability and sortedness, then use the weakest extra state that preserves a precise processed-prefix invariant.",
      beats: [
        "Explain slice aliasing before promising O(1) space.",
        "Show the O(n²) baseline and identify repeated comparisons.",
        "Use sortedness to justify exactly which pointer moves; do not say merely that it feels right.",
        "Dry-run empty, duplicate-only, no-solution, and overflow-sensitive inputs.",
      ],
      closing: "The optimal scan is O(n) time and O(1) extra space because each pointer advances at most n times.",
    },
    quiz: [
      q("arr-1", "What does a slice value contain?", "A pointer, length, and capacity", ["All elements inline", "Only a pointer", "A deep copy"], "Correct answer: A pointer, length, and capacity. The other options confuse related ideas or skip a key constraint."),
      q("arr-2", "Why may a two-pointer solution move left when a sorted pair sum is too small?", "Every pair using the current smallest left value and an index no larger than right is also too small", ["left must always alternate with right", "append requires it", "It makes the array sorted"], "Correct answer: Every pair using the current smallest left value and an index no larger than right is also too small. The other options confuse related ideas or skip a key constraint."),
      q("arr-3", "What is the safest type for large accumulated integer sums?", "int64 when constraints can exceed int range", ["byte", "rune", "bool"], "Correct answer: int64 when constraints can exceed int range. The other options confuse related ideas or skip a key constraint."),
      q("arr-4", "What does prefix[right+1]-prefix[left] represent?", "The inclusive range sum from left through right", ["Only nums[right]", "The total array sum", "The range length"], "Correct answer: The inclusive range sum from left through right. The other options confuse related ideas or skip a key constraint."),
    ],
  }),
  makeDsaLesson({
    slug: "bst-and-heaps",
    title: "BSTs & Heaps",
    subtitle: "Ordered search trees, priority invariants, and streaming top-K.",
    difficulty: "intermediate",
    minutes: 50,
    tags: ["bst", "heap", "priority-queue", "top-k"],
    prerequisites: ["binary-trees"],
    clarify: [
      "Do I need total sorted order, only the current minimum or maximum, or the kth boundary?",
      "Is the BST guaranteed balanced, and what is the duplicate-key policy?",
      "Is input streaming, so sorting the complete collection is impossible or wasteful?",
    ],
    model: [
      "A BST partitions all keys by value; a heap only relates parents to children.",
      "A size-k min-heap remembers the k largest values seen, with the kth largest at its root.",
      "Heap array children are 2i+1 and 2i+2; bubble only along one root-to-leaf path.",
    ],
    mentalModel:
      "A binary search tree supports ordered lookup and range traversal because every left key precedes the node and every right key follows it. Its operations are O(h), which is O(log n) only when balanced. A heap is a complete tree represented compactly in an array; it deliberately gives up arbitrary search to make root priority updates O(log n). Use a BST for predecessor, successor, and ranges; use a heap for repeated best-next extraction.",
    invariant:
      "Every BST subtree obeys inherited lower and upper bounds. In a min-heap, each parent is no greater than either child. In a size-k top-K heap, the heap contains exactly the k largest processed values and its root is their minimum.",
    diagram: {
      kind: "heap-shape",
      title: "Complete tree encoded as an array",
      caption: "Only the root is globally minimal; siblings and cousins are not sorted.",
    },
    implementations: [
      {
        title: "Core BST: validate with strict inherited bounds",
        code: `func validBST(root *TreeNode) bool {
	var check func(*TreeNode, int64, int64) bool
	check = func(node *TreeNode, lower, upper int64) bool {
		if node == nil {
			return true
		}
		value := int64(node.Val)
		if value <= lower || value >= upper {
			return false
		}
		return check(node.Left, lower, value) &&
			check(node.Right, value, upper)
	}
	return check(root, math.MinInt64, math.MaxInt64)
}

func kthSmallest(root *TreeNode, k int) (int, bool) {
	stack := []*TreeNode{}
	for root != nil || len(stack) > 0 {
		for root != nil {
			stack = append(stack, root)
			root = root.Left
		}
		root = stack[len(stack)-1]
		stack = stack[:len(stack)-1]
		k--
		if k == 0 {
			return root.Val, true
		}
		root = root.Right
	}
	return 0, false
}`,
      },
      {
        title: "Core heap: kth largest in a stream",
        code: `type IntMinHeap []int

func (h IntMinHeap) Len() int           { return len(h) }
func (h IntMinHeap) Less(i, j int) bool { return h[i] < h[j] }
func (h IntMinHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }
func (h *IntMinHeap) Push(x any)        { *h = append(*h, x.(int)) }
func (h *IntMinHeap) Pop() any {
	old := *h
	value := old[len(old)-1]
	*h = old[:len(old)-1]
	return value
}

func kthLargest(nums []int, k int) (int, bool) {
	if k <= 0 || k > len(nums) {
		return 0, false
	}
	h := &IntMinHeap{}
	heap.Init(h)
	for _, value := range nums {
		heap.Push(h, value)
		if h.Len() > k {
			heap.Pop(h)
		}
	}
	return (*h)[0], true
}`,
      },
      {
        title: "Variant: merge sorted streams with heap items",
        code: `type streamItem struct{ value, list, index int }
type streamHeap []streamItem

func mergeSortedLists(lists [][]int) []int {
	h := &streamHeap{}
	heap.Init(h) // streamHeap implements heap.Interface by value
	for list := range lists {
		if len(lists[list]) > 0 {
			heap.Push(h, streamItem{lists[list][0], list, 0})
		}
	}
	result := []int{}
	for h.Len() > 0 {
		item := heap.Pop(h).(streamItem)
		result = append(result, item.value)
		next := item.index + 1
		if next < len(lists[item.list]) {
			heap.Push(h, streamItem{lists[item.list][next], item.list, next})
		}
	}
	return result
}

// Len, Less, Swap, Push, and Pop for streamHeap follow IntMinHeap,
// with Less comparing item.value.`,
      },
    ],
    time: "Balanced BST operations O(log n), worst O(n); top-K O(n log k); k-way merge O(N log k)",
    space: "O(h) traversal stack; O(k) heap for top-K or k input streams",
    complexityNotes:
      "Building a heap from n existing items with heap.Init is O(n), while n independent pushes are O(n log n). container/heap is a min-heap unless Less is reversed.",
    dryRun: [
      "For values [3,2,1,5,6,4] and k=2, heap evolves [3], [2,3], then discards 1 and keeps [2,3].",
      "Reading 5 pushes three candidates then pops 2, leaving {3,5}; reading 6 leaves {5,6}; reading 4 is discarded.",
      "The root is 5, the second largest. It is not the global minimum—only the minimum among the two retained largest values.",
    ],
    pitfalls: [
      "Checking only each BST node against its immediate children misses violations deeper in a subtree",
      "A heap is not globally sorted, so searching an arbitrary value is O(n)",
      "Top-K largest needs a min-heap of size k; using a max-heap retains the wrong boundary",
    ],
    recognition:
      "Reach for a BST when the prompt needs dynamic ordered membership, ranges, predecessor, or kth order with augmented subtree sizes. Reach for a heap when it says repeatedly choose smallest/largest, top K, merge K sorted sources, scheduler, median stream, or shortest weighted frontier.",
    answer: {
      opening:
        "I will separate full-order requirements from best-next requirements: a BST preserves ranges, while a heap preserves only the root priority.",
      beats: [
        "State the exact invariant and whether balance is guaranteed.",
        "For top K, explain why the opposite heap type exposes the discard boundary.",
        "Validate k and empty input before reading the root.",
        "Give complexity in terms of n, tree height h, and retained heap size k.",
      ],
      closing: "Keeping only k candidates reduces both update cost and memory from n to k.",
    },
    quiz: [
      q("bh-1", "Is every heap array globally sorted?", "No; only parent-child priority is guaranteed", ["Yes, ascending", "Yes, level by level", "Only after every push"], "Correct answer: No; only parent-child priority is guaranteed. The other options confuse related ideas or skip a key constraint."),
      q("bh-2", "What heap finds the kth largest with k retained items?", "A min-heap of size k", ["A max-heap of size n", "No heap can", "A FIFO queue"], "Correct answer: A min-heap of size k. The other options confuse related ideas or skip a key constraint."),
      q("bh-3", "Why validate a BST with inherited bounds?", "Ancestor constraints apply to every descendant", ["It balances the tree", "It detects graph cycles", "It reduces storage"], "Correct answer: Ancestor constraints apply to every descendant. The other options confuse related ideas or skip a key constraint."),
      q("bh-4", "What is heap.Init complexity for n items?", "O(n)", ["O(log n)", "O(n log n) necessarily", "O(1)"], "Correct answer: O(n). The other options confuse related ideas or skip a key constraint."),
    ],
  }),
  makeDsaLesson({
    slug: "graphs-bfs-dfs",
    title: "Graphs — BFS & DFS",
    subtitle: "Representations, visited timing, components, grids, and unweighted paths.",
    difficulty: "intermediate",
    minutes: 50,
    tags: ["graph", "bfs", "dfs", "grid"],
    clarify: [
      "Directed or undirected, weighted or unweighted, and can vertices be disconnected?",
      "Do I need reachability, component count, an actual path, or minimum edge count?",
      "May I mutate a grid to mark visited, and can recursion depth reach V?",
    ],
    model: [
      "An adjacency list stores only existing edges and usually costs O(V+E).",
      "Visited means discovered, not necessarily finished; mark before adding to the frontier.",
      "A grid is an implicit graph whose neighbor function enforces bounds and terrain rules.",
    ],
    mentalModel:
      "Graph traversal grows a frontier from seed vertices. DFS fully explores one branch and naturally exposes components and recursive structure. BFS explores by layers, so the first discovery of a vertex uses the fewest edges in an unweighted graph. Unlike trees, graphs can cycle and can be disconnected, so traversal needs visited state and sometimes an outer loop over all vertices.",
    invariant:
      "Every discovered vertex is marked exactly once. In BFS, all dequeued vertices have finalized minimum unweighted distance; in DFS, a frame owns exploration of all reachable unvisited descendants.",
    diagram: {
      kind: "bfs-levels",
      title: "BFS distance layers",
      caption: "The FIFO frontier completes distance d before processing distance d+1.",
    },
    implementations: [
      {
        title: "Core BFS: shortest unweighted path with reconstruction",
        code: `func shortestPath(graph [][]int, source, target int) []int {
	parent := make([]int, len(graph))
	for i := range parent {
		parent[i] = -2 // undiscovered
	}
	parent[source] = -1
	queue := []int{source}
	for head := 0; head < len(queue); head++ {
		node := queue[head]
		if node == target {
			break
		}
		for _, next := range graph[node] {
			if parent[next] != -2 {
				continue
			}
			parent[next] = node
			queue = append(queue, next)
		}
	}
	if parent[target] == -2 {
		return nil
	}
	path := []int{}
	for node := target; node != -1; node = parent[node] {
		path = append(path, node)
	}
	slices.Reverse(path)
	return path
}`,
      },
      {
        title: "Core DFS: count islands in an implicit grid graph",
        code: `func countIslands(grid [][]byte) int {
	if len(grid) == 0 {
		return 0
	}
	rows, cols := len(grid), len(grid[0])
	directions := [][2]int{{1, 0}, {-1, 0}, {0, 1}, {0, -1}}
	var visit func(int, int)
	visit = func(row, col int) {
		if row < 0 || row >= rows || col < 0 || col >= cols ||
			grid[row][col] != '1' {
			return
		}
		grid[row][col] = '0'
		for _, d := range directions {
			visit(row+d[0], col+d[1])
		}
	}
	islands := 0
	for row := 0; row < rows; row++ {
		for col := 0; col < cols; col++ {
			if grid[row][col] == '1' {
				islands++
				visit(row, col)
			}
		}
	}
	return islands
}`,
      },
      {
        title: "Variant: iterative connected components",
        code: `func components(graph [][]int) int {
	visited := make([]bool, len(graph))
	count := 0
	for start := range graph {
		if visited[start] {
			continue
		}
		count++
		stack := []int{start}
		visited[start] = true
		for len(stack) > 0 {
			last := len(stack) - 1
			node := stack[last]
			stack = stack[:last]
			for _, next := range graph[node] {
				if !visited[next] {
					visited[next] = true
					stack = append(stack, next)
				}
			}
		}
	}
	return count
}`,
      },
    ],
    time: "Adjacency-list BFS and DFS O(V+E); an r×c grid traversal O(rc)",
    space: "O(V) visited/frontier; O(rc) worst-case recursion or frontier for a grid",
    complexityNotes:
      "For an undirected adjacency list each edge appears twice, but O(V+2E) simplifies to O(V+E). Building a dense adjacency matrix costs O(V²).",
    dryRun: [
      "For edges 0-{1,2}, 1-{3}, 2-{3}, BFS from 0 marks parent[1]=0 and parent[2]=0 while enqueuing them.",
      "Processing 1 first marks parent[3]=1; when 2 sees 3 it is already discovered and cannot create a shorter path.",
      "Reconstruct target 3 by parents 3→1→0, then reverse to [0,1,3].",
    ],
    pitfalls: [
      "Marking visited on dequeue can enqueue the same dense-graph vertex many times",
      "BFS gives shortest paths only when edges have equal effective weight",
      "Recursive DFS may exhaust stack on a long chain; switch to an explicit stack",
    ],
    recognition:
      "Use BFS for minimum moves, word ladders, level propagation, multi-source distance, and unweighted paths. Use DFS for components, flood fill, exhaustive reachability, cycle structure, and subtree-like graph recursion. Model states—not just physical nodes—as vertices when puzzles include keys, masks, or direction.",
    answer: {
      opening:
        "I will define vertices and edges, choose adjacency lists, and use BFS only if first discovery really implies the required optimum.",
      beats: [
        "State directedness and whether disconnected vertices require an outer loop.",
        "Mark discovery when adding to the frontier.",
        "Store parents when an actual path, not just distance, is required.",
        "Test isolated vertices, self-loops, duplicate edges, and empty grids.",
      ],
      closing: "Each vertex is discovered once and each adjacency entry is inspected once, so traversal is O(V+E).",
    },
    quiz: [
      q("graph-1", "When does BFS guarantee a shortest path?", "When every traversed edge has equal cost", ["For arbitrary negative weights", "Only on trees", "Only on complete graphs"], "Correct answer: When every traversed edge has equal cost. The other options confuse related ideas or skip a key constraint."),
      q("graph-2", "Why does a general graph need visited state?", "Cycles and converging paths could otherwise repeat work forever", ["To sort neighbors", "To allocate edges", "To balance the graph"], "Correct answer: Cycles and converging paths could otherwise repeat work forever. The other options confuse related ideas or skip a key constraint."),
      q("graph-3", "How do you cover a disconnected graph?", "Start a traversal from every still-unvisited vertex", ["Run from vertex zero only", "Add fake weighted edges", "Use recursion without visited"], "Correct answer: Start a traversal from every still-unvisited vertex. The other options confuse related ideas or skip a key constraint."),
      q("graph-4", "What reconstructs a BFS path?", "A parent recorded at first discovery", ["Only a distance count", "Heap priorities", "Map iteration order"], "Correct answer: A parent recorded at first discovery. The other options confuse related ideas or skip a key constraint."),
    ],
  }),
  makeDsaLesson({
    slug: "graphs-advanced",
    title: "Graphs — Weighted Paths & Spanning Structure",
    subtitle: "Algorithm selection, Dijkstra relaxation, minimum spanning trees, and state graphs.",
    difficulty: "advanced",
    minutes: 55,
    tags: ["graph", "dijkstra", "mst", "weighted"],
    prerequisites: ["graphs-bfs-dfs", "bst-and-heaps"],
    clarify: [
      "Are edge weights negative, and is the goal one source, all pairs, or a spanning network?",
      "Does cost attach to edges, vertices, transitions, or an expanded state such as (node, stops)?",
      "Can multiple heap entries for one vertex coexist, and what indicates a stale entry?",
    ],
    model: [
      "Relaxation asks whether reaching v through finalized or current u improves dist[v].",
      "Dijkstra is greedy only under nonnegative weights; MST minimizes total connection cost, not path distances.",
      "Expand state when future choices depend on more than the physical vertex.",
    ],
    mentalModel:
      "Weighted graph algorithms solve different objectives. Dijkstra grows a shortest-path tree from one source by repeatedly finalizing the smallest tentative distance; a negative edge could later undercut that decision. Prim and Kruskal build a minimum spanning tree whose total edge weight connects all vertices, but routes in that tree need not be shortest. The algorithm follows the objective and weight contract, not simply the word graph.",
    invariant:
      "In Dijkstra with nonnegative edges, a non-stale item popped with minimum distance has its final shortest distance. Relaxation preserves dist[v] as the best path discovered so far.",
    diagram: {
      kind: "heap-shape",
      title: "Minimum tentative distance frontier",
      caption: "The heap may contain stale copies; the dist array is the source of truth.",
    },
    implementations: [
      {
        title: "Core: Dijkstra with lazy stale-entry deletion",
        code: `type WeightedEdge struct{ To, Weight int }
type DistanceItem struct{ Node int; Distance int64 }
type DistanceHeap []DistanceItem

func dijkstra(graph [][]WeightedEdge, source int) []int64 {
	const infinity int64 = math.MaxInt64
	distance := make([]int64, len(graph))
	for i := range distance {
		distance[i] = infinity
	}
	distance[source] = 0
	pq := &DistanceHeap{{Node: source, Distance: 0}}
	heap.Init(pq)
	for pq.Len() > 0 {
		current := heap.Pop(pq).(DistanceItem)
		if current.Distance != distance[current.Node] {
			continue
		}
		for _, edge := range graph[current.Node] {
			candidate := current.Distance + int64(edge.Weight)
			if candidate < distance[edge.To] {
				distance[edge.To] = candidate
				heap.Push(pq, DistanceItem{edge.To, candidate})
			}
		}
	}
	return distance
}

// DistanceHeap implements heap.Interface ordered by Distance.`,
      },
      {
        title: "Variant: Bellman-Ford with negative-cycle detection",
        code: `type FlatEdge struct{ From, To int; Weight int64 }

func bellmanFord(n, source int, edges []FlatEdge) ([]int64, bool) {
	const infinity int64 = math.MaxInt64
	distance := make([]int64, n)
	for i := range distance {
		distance[i] = infinity
	}
	distance[source] = 0
	for pass := 0; pass < n-1; pass++ {
		changed := false
		for _, edge := range edges {
			if distance[edge.From] == infinity {
				continue
			}
			candidate := distance[edge.From] + edge.Weight
			if candidate < distance[edge.To] {
				distance[edge.To] = candidate
				changed = true
			}
		}
		if !changed {
			break
		}
	}
	for _, edge := range edges {
		if distance[edge.From] != infinity &&
			distance[edge.From]+edge.Weight < distance[edge.To] {
			return nil, false // reachable negative cycle
		}
	}
	return distance, true
}`,
      },
      {
        title: "Variant: Prim total cost for a connected MST",
        code: `func primCost(graph [][]WeightedEdge) (int64, bool) {
	if len(graph) == 0 {
		return 0, true
	}
	used := make([]bool, len(graph))
	pq := &DistanceHeap{{Node: 0, Distance: 0}}
	var total int64
	count := 0
	for pq.Len() > 0 {
		item := heap.Pop(pq).(DistanceItem)
		if used[item.Node] {
			continue
		}
		used[item.Node] = true
		total += item.Distance
		count++
		for _, edge := range graph[item.Node] {
			if !used[edge.To] {
				heap.Push(pq, DistanceItem{edge.To, int64(edge.Weight)})
			}
		}
	}
	return total, count == len(graph)
}`,
      },
    ],
    time: "Dijkstra O((V+E) log V); Bellman-Ford O(VE); heap-based Prim O(E log V)",
    space: "O(V+E) graph plus O(V) distances/visited and up to O(E) lazy heap entries",
    complexityNotes:
      "For small dense all-pairs problems, Floyd-Warshall uses O(V³) time and O(V²) space. A DAG shortest path can run in O(V+E) after topological ordering, even with negative edges.",
    dryRun: [
      "Edges: A→B=4, A→C=1, C→B=2. Start dist(A)=0; relax B=4 and C=1.",
      "Pop C=1 next and improve B to 3, pushing a second B entry. Pop B=3 and finalize it.",
      "Later B=4 is stale because 4 != dist(B)=3, so skip it. Nonnegative weights ensure no unprocessed route can beat 3.",
    ],
    pitfalls: [
      "Dijkstra is incorrect with negative edge weights even if there is no negative cycle",
      "Summing into int may overflow; distances often need int64 and guarded infinity",
      "An MST does not answer source-to-target shortest path queries",
    ],
    recognition:
      "Choose Dijkstra for nonnegative weighted shortest paths, 0-1 BFS for weights only 0 or 1, Bellman-Ford for negative edges or cycle detection, topological relaxation for DAGs, Floyd-Warshall for small all-pairs input, and Prim/Kruskal when the objective is cheapest total connectivity.",
    answer: {
      opening:
        "Before selecting an algorithm, I need the weight sign, source scope, and whether the objective is path cost or total spanning cost.",
      beats: [
        "Define relaxation and the dist array.",
        "Justify Dijkstra's greedy pop using nonnegative remaining edges.",
        "Handle stale heap entries instead of requiring decrease-key.",
        "Discuss unreachable vertices, overflow, and the alternative for negative weights.",
      ],
      closing: "Under nonnegative weights, each useful relaxation enters the heap and every finalized pop has the optimal distance.",
    },
    quiz: [
      q("ga-1", "What invalidates Dijkstra's greedy finalization?", "A negative edge can later create a cheaper route", ["Duplicate positive edges", "Disconnected vertices", "Using int64"], "Correct answer: A negative edge can later create a cheaper route. The other options confuse related ideas or skip a key constraint."),
      q("ga-2", "How does lazy Dijkstra handle old heap entries?", "Skip an item whose distance differs from the current dist value", ["Delete the graph", "Process every item fully", "Use FIFO"], "Correct answer: Skip an item whose distance differs from the current dist value. The other options confuse related ideas or skip a key constraint."),
      q("ga-3", "What does an MST minimize?", "The total weight needed to connect all vertices", ["Every pairwise path simultaneously", "Only source distance", "The number of vertices"], "Correct answer: The total weight needed to connect all vertices. The other options confuse related ideas or skip a key constraint."),
      q("ga-4", "Which algorithm detects reachable negative cycles?", "Bellman-Ford via one extra relaxation pass", ["Plain BFS", "Binary search", "Prim"], "Correct answer: Bellman-Ford via one extra relaxation pass. The other options confuse related ideas or skip a key constraint."),
    ],
  }),
  makeDsaLesson({
    slug: "recursion-backtracking",
    title: "Recursion & Backtracking",
    subtitle: "Recursive contracts, decision trees, choose-explore-unchoose, and output ownership.",
    difficulty: "intermediate",
    minutes: 50,
    tags: ["recursion", "backtracking", "decision-tree"],
    clarify: [
      "Do I need one solution, all solutions, a count, or only feasibility?",
      "Can each input item be used once, repeatedly, or in any order?",
      "Are there duplicates, ordering constraints, or safe pruning rules?",
    ],
    model: [
      "A recursion frame owns a state and delegates strictly smaller states.",
      "Backtracking traverses a decision tree: choose, recurse, then restore shared path state.",
      "Copy a path only when recording a result; mutate one buffer during exploration.",
    ],
    mentalModel:
      "Recursion solves a problem by trusting a precise contract on smaller input. Backtracking applies recursion to a search tree whose edges are choices. The path slice is working memory shared by frames: append makes a choice, recursive return completes exploration, and reslicing undoes it. The state must contain enough information to avoid duplicate permutations or illegal reuse, commonly start index, remaining target, and used flags.",
    invariant:
      "On entry, path exactly represents the choices leading to this state. On return, path is restored to its entry length, so sibling branches begin from identical parent state.",
    implementations: [
      {
        title: "Core: subsets using a start boundary",
        code: `func subsets(nums []int) [][]int {
	result := [][]int{}
	path := []int{}
	var search func(int)
	search = func(start int) {
		result = append(result, append([]int(nil), path...))
		for i := start; i < len(nums); i++ {
			path = append(path, nums[i])
			search(i + 1)
			path = path[:len(path)-1]
		}
	}
	search(0)
	return result
}`,
      },
      {
        title: "Variant: permutations with used positions",
        code: `func permutations(nums []int) [][]int {
	result := [][]int{}
	path := make([]int, 0, len(nums))
	used := make([]bool, len(nums))
	var search func()
	search = func() {
		if len(path) == len(nums) {
			result = append(result, append([]int(nil), path...))
			return
		}
		for i, value := range nums {
			if used[i] {
				continue
			}
			used[i] = true
			path = append(path, value)
			search()
			path = path[:len(path)-1]
			used[i] = false
		}
	}
	search()
	return result
}`,
      },
      {
        title: "Variant: count paths without materializing output",
        code: `func countWays(steps int) int {
	memo := make(map[int]int)
	var solve func(int) int
	solve = func(remaining int) int {
		if remaining == 0 {
			return 1
		}
		if remaining < 0 {
			return 0
		}
		if value, ok := memo[remaining]; ok {
			return value
		}
		memo[remaining] = solve(remaining-1) + solve(remaining-2)
		return memo[remaining]
	}
	return solve(steps)
}`,
      },
    ],
    time: "Subsets O(n·2ⁿ) including copies; permutations O(n·n!); memoized count O(n)",
    space: "O(n) recursion/path excluding output; output itself is necessarily exponential",
    complexityNotes:
      "Separate search-tree nodes from output-copy cost. Memoization applies when future answers depend only on state, not on the path identity that led there.",
    dryRun: [
      "For subsets [1,2], record [] at start; choose 1 and record [1]; choose 2 and record [1,2].",
      "Return from [1,2], pop 2, return from [1], pop 1; next root sibling chooses 2 and records [2].",
      "The result is [[],[1],[1,2],[2]]. Every recursive return restores path to its previous length.",
    ],
    pitfalls: [
      "Appending path directly to results aliases the reusable backing array; copy it",
      "Missing unchoose logic leaks state into sibling branches",
      "Exponential output cannot be optimized to polynomial total time when every solution must be returned",
    ],
    recognition:
      "Reach for backtracking on enumerate, all combinations, permutations, placements, partitions, word search, and constraint satisfaction with small n. Reach for ordinary recursion on naturally nested structures. Add memoization when different paths reach the same complete state and only an aggregate answer is needed.",
    answer: {
      opening:
        "I will draw the decision tree, define the state owned by one frame, and separate choices from the base case that emits a solution.",
      beats: [
        "Specify whether the loop starts at 0, start, or start with reuse.",
        "Show choose-explore-unchoose and result copying.",
        "Prune only with a proof that no valid descendant is removed.",
        "State output-sensitive complexity and test empty input and duplicates.",
      ],
      closing: "The invariant that each frame restores shared state makes every sibling branch independent.",
    },
    quiz: [
      q("rb-1", "Why copy path when recording a solution?", "The search will keep mutating the shared backing storage", ["Copies sort values", "Recursion requires arrays", "It reduces time to O(n)"], "Correct answer: The search will keep mutating the shared backing storage. The other options confuse related ideas or skip a key constraint."),
      q("rb-2", "What does the start index prevent in subset generation?", "Reusing earlier positions and generating order-duplicate subsets", ["Stack overflow", "Negative values", "Map collisions"], "Correct answer: Reusing earlier positions and generating order-duplicate subsets. The other options confuse related ideas or skip a key constraint."),
      q("rb-3", "What is the key restoration invariant?", "A frame returns path and auxiliary flags to their entry state", ["Every frame keeps all choices", "The path is always empty", "Results share memory"], "Correct answer: A frame returns path and auxiliary flags to their entry state. The other options confuse related ideas or skip a key constraint."),
      q("rb-4", "Can all n! permutations be returned in polynomial total time?", "No, writing the output already takes Ω(n·n!)", ["Yes, with a heap", "Yes, with BFS", "Only in Go"], "Correct answer: No, writing the output already takes Ω(n·n!). The other options confuse related ideas or skip a key constraint."),
    ],
  }),
  makeDsaLesson({
    slug: "dynamic-programming",
    title: "Dynamic Programming",
    subtitle: "State design, recurrences, memoization, tabulation, and space compression.",
    difficulty: "advanced",
    minutes: 55,
    tags: ["dynamic-programming", "memoization", "knapsack"],
    clarify: [
      "What choices define a complete subproblem, and which dimensions affect future decisions?",
      "Is the objective a minimum, maximum, count, or boolean feasibility?",
      "Can values or amounts be negative, and must an item be used once or repeatedly?",
    ],
    model: [
      "Write the state meaning in a sentence before writing the recurrence.",
      "Recurrence = choices from this state; base cases answer states with no decisions left.",
      "Top-down proves reachable states; bottom-up exposes dependency order and compression.",
    ],
    mentalModel:
      "Dynamic programming is exhaustive search with repeated states computed once. A good state is sufficient—future choices need no hidden history—and minimal—irrelevant history is omitted. Memoization follows recursion and is often easiest to derive. Tabulation orders states so dependencies are already solved. Space compression is safe only when overwritten cells will not be needed later; loop direction encodes whether reuse is allowed.",
    invariant:
      "Each stored dp[state] equals the optimal or counted answer under the state definition. In 0/1 knapsack's descending capacity loop, dp[c] before update still belongs to the previous item layer.",
    implementations: [
      {
        title: "Baseline to memoized: minimum coins",
        code: `func coinChangeMemo(coins []int, amount int) int {
	const unknown = -2
	memo := make([]int, amount+1)
	for i := range memo {
		memo[i] = unknown
	}
	memo[0] = 0
	var solve func(int) int
	solve = func(remaining int) int {
		if remaining < 0 {
			return -1
		}
		if memo[remaining] != unknown {
			return memo[remaining]
		}
		best := math.MaxInt
		for _, coin := range coins {
			if child := solve(remaining - coin); child >= 0 && child < best {
				best = child + 1
			}
		}
		if best == math.MaxInt {
			best = -1
		}
		memo[remaining] = best
		return best
	}
	return solve(amount)
}`,
      },
      {
        title: "Bottom-up variant: minimum coins",
        code: `func coinChange(coins []int, amount int) int {
	unreachable := amount + 1
	dp := make([]int, amount+1)
	for value := 1; value <= amount; value++ {
		dp[value] = unreachable
		for _, coin := range coins {
			if coin <= value && dp[value-coin] != unreachable {
				dp[value] = min(dp[value], dp[value-coin]+1)
			}
		}
	}
	if dp[amount] == unreachable {
		return -1
	}
	return dp[amount]
}`,
      },
      {
        title: "0/1 versus unbounded loop direction",
        code: `func knapsack01(weights, values []int, capacity int) int {
	dp := make([]int, capacity+1)
	for i, weight := range weights {
		for c := capacity; c >= weight; c-- { // descending: use item once
			dp[c] = max(dp[c], dp[c-weight]+values[i])
		}
	}
	return dp[capacity]
}

func unboundedKnapsack(weights, values []int, capacity int) int {
	dp := make([]int, capacity+1)
	for i, weight := range weights {
		for c := weight; c <= capacity; c++ { // ascending: reuse item
			dp[c] = max(dp[c], dp[c-weight]+values[i])
		}
	}
	return dp[capacity]
}`,
      },
    ],
    time: "Coin change O(amount·coins); 0/1 knapsack O(items·capacity)",
    space: "O(amount) or O(capacity) after one-dimensional compression",
    complexityNotes:
      "Pseudo-polynomial complexity depends on numeric capacity, not its bit length. Some problems require O(nm) tables because reconstruction or two independent prefixes matter.",
    dryRun: [
      "For coins [1,3,4], amount 6: dp[0]=0. dp[1]=1; dp[2]=2; dp[3]=1 using coin 3.",
      "dp[4]=1; dp[5]=2; at dp[6], candidates are dp[5]+1=3, dp[3]+1=2, and dp[2]+1=3.",
      "So dp[6]=2 from 3+3. The state stores the best answer for every smaller amount exactly once.",
    ],
    pitfalls: [
      "A vague state definition produces recurrences that accidentally depend on omitted history",
      "Using ascending capacity for 0/1 knapsack reuses the same item in one iteration",
      "Initializing unreachable minima to zero makes impossible states look optimal",
    ],
    recognition:
      "Reach for DP when brute force branches over choices and different paths revisit the same state: count ways, min/max cost, subsequences, edit distance, knapsack, partitions, intervals, or grid paths. If a local choice has a proof, greedy may be simpler; if every state is visited once naturally, plain DFS may suffice.",
    answer: {
      opening:
        "I will first define dp state, recurrence, and base cases in English; code comes only after the dependency graph is clear.",
      beats: [
        "Demonstrate the exponential recursion and identify duplicate states.",
        "Choose top-down for sparse reachable states or bottom-up for simple order and compression.",
        "Explain initialization and loop direction.",
        "State pseudo-polynomial bounds and test impossible, zero, and one-item cases.",
      ],
      closing: "Each distinct state is solved once, converting repeated exponential exploration into the size of the state graph.",
    },
    quiz: [
      q("dp-1", "What makes a DP state sufficient?", "It contains all information future choices need", ["It stores the entire call stack", "It is always one integer", "It uses a map"], "Correct answer: It contains all information future choices need. The other options confuse related ideas or skip a key constraint."),
      q("dp-2", "Why iterate capacity downward in 0/1 knapsack?", "To read the previous item layer and prevent reusing the current item", ["To sort items", "To allow infinite reuse", "To reduce capacity"], "Correct answer: To read the previous item layer and prevent reusing the current item. The other options confuse related ideas or skip a key constraint."),
      q("dp-3", "How should unreachable minimum-cost states be initialized?", "To a safe infinity sentinel, with the base state set explicitly", ["To zero", "To a random value", "To the target answer"], "Correct answer: To a safe infinity sentinel, with the base state set explicitly. The other options confuse related ideas or skip a key constraint."),
      q("dp-4", "What does pseudo-polynomial mean here?", "Runtime depends on a numeric value such as capacity, not only its encoded length", ["Runtime is exponential", "Runtime is approximate", "Space is always constant"], "Correct answer: Runtime depends on a numeric value such as capacity, not only its encoded length. The other options confuse related ideas or skip a key constraint."),
    ],
  }),
  makeDsaLesson({
    slug: "sliding-window-two-pointers",
    title: "Sliding Window & Two Pointers",
    subtitle: "Fixed windows, variable validity, monotonic shrink proofs, and pair elimination.",
    difficulty: "intermediate",
    minutes: 50,
    tags: ["sliding-window", "two-pointers", "substring", "subarray"],
    clarify: [
      "Is the target contiguous, and is window size fixed or determined by a constraint?",
      "When the right edge expands, can moving left monotonically restore validity?",
      "Are numbers nonnegative, or could negatives invalidate a sum-based shrink rule?",
    ],
    model: [
      "A window summarizes [left,right] without recomputing it.",
      "Expand right to consider new candidates; shrink left to restore or tighten a named invariant.",
      "Opposite pointers use sorted order to eliminate a whole row of candidate pairs per move.",
    ],
    mentalModel:
      "Sliding windows work when neighboring candidate ranges differ by one entering and one leaving item. A fixed window updates its aggregate in O(1). A variable window requires monotonic validity: after expansion breaks a constraint, advancing left must move toward validity. This often fails for sum constraints with negative numbers. For minimum valid windows, shrink while valid; for maximum valid windows, shrink while invalid and score valid windows.",
    invariant:
      "The maintained counts or sum exactly describe nums[left:right+1]. For longest valid problems the window is valid when scored; for shortest covering problems it covers requirements while the inner loop tightens it.",
    diagram: {
      kind: "sliding-window",
      title: "Expand, repair, and score",
      caption: "Each boundary moves only forward, so nested-looking loops still do O(n) total moves.",
    },
    implementations: [
      {
        title: "Core fixed window: maximum sum of exactly k values",
        code: `func maxWindowSum(nums []int, k int) (int64, bool) {
	if k <= 0 || k > len(nums) {
		return 0, false
	}
	var sum int64
	for i := 0; i < k; i++ {
		sum += int64(nums[i])
	}
	best := sum
	for right := k; right < len(nums); right++ {
		sum += int64(nums[right]) - int64(nums[right-k])
		if sum > best {
			best = sum
		}
	}
	return best, true
}`,
      },
      {
        title: "Variable window: longest substring with at most k distinct bytes",
        code: `func longestAtMostKDistinct(s string, k int) int {
	if k <= 0 {
		return 0
	}
	count := make(map[byte]int)
	left, best := 0, 0
	for right := 0; right < len(s); right++ {
		count[s[right]]++
		for len(count) > k {
			out := s[left]
			count[out]--
			if count[out] == 0 {
				delete(count, out)
			}
			left++
		}
		best = max(best, right-left+1)
	}
	return best
}`,
      },
      {
        title: "Minimum covering window with deficit counts",
        code: `func minWindow(s, target string) string {
	if len(target) == 0 {
		return ""
	}
	need := [256]int{}
	for i := range target {
		need[target[i]]++
	}
	missing := len(target)
	left, bestStart, bestLength := 0, 0, len(s)+1
	for right := range s {
		in := s[right]
		if need[in] > 0 {
			missing--
		}
		need[in]--
		for missing == 0 {
			if right-left+1 < bestLength {
				bestStart, bestLength = left, right-left+1
			}
			out := s[left]
			need[out]++
			left++
			if need[out] > 0 {
				missing++
			}
		}
	}
	if bestLength > len(s) {
		return ""
	}
	return s[bestStart : bestStart+bestLength]
}`,
      },
    ],
    time: "O(n) because left and right each advance at most n times",
    space: "O(k) distinct keys or O(alphabet) fixed frequency state",
    complexityNotes:
      "The inner while loop does not make the algorithm O(n²): across the entire run it increments left at most n times. Sorting plus opposite pointers is O(n log n) when the input is not already sorted.",
    dryRun: [
      "For “eceba”, k=2: windows e, ec, ece remain valid and best becomes 3.",
      "Adding b gives three distinct bytes; shrink left: remove e once but e remains, then remove c and delete it, leaving eb.",
      "Add a, again three distinct; shrink until ba. No later window beats ece, so return 3.",
    ],
    pitfalls: [
      "A variable sum window usually needs nonnegative values; negatives break monotonic shrink reasoning",
      "Deleting a frequency key only at count zero is required when len(map) represents distinct count",
      "Minimum-window code must score while valid before removing the character that breaks coverage",
    ],
    recognition:
      "Look for contiguous subarray or substring plus longest, shortest, exactly k, at most k, or covers all. Fixed length implies add incoming and remove outgoing. A monotonic constraint suggests a variable window. Sorted pair/triple problems suggest converging pointers after sorting.",
    answer: {
      opening:
        "I will verify contiguity and monotonicity, then name what the window summary means before coding either the repair or tighten loop.",
      beats: [
        "Distinguish longest-valid from shortest-covering loop order.",
        "Prove each pointer only moves forward.",
        "Call out alphabet assumptions and sum overflow.",
        "Test k=0, k>n, no valid window, repeated characters, and negative-number counterexamples.",
      ],
      closing: "Although one loop is nested, the two monotonic boundaries perform at most 2n moves.",
    },
    quiz: [
      q("sw-1", "Why is a standard variable sum window unsafe with negative numbers?", "Removing a left value may increase rather than decrease the sum", ["Negative numbers cannot be added", "Maps reject negatives", "The array becomes unsorted"], "Correct answer: Removing a left value may increase rather than decrease the sum. The other options confuse related ideas or skip a key constraint."),
      q("sw-2", "When does a shortest-covering window update its answer?", "While the window is valid, before tightening until it breaks", ["Only when invalid", "Before adding right", "After clearing all counts"], "Correct answer: While the window is valid, before tightening until it breaks. The other options confuse related ideas or skip a key constraint."),
      q("sw-3", "Why is the nested shrink loop still linear?", "left advances at most n times total", ["The compiler removes it", "right never moves", "Maps are constant space"], "Correct answer: left advances at most n times total. The other options confuse related ideas or skip a key constraint."),
      q("sw-4", "What makes a fixed window efficient?", "The next aggregate removes one outgoing item and adds one incoming item", ["It sorts every range", "It uses recursion", "It scans each range from scratch"], "Correct answer: The next aggregate removes one outgoing item and adds one incoming item. The other options confuse related ideas or skip a key constraint."),
    ],
  }),
  makeDsaLesson({
    slug: "strings-and-runes",
    title: "Strings & Runes",
    subtitle: "UTF-8 correctness, frequency signatures, builders, and character windows.",
    difficulty: "beginner",
    minutes: 45,
    tags: ["strings", "utf-8", "frequency-map", "sliding-window"],
    clarify: [
      "Does character mean ASCII byte, Unicode code point, or user-perceived grapheme?",
      "Are case, normalization, punctuation, and whitespace significant?",
      "Do output indices need to be byte offsets as Go slicing requires?",
    ],
    model: [
      "A Go string is immutable bytes; range decodes UTF-8 and reports byte offsets.",
      "Choose [26]int or [256]int for a proven finite alphabet; otherwise use map[rune]int.",
      "For substring constraints, maintain exactly what is true inside [left,right].",
    ],
    mentalModel:
      "UTF-8 uses one to four bytes per rune, so len(s) counts bytes and s[i] returns a byte. A rune is a Unicode code point, still not necessarily a whole visual character because combining marks exist. Converting to []rune gives code-point indexing at O(n) memory; ranging a string is allocation-free and gives byte positions. Strings are immutable, so build repeated output with strings.Builder or []byte rather than quadratic concatenation.",
    invariant:
      "In a unique-character window, every rune in the current interval appears at most once, and left is one past the latest conflicting occurrence. Frequency signatures are equal exactly when every alphabet count balances to zero.",
    diagram: {
      kind: "sliding-window",
      title: "Character window over decoded input",
      caption: "Expand right once; move left past a duplicate without moving it backward.",
    },
    implementations: [
      {
        title: "Baseline: compare rune frequencies for anagrams",
        code: `func isAnagramUnicode(a, b string) bool {
	freq := make(map[rune]int)
	countA, countB := 0, 0
	for _, r := range a {
		freq[r]++
		countA++
	}
	for _, r := range b {
		freq[r]--
		countB++
	}
	if countA != countB {
		return false
	}
	for _, count := range freq {
		if count != 0 {
			return false
		}
	}
	return true
}`,
      },
      {
        title: "Optimal window: longest substring without repeated runes",
        code: `func longestUniqueRunes(s string) int {
	runes := []rune(s)
	last := make(map[rune]int, len(runes))
	left, best := 0, 0
	for right, r := range runes {
		if previous, ok := last[r]; ok && previous >= left {
			left = previous + 1
		}
		last[r] = right
		if width := right - left + 1; width > best {
			best = width
		}
	}
	return best
}`,
      },
      {
        title: "Variant: linear-time output construction",
        code: `func reverseWords(words []string) string {
	var b strings.Builder
	size := 0
	for _, word := range words {
		size += len(word)
	}
	if len(words) > 1 {
		size += len(words) - 1
	}
	b.Grow(size)
	for i := len(words) - 1; i >= 0; i-- {
		if b.Len() > 0 {
			b.WriteByte(' ')
		}
		b.WriteString(words[i])
	}
	return b.String()
}`,
      },
    ],
    time: "Frequency comparison O(a+b); unique window O(r) runes; builder output O(total bytes)",
    space: "O(k) for distinct runes, or O(1) for a fixed alphabet; []rune conversion uses O(r)",
    complexityNotes:
      "Unicode normalization is a separate semantic operation and is not performed by rune conversion. ASCII-specific array solutions are only correct when the input contract guarantees ASCII.",
    dryRun: [
      "Decode “aéa🙂”: rune positions are [a,é,a,🙂], though byte offsets differ.",
      "right=0 stores a at 0; right=1 stores é at 1, so best=2.",
      "At right=2, a was inside the window at 0, so left becomes 1; adding 🙂 at right=3 gives window [é,a,🙂] of length 3.",
    ],
    pitfalls: [
      "len and indexing operate on bytes, not Unicode characters",
      "A rune is a code point, not a full grapheme cluster",
      "Repeated result += piece may copy the growing string on every iteration",
    ],
    recognition:
      "Use frequency state for anagrams, permutations, character replacement, and minimum-cover problems. Use a sliding window for longest or shortest contiguous substring under a monotonic constraint. Clarify the alphabet immediately: it determines indexing, storage, and whether byte slicing is valid.",
    answer: {
      opening:
        "I need to pin down the meaning of character first; I will use runes for Unicode code points and preserve byte offsets only if the API returns substrings.",
      beats: [
        "Contrast byte indexing with range decoding.",
        "Name the window invariant and use last-seen indices so left never retreats.",
        "Choose an array only under an explicit ASCII or lowercase-letter contract.",
        "Test empty input, invalid UTF-8 policy, repeated multibyte runes, and combining marks.",
      ],
      closing: "Each rune enters once and causes at most one forward jump of left, so the window remains linear.",
    },
    quiz: [
      q("str-1", "What does len(s) report for a Go string?", "Its byte length", ["Its rune count", "Its grapheme count", "Its capacity"], "Correct answer: Its byte length. The other options confuse related ideas or skip a key constraint."),
      q("str-2", "What does range over a string yield?", "Byte offset and decoded rune", ["Rune index and byte", "Only ASCII", "Grapheme and width"], "Correct answer: Byte offset and decoded rune. The other options confuse related ideas or skip a key constraint."),
      q("str-3", "Why use strings.Builder for many concatenations?", "It avoids repeatedly copying the growing immutable string", ["It normalizes Unicode", "It sorts words", "It interns every string"], "Correct answer: It avoids repeatedly copying the growing immutable string. The other options confuse related ideas or skip a key constraint."),
      q("str-4", "When is [26]int a correct frequency table?", "When input is guaranteed to be exactly the mapped 26-letter alphabet", ["For arbitrary UTF-8", "For grapheme clusters", "Whenever len is under 26"], "Correct answer: When input is guaranteed to be exactly the mapped 26-letter alphabet. The other options confuse related ideas or skip a key constraint."),
    ],
  }),
  makeDsaLesson({
    slug: "linked-lists",
    title: "Linked Lists",
    subtitle: "Sentinels, pointer rewiring, runner gaps, merging, and cycle proofs.",
    difficulty: "beginner",
    minutes: 45,
    tags: ["linked-list", "pointers", "fast-slow"],
    clarify: [
      "Is the list singly linked, acyclic, and allowed to be mutated?",
      "May the head change, and is the requested position guaranteed valid?",
      "Should identity be preserved, or may I allocate replacement nodes?",
    ],
    model: [
      "Save next before overwriting a Next pointer.",
      "Use a dummy node when the first real node may be removed or replaced.",
      "Create a fixed runner gap for nth-from-end; use unequal speeds for cycle questions.",
    ],
    mentalModel:
      "A linked list trades random access and cache locality for O(1) rewiring when the relevant node is known. Most bugs come from losing the unprocessed suffix or treating the head as a special case. A sentinel makes every operation happen after some predecessor. Fast/slow pointers encode distance without first measuring length: a fixed gap locates a trailing node, while a 2:1 speed difference guarantees a meeting inside a cycle.",
    invariant:
      "During reversal, prev is the fully reversed processed prefix, curr is the first unprocessed node, and next saves the remainder. During merge, dummy.Next through tail is sorted and final.",
    diagram: {
      kind: "linked-list-reverse",
      title: "Three-pointer reversal",
      caption: "Save curr.Next, reverse one edge, then advance prev and curr.",
    },
    implementations: [
      {
        title: "Core: iterative and recursive reversal",
        code: `type ListNode struct {
	Val  int
	Next *ListNode
}

func reverseIterative(head *ListNode) *ListNode {
	var previous *ListNode
	for current := head; current != nil; {
		next := current.Next
		current.Next = previous
		previous = current
		current = next
	}
	return previous
}

func reverseRecursive(head *ListNode) *ListNode {
	if head == nil || head.Next == nil {
		return head
	}
	newHead := reverseRecursive(head.Next)
	head.Next.Next = head
	head.Next = nil
	return newHead
}`,
      },
      {
        title: "Variant: merge sorted lists with a sentinel",
        code: `func mergeSorted(a, b *ListNode) *ListNode {
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
        title: "Variant: cycle entry with Floyd runners",
        code: `func cycleEntry(head *ListNode) *ListNode {
	slow, fast := head, head
	for fast != nil && fast.Next != nil {
		slow = slow.Next
		fast = fast.Next.Next
		if slow == fast {
			probe := head
			for probe != slow {
				probe = probe.Next
				slow = slow.Next
			}
			return probe
		}
	}
	return nil
}`,
      },
    ],
    time: "Reverse, merge, runner-gap, and Floyd scans are O(n)",
    space: "O(1) iterative extra space; O(n) recursive call stack in a skewed list",
    complexityNotes:
      "List insertion is only O(1) when the predecessor or node reference is already known; searching for it remains O(n).",
    dryRun: [
      "Reverse 1→2→3: start prev=nil, curr=1; save 2, set 1.Next=nil, advance prev=1 and curr=2.",
      "Save 3, point 2→1, then point 3→2; curr becomes nil and prev is the new head 3.",
      "For a cycle 1→2→3→4→2, slow and fast meet inside the cycle; reset one runner to head, then equal-speed steps meet at node 2.",
    ],
    pitfalls: [
      "Overwriting curr.Next before saving the suffix loses the rest of the list",
      "Recursive reversal can overflow the goroutine stack on very long input",
      "Comparing node values cannot detect identity or cycles; compare pointers",
    ],
    recognition:
      "Reach for a dummy node on remove, partition, merge, or insert when the head may change. Reach for fast/slow pointers on middle, cycle, palindrome split, or nth-from-end. Reach for reversal when the question changes direction, processes groups, or needs O(1) extra memory.",
    answer: {
      opening:
        "I will draw node identity and arrows, use a sentinel if the head can change, and state which segment is already final.",
      beats: [
        "Save the outgoing edge before mutation.",
        "Walk a one-node and two-node example.",
        "Explain why the runner gap or speed relationship gives the requested position.",
        "Check nil head, one node, even length, and cycles before dereferencing fast.Next.",
      ],
      closing: "Every node is visited a constant number of times and only pointer variables are allocated.",
    },
    quiz: [
      q("ll-1", "Why save next before reversing curr.Next?", "Otherwise the unprocessed suffix may become unreachable", ["To sort the list", "To allocate a sentinel", "To detect UTF-8"], "Correct answer: Otherwise the unprocessed suffix may become unreachable. The other options confuse related ideas or skip a key constraint."),
      q("ll-2", "When is a dummy node especially useful?", "When an operation may change the head", ["Only for cyclic lists", "Only for arrays", "When values are negative"], "Correct answer: When an operation may change the head. The other options confuse related ideas or skip a key constraint."),
      q("ll-3", "What must Floyd pointers compare?", "Node pointer identity", ["Only node values", "List length", "Memory capacity"], "Correct answer: Node pointer identity. The other options confuse related ideas or skip a key constraint."),
      q("ll-4", "What extra space does recursive reversal use?", "O(n) call stack in the worst case", ["Always O(1)", "O(log n) for every list", "O(n²)"], "Correct answer: O(n) call stack in the worst case. The other options confuse related ideas or skip a key constraint."),
    ],
  }),
  makeDsaLesson({
    slug: "stacks-and-queues",
    title: "Stacks & Queues",
    subtitle: "LIFO/FIFO invariants, expression parsing, BFS frontiers, and safe Go storage.",
    difficulty: "beginner",
    minutes: 45,
    tags: ["stack", "queue", "deque", "bfs"],
    clarify: [
      "Does the task need newest-first, oldest-first, or both ends?",
      "Can nesting be modeled by unresolved open items?",
      "Could queue storage retain large objects after logical removal?",
    ],
    model: [
      "A stack stores unresolved work in LIFO order; the top is the only legal next match.",
      "A queue stores a frontier in FIFO order; everything dequeued earlier has smaller discovery time.",
      "Slices make excellent stacks; queues need a head index or ring buffer rather than repeated front deletion.",
    ],
    mentalModel:
      "Stacks delay completion: an opening delimiter, pending operator, or DFS frame waits until later input resolves it. Queues preserve arrival order, which is why BFS explores increasing edge distance. In Go, append and reslice the end for a stack. For a queue, q=q[1:] is O(1) but can retain the entire backing array; a head index plus periodic compaction or a ring buffer bounds retention.",
    invariant:
      "The stack contains exactly the unresolved items in encounter order, with the next required match on top. The queue segment q[head:] contains exactly the discovered but not yet processed frontier in FIFO order.",
    implementations: [
      {
        title: "Core stack: validate nested delimiters",
        code: `func validDelimiters(s string) bool {
	stack := make([]rune, 0, len(s))
	match := map[rune]rune{')': '(', ']': '[', '}': '{'}
	for _, r := range s {
		if opening, closes := match[r]; closes {
			if len(stack) == 0 || stack[len(stack)-1] != opening {
				return false
			}
			stack = stack[:len(stack)-1]
			continue
		}
		switch r {
		case '(', '[', '{':
			stack = append(stack, r)
		}
	}
	return len(stack) == 0
}`,
      },
      {
        title: "Core queue: BFS distances with a head index",
        code: `func unweightedDistances(graph [][]int, source int) []int {
	distance := make([]int, len(graph))
	for i := range distance {
		distance[i] = -1
	}
	distance[source] = 0
	queue := make([]int, 0, len(graph))
	queue = append(queue, source)
	for head := 0; head < len(queue); head++ {
		node := queue[head]
		for _, next := range graph[node] {
			if distance[next] != -1 {
				continue
			}
			distance[next] = distance[node] + 1
			queue = append(queue, next)
		}
	}
	return distance
}`,
      },
      {
        title: "Variant: amortized O(1) two-stack queue",
        code: `type Queue[T any] struct {
	in, out []T
}

func (q *Queue[T]) Push(value T) {
	q.in = append(q.in, value)
}

func (q *Queue[T]) Pop() (T, bool) {
	if len(q.out) == 0 {
		for len(q.in) > 0 {
			last := len(q.in) - 1
			q.out = append(q.out, q.in[last])
			q.in = q.in[:last]
		}
	}
	if len(q.out) == 0 {
		var zero T
		return zero, false
	}
	last := len(q.out) - 1
	value := q.out[last]
	q.out = q.out[:last]
	return value, true
}`,
      },
    ],
    time: "Push/pop O(1) amortized; delimiter scan and BFS O(n) or O(V+E)",
    space: "O(n) for unresolved stack or queue frontier",
    complexityNotes:
      "The two-stack queue is amortized O(1): each value moves from in to out once. A ring buffer provides strict O(1) operations with explicit growth logic.",
    dryRun: [
      "For “([{}])”, push (, [, {; } matches and pops {, then ] pops [, then ) pops (; empty means valid.",
      "For graph 0→{1,2}, 1→{3}, initialize queue [0], distance[0]=0; processing 0 appends 1 and 2 at distance 1.",
      "Processing 1 first discovers 3 at distance 2; processing 2 cannot make 3 shorter because FIFO processes all distance-1 nodes before distance-2 nodes.",
    ],
    pitfalls: [
      "Pop or peek must check an empty stack before indexing len-1",
      "Mark BFS nodes visited when enqueued, not when dequeued, to avoid duplicate frontier entries",
      "A subslice queue may retain references to consumed large objects unless slots are zeroed or storage is compacted",
    ],
    recognition:
      "Choose a stack for matching, nested structure, undo, expression evaluation, DFS, or nearest unresolved candidates. Choose a queue for level order, minimum unweighted steps, scheduling in arrival order, or producer-consumer buffers. Choose a deque when both ends matter, especially window extrema.",
    answer: {
      opening:
        "I will map the required processing order to LIFO or FIFO, then define exactly what unresolved work the structure contains.",
      beats: [
        "Explain why a stack top is the only valid delimiter match.",
        "Explain why FIFO establishes shortest unweighted distance.",
        "Use safe empty checks and a head index in Go.",
        "Discuss memory retention or a ring buffer if this is production code.",
      ],
      closing: "Each item is pushed and removed a bounded number of times, giving linear total work.",
    },
    quiz: [
      q("sq-1", "Why does BFS use a queue?", "FIFO processes vertices in nondecreasing discovery distance", ["Queues sort edge weights", "Queues detect negative cycles", "FIFO is recursive"], "Correct answer: FIFO processes vertices in nondecreasing discovery distance. The other options confuse related ideas or skip a key constraint."),
      q("sq-2", "When should BFS mark a node visited?", "When it is enqueued", ["After every neighbor finishes", "Only at the end", "When it is dequeued twice"], "Correct answer: When it is enqueued. The other options confuse related ideas or skip a key constraint."),
      q("sq-3", "Why can q=q[1:] be undesirable in a long-lived service?", "The small slice may retain a large backing array and referenced objects", ["It is always O(n)", "It reverses the queue", "It copies all elements"], "Correct answer: The small slice may retain a large backing array and referenced objects. The other options confuse related ideas or skip a key constraint."),
      q("sq-4", "Why is a queue built from two stacks amortized O(1)?", "Each element transfers between stacks at most once", ["It never moves data", "Both stacks are sorted", "Go optimizes every method"], "Correct answer: Each element transfers between stacks at most once. The other options confuse related ideas or skip a key constraint."),
    ],
  }),
  makeDsaLesson({
    slug: "hash-maps-and-sets",
    title: "Hash Maps & Sets",
    subtitle: "Lookup transformations, frequency state, composite keys, and Go map semantics.",
    difficulty: "beginner",
    minutes: 45,
    tags: ["hash-map", "set", "frequency", "indexing"],
    clarify: [
      "Do I need existence, a count, the earliest index, or full associated data?",
      "What key uniquely represents equality, and is that key comparable in Go?",
      "Is deterministic output order required despite randomized map iteration?",
    ],
    model: [
      "A map replaces a repeated search with remembered information keyed by the thing being searched for.",
      "For each element, ask what complement or prior state would complete the answer.",
      "A set is map[T]struct{}; the comma-ok form separates absence from a stored zero value.",
    ],
    mentalModel:
      "Hashing turns a comparable key into a bucket location and then resolves collisions by checking actual key equality. Average lookup, insert, and delete are O(1), but iteration is intentionally unordered. Maps are reference-like runtime structures: assignment shares the map, a nil map can be read but not written, and concurrent write access requires synchronization. Arrays and structs of comparable fields make excellent collision-free logical signatures.",
    invariant:
      "Before processing index i in a one-pass lookup, the map summarizes exactly the chosen property of indices [0,i). Therefore a successful complement lookup uses a distinct prior element.",
    diagram: {
      kind: "hash-map-buckets",
      title: "Hash to bucket, then compare keys",
      caption: "Hashing narrows the search; equality still decides the matching entry.",
    },
    implementations: [
      {
        title: "Baseline and optimal: Two Sum",
        code: `func twoSumNested(nums []int, target int) [2]int {
	for i := range nums {
		for j := i + 1; j < len(nums); j++ {
			if nums[i]+nums[j] == target {
				return [2]int{i, j}
			}
		}
	}
	return [2]int{-1, -1}
}

func twoSumMap(nums []int, target int) [2]int {
	seen := make(map[int]int, len(nums))
	for i, value := range nums {
		if j, ok := seen[target-value]; ok {
			return [2]int{j, i}
		}
		seen[value] = i
	}
	return [2]int{-1, -1}
}`,
      },
      {
        title: "Variant: group lowercase anagrams by comparable signature",
        code: `func groupAnagrams(words []string) [][]string {
	groups := make(map[[26]int][]string)
	for _, word := range words {
		var signature [26]int
		for i := 0; i < len(word); i++ {
			signature[word[i]-'a']++
		}
		groups[signature] = append(groups[signature], word)
	}
	result := make([][]string, 0, len(groups))
	for _, group := range groups {
		result = append(result, group)
	}
	return result
}`,
      },
      {
        title: "Variant: longest consecutive sequence with a set",
        code: `func longestConsecutive(nums []int) int {
	set := make(map[int]struct{}, len(nums))
	for _, value := range nums {
		set[value] = struct{}{}
	}
	best := 0
	for value := range set {
		if _, hasPrevious := set[value-1]; hasPrevious {
			continue // only sequence starts do work
		}
		length := 1
		for next := value + 1; ; next++ {
			if _, ok := set[next]; !ok {
				break
			}
			length++
		}
		if length > best {
			best = length
		}
	}
	return best
}`,
      },
    ],
    time: "Nested lookup O(n²); map-based scans O(n) expected; anagram grouping O(total characters)",
    space: "O(n) entries, or O(k) where k is the number of distinct keys",
    complexityNotes:
      "Hash maps provide expected, not mathematical worst-case, O(1). The consecutive-sequence scan is O(n) because only sequence starts expand, so each present number is traversed once.",
    dryRun: [
      "Two Sum on [2,7,11,15], target 9: at 2, complement 7 is absent, then store 2→0.",
      "At 7, complement 2 maps to index 0, so return (0,1) before storing 7; this prevents using one item twice.",
      "For [100,4,200,1,3,2], only 100, 200, and 1 start sequences; expanding from 1 visits 2,3,4 and records length 4.",
    ],
    pitfalls: [
      "Map iteration order is unspecified and can change between iterations",
      "Slices, maps, and functions are not valid map keys; choose a comparable array, struct, or encoded string",
      "Unsynchronized concurrent map writes can panic; protect shared maps or use an ownership pattern",
    ],
    recognition:
      "Reach for a map when the brute force repeatedly asks whether something has been seen, where a complement lives, how often a value occurs, or which objects share a signature. Reach for a set for membership, deduplication, and component boundaries. If sorted order or range queries dominate, a tree or sorted slice may fit better.",
    answer: {
      opening:
        "The nested baseline repeatedly searches prior elements, so I will index exactly the complement information needed by future elements.",
      beats: [
        "Define the key and value semantics, including duplicates.",
        "Check before inserting when the same element cannot pair with itself.",
        "State expected O(1) map operations and O(n) extra storage.",
        "Test zero values with comma-ok, duplicate keys, deterministic output needs, and nil maps.",
      ],
      closing: "The map converts n repeated linear searches into one expected-constant lookup per element.",
    },
    quiz: [
      q("hm-1", "Why use the comma-ok map lookup?", "It distinguishes a missing key from a present key holding the zero value", ["It sorts keys", "It locks the map", "It hashes twice"], "Correct answer: It distinguishes a missing key from a present key holding the zero value. The other options confuse related ideas or skip a key constraint."),
      q("hm-2", "Which type can be a Go map key?", "An array whose element type is comparable", ["A slice", "A map", "A function"], "Correct answer: An array whose element type is comparable. The other options confuse related ideas or skip a key constraint."),
      q("hm-3", "Why check Two Sum's complement before inserting the current value?", "It prevents pairing an element with itself unless an earlier duplicate exists", ["It saves all memory", "It preserves map order", "It handles UTF-8"], "Correct answer: It prevents pairing an element with itself unless an earlier duplicate exists. The other options confuse related ideas or skip a key constraint."),
      q("hm-4", "Is Go map iteration order stable?", "No, callers must sort keys when deterministic order matters", ["Yes, insertion order", "Yes, key order", "Only for integers"], "Correct answer: No, callers must sort keys when deterministic order matters. The other options confuse related ideas or skip a key constraint."),
    ],
  }),
  makeDsaLesson({
    slug: "binary-trees",
    title: "Binary Trees",
    subtitle: "Recursive contracts, traversal order, level frontiers, and path state.",
    difficulty: "intermediate",
    minutes: 50,
    tags: ["tree", "dfs", "bfs", "recursion"],
    clarify: [
      "Is this an arbitrary binary tree or a BST with ordering guarantees?",
      "Does the answer concern nodes, edges, levels, paths, or subtree summaries?",
      "Can depth be large enough to make iterative traversal safer than recursion?",
    ],
    model: [
      "Ask what one recursive call returns for exactly one subtree.",
      "Choose preorder for top-down state, inorder for BST order, and postorder for child summaries.",
      "Use a queue snapshot to process one complete level at a time.",
    ],
    mentalModel:
      "A tree has no cycles under its contract, so a child call can solve an independent subtree. The key is not recursion syntax but the function contract: for max depth, solve(node) returns the number of nodes on the longest downward path; for balance, it can return height or a failure sentinel. BFS replaces recursive depth with an explicit frontier and is ideal for minimum depth or per-level output.",
    invariant:
      "A DFS frame combines complete answers from its children according to its contract. At the beginning of each BFS outer iteration, the queue contains exactly one depth level.",
    diagram: {
      kind: "tree-dfs",
      title: "Postorder information flow",
      caption: "Children return summaries upward; the parent combines them once.",
    },
    implementations: [
      {
        title: "Core DFS: maximum depth and balance in one postorder",
        code: `type TreeNode struct {
	Val         int
	Left, Right *TreeNode
}

func maxDepth(root *TreeNode) int {
	if root == nil {
		return 0
	}
	left, right := maxDepth(root.Left), maxDepth(root.Right)
	if left > right {
		return left + 1
	}
	return right + 1
}

func isBalanced(root *TreeNode) bool {
	var height func(*TreeNode) int
	height = func(node *TreeNode) int {
		if node == nil {
			return 0
		}
		left := height(node.Left)
		if left == -1 {
			return -1
		}
		right := height(node.Right)
		if right == -1 || left-right > 1 || right-left > 1 {
			return -1
		}
		if left > right {
			return left + 1
		}
		return right + 1
	}
	return height(root) != -1
}`,
      },
      {
        title: "Core BFS: level-order traversal",
        code: `func levelOrder(root *TreeNode) [][]int {
	if root == nil {
		return [][]int{}
	}
	queue := []*TreeNode{root}
	result := make([][]int, 0)
	for head := 0; head < len(queue); {
		levelEnd := len(queue)
		level := make([]int, 0, levelEnd-head)
		for head < levelEnd {
			node := queue[head]
			head++
			level = append(level, node.Val)
			if node.Left != nil {
				queue = append(queue, node.Left)
			}
			if node.Right != nil {
				queue = append(queue, node.Right)
			}
		}
		result = append(result, level)
	}
	return result
}`,
      },
      {
        title: "Variant: iterative inorder with an explicit stack",
        code: `func inorder(root *TreeNode) []int {
	result := []int{}
	stack := []*TreeNode{}
	current := root
	for current != nil || len(stack) > 0 {
		for current != nil {
			stack = append(stack, current)
			current = current.Left
		}
		current = stack[len(stack)-1]
		stack = stack[:len(stack)-1]
		result = append(result, current.Val)
		current = current.Right
	}
	return result
}`,
      },
    ],
    time: "O(n) for full DFS or BFS because every node is processed once",
    space: "O(h) DFS stack; O(w) BFS frontier, where h is height and w maximum width",
    complexityNotes:
      "A skewed tree has h=n, so recursive DFS can use O(n) stack. A complete tree can put O(n) nodes in the last-level BFS frontier.",
    dryRun: [
      "For root 4 with children 2 and 7, and 2 with child 1, nil returns height 0.",
      "Node 1 returns 1; node 2 combines left=1 and right=0 to return 2; node 7 returns 1.",
      "Root 4 combines 2 and 1 to return depth 3. BFS snapshots [4], then [2,7], then [1], preserving levels.",
    ],
    pitfalls: [
      "Confusing height measured in nodes with height measured in edges causes off-by-one answers",
      "A naive balance check that recomputes height at every node degrades to O(n²)",
      "BFS must snapshot the level boundary before appending children",
    ],
    recognition:
      "Use postorder when a parent's answer depends on child summaries: height, diameter, balance, subtree sums, delete/free. Use preorder when carrying parent state downward: paths and serialization. Use inorder for BST ordering. Use BFS for levels, nearest nodes, minimum depth, and right-side views.",
    answer: {
      opening:
        "I will define the recursive return value in one sentence, select traversal order from the direction information must flow, and then handle nil as the base case.",
      beats: [
        "Draw one node and its two child results.",
        "Keep global path answers separate from values returned to the parent.",
        "State O(n) and parameterize auxiliary space by height or width.",
        "Test nil, one node, skewed trees, and duplicate values.",
      ],
      closing: "The traversal is correct by structural induction: child contracts hold, then the parent combines them exactly once.",
    },
    quiz: [
      q("tree-1", "Which traversal naturally combines child heights?", "Postorder", ["Preorder only", "Level order only", "Random order"], "Correct answer: Postorder. The other options confuse related ideas or skip a key constraint."),
      q("tree-2", "What does a BFS queue contain at a level boundary?", "Exactly the nodes at the current depth", ["Every ancestor twice", "Only leaves", "A sorted traversal"], "Correct answer: Exactly the nodes at the current depth. The other options confuse related ideas or skip a key constraint."),
      q("tree-3", "Why can a naive balance algorithm be O(n²)?", "It recomputes subtree heights for many ancestors", ["It uses a queue", "Nil checks are expensive", "Trees require sorting"], "Correct answer: It recomputes subtree heights for many ancestors. The other options confuse related ideas or skip a key constraint."),
      q("tree-4", "What is recursive DFS auxiliary space on a skewed tree?", "O(n)", ["O(1)", "O(log n) always", "O(n²)"], "Correct answer: O(n). The other options confuse related ideas or skip a key constraint."),
    ],
  }),
  makeDsaLesson({
    slug: "sorting-searching",
    title: "Sorting & Searching",
    subtitle: "Comparator contracts, stable ordering, divide-and-conquer, and boundary search.",
    difficulty: "intermediate",
    minutes: 50,
    tags: ["sorting", "binary-search", "divide-and-conquer"],
    clarify: [
      "Must equal elements retain their original order, and may input be mutated?",
      "Do I need the full sorted order, only a kth item, or a boundary?",
      "What monotonic order or predicate makes search possible?",
    ],
    model: [
      "Sorting pays O(n log n) once to expose adjacency and monotonic structure.",
      "A comparator must define a consistent strict order, including tie-breakers.",
      "Binary search maintains an interval that still contains the first feasible index.",
    ],
    mentalModel:
      "Comparison sorting repeatedly learns relative order; general comparison sorts need Ω(n log n) comparisons. Merge sort splits, sorts each half, and linearly merges with predictable O(n) extra memory. Go's slices.Sort handles ordered values; slices.SortFunc or sort.Slice handles records. Binary search is not about guessing a target—it finds the transition in a false-then-true predicate.",
    invariant:
      "During merge, output is sorted and contains exactly the consumed prefixes. During lower-bound search on [lo,hi), every index below lo is known false and every index at or above hi is known true.",
    implementations: [
      {
        title: "Core: stable merge sort",
        code: `func mergeSort(nums []int) []int {
	if len(nums) <= 1 {
		return append([]int(nil), nums...)
	}
	mid := len(nums) / 2
	left := mergeSort(nums[:mid])
	right := mergeSort(nums[mid:])
	out := make([]int, 0, len(nums))
	i, j := 0, 0
	for i < len(left) && j < len(right) {
		if left[i] <= right[j] { // <= preserves stability
			out = append(out, left[i])
			i++
		} else {
			out = append(out, right[j])
			j++
		}
	}
	out = append(out, left[i:]...)
	out = append(out, right[j:]...)
	return out
}`,
      },
      {
        title: "Core: hand-written lower bound",
        code: `func lowerBound(nums []int, target int) int {
	lo, hi := 0, len(nums) // answer may be len(nums)
	for lo < hi {
		mid := lo + (hi-lo)/2
		if nums[mid] >= target {
			hi = mid
		} else {
			lo = mid + 1
		}
	}
	return lo
}

func containsSorted(nums []int, target int) bool {
	index := lowerBound(nums, target)
	return index < len(nums) && nums[index] == target
}`,
      },
      {
        title: "Go variant: sort records with deterministic ties",
        code: `type Candidate struct {
	Name  string
	Score int
}

func rank(candidates []Candidate) {
	slices.SortStableFunc(candidates, func(a, b Candidate) int {
		if a.Score != b.Score {
			return cmp.Compare(b.Score, a.Score) // score descending
		}
		return cmp.Compare(a.Name, b.Name) // deterministic tie
	})
}`,
      },
    ],
    time: "Comparison sorting O(n log n); binary search O(log n)",
    space: "Merge sort O(n); in-place library sort depends on implementation; iterative binary search O(1)",
    complexityNotes:
      "Stable sorting matters when an earlier sort or arrival order is a secondary key. Counting/radix methods can beat n log n only by exploiting bounded key structure.",
    dryRun: [
      "lowerBound [1,2,2,4], target 2 starts [0,4); mid=2 is true, so hi=2.",
      "mid=1 is true, so hi=1; mid=0 is false, so lo=1. Return the first 2 at index 1.",
      "For target 5 every predicate is false, lo advances to 4; returning len is a valid insertion position, not an error.",
    ],
    pitfalls: [
      "Using <= in the wrong branch changes lower bound into upper bound",
      "A comparator without deterministic tie handling can produce surprising output",
      "Binary search must allow answers at index 0 and len(nums)",
    ],
    recognition:
      "Sort when ordering makes intervals mergeable, duplicates adjacent, greedy choices provable, or two pointers possible. Use binary search when input is sorted or a decision predicate changes once. Use selection or a heap if only a small top-K is needed.",
    answer: {
      opening: "I will clarify stability and mutation, then define either the comparator or the exact false-to-true predicate.",
      beats: [
        "State whether full sorting is necessary.",
        "Use a half-open binary-search interval and describe both excluded regions.",
        "Protect midpoint arithmetic and validate the returned insertion index.",
        "Test empty input, all equal keys, first/last boundary, and absent targets.",
      ],
      closing: "The search halves the only interval that can contain the transition, so it terminates in O(log n).",
    },
    quiz: [
      q("sort-1", "What does lower bound return?", "The first index whose value is at least the target", ["Any matching index", "The last smaller index", "Always a present target"], "Correct answer: The first index whose value is at least the target. The other options confuse related ideas or skip a key constraint."),
      q("sort-2", "Why use <= when merge chooses from the left half?", "Equal left elements remain before equal right elements, preserving stability", ["It removes duplicates", "It makes search constant", "It reverses output"], "Correct answer: Equal left elements remain before equal right elements, preserving stability. The other options confuse related ideas or skip a key constraint."),
      q("sort-3", "What must a custom comparator provide?", "A consistent strict ordering with intended tie behavior", ["Random answers", "Only equality", "A hash"], "Correct answer: A consistent strict ordering with intended tie behavior. The other options confuse related ideas or skip a key constraint."),
      q("sort-4", "Why can lowerBound return len(nums)?", "The target belongs after every existing value", ["The search failed internally", "The slice is nil", "Midpoint overflowed"], "Correct answer: The target belongs after every existing value. The other options confuse related ideas or skip a key constraint."),
    ],
  }),
  makeDsaLesson({
    slug: "tries-and-bitmask",
    title: "Tries & Bitmask State",
    subtitle: "Prefix sharing, alphabet trade-offs, subset encoding, and compact visited state.",
    difficulty: "advanced",
    minutes: 50,
    tags: ["trie", "prefix", "bitmask", "subset"],
    clarify: [
      "Are operations exact-word lookup, prefix lookup, wildcard matching, or ranked suggestions?",
      "Is the alphabet fixed and small enough for child arrays, or sparse enough for maps?",
      "Is n small enough that 2ⁿ subset states fit the time and mask width?",
    ],
    model: [
      "A trie node represents a prefix; each edge appends one symbol.",
      "A bit at position i represents one boolean fact, commonly whether item i is selected.",
      "Mask transitions set, clear, toggle, or test bits without storing a []bool key.",
    ],
    mentalModel:
      "Tries trade memory for prefix-directed lookup: operations cost word length rather than number of stored words. Array children are fast but sparse; map children save memory for broad alphabets. A bitmask packs a small set into an integer, making it comparable and ideal for memo keys such as (position, mask). Bits model independent boolean choices, not arbitrary large collections.",
    invariant:
      "Following edges for symbols s[:i] lands at the unique node representing that prefix. In subset enumeration, mask's bit i is one exactly when nums[i] belongs to that subset.",
    implementations: [
      {
        title: "Core: lowercase trie insert, exact search, and prefix search",
        code: `type TrieNode struct {
	Children [26]*TrieNode
	IsWord   bool
}

type Trie struct{ Root *TrieNode }

func NewTrie() *Trie { return &Trie{Root: &TrieNode{}} }

func (t *Trie) Insert(word string) {
	node := t.Root
	for i := range word {
		index := word[i] - 'a'
		if node.Children[index] == nil {
			node.Children[index] = &TrieNode{}
		}
		node = node.Children[index]
	}
	node.IsWord = true
}

func (t *Trie) walk(text string) *TrieNode {
	node := t.Root
	for i := range text {
		index := text[i] - 'a'
		if index >= 26 || node.Children[index] == nil {
			return nil
		}
		node = node.Children[index]
	}
	return node
}

func (t *Trie) Search(word string) bool {
	node := t.walk(word)
	return node != nil && node.IsWord
}

func (t *Trie) HasPrefix(prefix string) bool { return t.walk(prefix) != nil }`,
      },
      {
        title: "Core bitmask: enumerate every subset",
        code: `func subsetsByMask(nums []int) [][]int {
	if len(nums) >= bits.UintSize {
		panic("too many values for an int mask")
	}
	result := make([][]int, 0, 1<<len(nums))
	for mask := 0; mask < 1<<len(nums); mask++ {
		subset := []int{}
		for i, value := range nums {
			if mask&(1<<i) != 0 {
				subset = append(subset, value)
			}
		}
		result = append(result, subset)
	}
	return result
}`,
      },
      {
        title: "Variant: shortest route that visits every graph node",
        code: `func shortestVisitAll(graph [][]int) int {
	n := len(graph)
	if n <= 1 {
		return 0
	}
	full := 1<<n - 1
	type state struct{ node, mask, distance int }
	queue := make([]state, 0)
	seen := make([][]bool, n)
	for node := 0; node < n; node++ {
		seen[node] = make([]bool, 1<<n)
		mask := 1 << node
		seen[node][mask] = true
		queue = append(queue, state{node, mask, 0})
	}
	for head := 0; head < len(queue); head++ {
		current := queue[head]
		for _, next := range graph[current.node] {
			mask := current.mask | 1<<next
			if mask == full {
				return current.distance + 1
			}
			if !seen[next][mask] {
				seen[next][mask] = true
				queue = append(queue, state{next, mask, current.distance + 1})
			}
		}
	}
	return -1
}`,
      },
    ],
    time: "Trie operation O(L); subset enumeration O(n·2ⁿ); visit-all BFS O((V+E)·2ⱽ)",
    space: "Trie O(total stored symbols); subset/state masks up to O(V·2ⱽ)",
    complexityNotes:
      "A [26]*Node allocates 26 pointer slots per node. For Unicode or sparse branching, map[rune]*Node often uses much less memory at some lookup overhead.",
    dryRun: [
      "For nums [a,b,c], mask 5 is binary 101, so bits 0 and 2 select [a,c].",
      "Setting bit 1 uses mask | (1<<1), producing 111; clearing uses mask &^ (1<<1), producing 101.",
      "In visit-all BFS, (node=2, mask=101) differs from (node=2, mask=111); physical location alone is insufficient visited state.",
    ],
    pitfalls: [
      "Exact search must check IsWord; reaching a prefix node is not enough",
      "Array-child indexing must validate the alphabet before subtraction",
      "1<<n overflows or becomes infeasible long before large n",
    ],
    recognition:
      "Use a trie for many shared-prefix strings, autocomplete, dictionary prefix pruning, or wildcard word search. Use a bitmask when at most roughly 20 independent items form subset state, or when BFS/DP visited identity includes a small set of collected items.",
    answer: {
      opening: "I will quantify alphabet size and n first because they determine whether trie arrays and exponential masks are viable.",
      beats: [
        "Define what each trie node or mask bit means.",
        "Separate prefix existence from terminal-word existence.",
        "For state search, include both position and mask in visited.",
        "State exponential limits explicitly rather than hiding them behind bit operations.",
      ],
      closing: "These representations are powerful because they make the needed structural state directly indexable.",
    },
    quiz: [
      q("tb-1", "Why does exact trie search check IsWord?", "A stored longer word may share the queried prefix without the prefix being a word", ["Children are sorted", "Maps require it", "It checks UTF-8 validity"], "Correct answer: A stored longer word may share the queried prefix without the prefix being a word. The other options confuse related ideas or skip a key constraint."),
      q("tb-2", "What does mask | (1<<i) do?", "Sets bit i", ["Clears bit i", "Toggles every bit", "Counts bits"], "Correct answer: Sets bit i. The other options confuse related ideas or skip a key constraint."),
      q("tb-3", "Why is visited[node] insufficient in a collect-all problem?", "The same node with different collected masks has different future possibilities", ["Nodes repeat values", "BFS needs weights", "Tries are recursive"], "Correct answer: The same node with different collected masks has different future possibilities. The other options confuse related ideas or skip a key constraint."),
      q("tb-4", "What is the fundamental bitmask-subset limit?", "The state count grows as 2ⁿ", ["Masks cannot store zero", "Bits are unordered", "Go has no shifts"], "Correct answer: The state count grows as 2ⁿ. The other options confuse related ideas or skip a key constraint."),
    ],
  }),
  makeDsaLesson({
    slug: "shortest-paths-dijkstra",
    title: "Shortest Paths: Dijkstra, Bellman-Ford & Floyd-Warshall",
    subtitle: "Single-source and all-pairs path contracts, reconstruction, and negative cycles.",
    difficulty: "advanced",
    minutes: 55,
    tags: ["shortest-path", "dijkstra", "bellman-ford", "floyd-warshall"],
    prerequisites: ["graphs-advanced"],
    clarify: [
      "Single source, one pair, multi-source, or all pairs?",
      "Can weights be negative, and should reachable negative cycles be reported?",
      "Do I need only distances or the actual vertex sequence?",
    ],
    model: [
      "Distance is an upper bound improved by edge relaxation.",
      "Record predecessor when a relaxation succeeds to reconstruct a path.",
      "Choose algorithm by weight sign, graph density, and source count.",
    ],
    mentalModel:
      "Shortest paths form a state graph where path cost accumulates. BFS is Dijkstra specialized to unit weights; 0-1 BFS uses a deque for weights zero and one. Bellman-Ford propagates paths of at most one additional edge per pass and detects a reachable negative cycle on an extra pass. Floyd-Warshall incrementally allows intermediate vertices 0..k and is often simplest for small dense all-pairs input.",
    invariant:
      "After Bellman-Ford pass i, distances are optimal among paths using at most i edges. After Floyd step k, dist[i][j] is optimal using only vertices 0..k as intermediates.",
    diagram: {
      kind: "heap-shape",
      title: "Shortest-distance frontier",
      caption: "Priority is total path cost so far, not the last edge weight.",
    },
    implementations: [
      {
        title: "Core: Dijkstra with parent reconstruction",
        code: `func shortestWeightedPath(
	graph [][]WeightedEdge, source, target int,
) ([]int, int64, bool) {
	distance := make([]int64, len(graph))
	parent := make([]int, len(graph))
	for i := range distance {
		distance[i], parent[i] = math.MaxInt64, -1
	}
	distance[source] = 0
	pq := &DistanceHeap{{Node: source, Distance: 0}}
	for pq.Len() > 0 {
		current := heap.Pop(pq).(DistanceItem)
		if current.Distance != distance[current.Node] {
			continue
		}
		for _, edge := range graph[current.Node] {
			candidate := current.Distance + int64(edge.Weight)
			if candidate < distance[edge.To] {
				distance[edge.To] = candidate
				parent[edge.To] = current.Node
				heap.Push(pq, DistanceItem{edge.To, candidate})
			}
		}
	}
	if distance[target] == math.MaxInt64 {
		return nil, 0, false
	}
	path := []int{}
	for node := target; node != -1; node = parent[node] {
		path = append(path, node)
	}
	slices.Reverse(path)
	return path, distance[target], true
}`,
      },
      {
        title: "All pairs: Floyd-Warshall",
        code: `func floydWarshall(matrix [][]int64) [][]int64 {
	n := len(matrix)
	distance := make([][]int64, n)
	for i := range matrix {
		distance[i] = append([]int64(nil), matrix[i]...)
	}
	for through := 0; through < n; through++ {
		for from := 0; from < n; from++ {
			if distance[from][through] == math.MaxInt64 {
				continue
			}
			for to := 0; to < n; to++ {
				if distance[through][to] == math.MaxInt64 {
					continue
				}
				candidate := distance[from][through] + distance[through][to]
				if candidate < distance[from][to] {
					distance[from][to] = candidate
				}
			}
		}
	}
	return distance
}`,
      },
      {
        title: "Special case: 0-1 BFS with a deque",
        code: `func zeroOneBFS(graph [][]WeightedEdge, source int) []int {
	distance := make([]int, len(graph))
	for i := range distance {
		distance[i] = math.MaxInt
	}
	distance[source] = 0
	deque := list.New()
	deque.PushFront(source)
	for deque.Len() > 0 {
		front := deque.Front()
		node := front.Value.(int)
		deque.Remove(front)
		for _, edge := range graph[node] {
			nextDistance := distance[node] + edge.Weight
			if nextDistance < distance[edge.To] {
				distance[edge.To] = nextDistance
				if edge.Weight == 0 {
					deque.PushFront(edge.To)
				} else {
					deque.PushBack(edge.To)
				}
			}
		}
	}
	return distance
}`,
      },
    ],
    time: "Dijkstra O((V+E)log V); Bellman-Ford O(VE); Floyd-Warshall O(V³); 0-1 BFS O(V+E)",
    space: "O(V+E) plus frontier for single-source; O(V²) for Floyd-Warshall",
    complexityNotes:
      "An unreachable infinity sentinel must never participate in addition. Negative cycles only matter to a source if reachable from that source.",
    dryRun: [
      "For A→B=5, A→C=2, C→B=1: Dijkstra first records B=5 and C=2.",
      "Popping C relaxes B to 3 and sets parent[B]=C; the old B=5 entry later becomes stale.",
      "Parent chain B→C→A reverses to A→C→B with total cost 3.",
    ],
    pitfalls: [
      "Breaking when target is first inserted into the heap is wrong; break only when its current best item is popped",
      "Adding to an infinity sentinel can overflow",
      "A parent should update only with the relaxation whose distance is accepted",
    ],
    recognition:
      "Match the contract: unit weights → BFS; zero/one → deque; nonnegative → Dijkstra; negative edges → Bellman-Ford; DAG → topological relaxation; small all-pairs → Floyd-Warshall. If cost depends on stops, fuel, or keys, expand the state.",
    answer: {
      opening: "Weight sign and source scope determine the algorithm, so I will ask those before drawing the relaxation loop.",
      beats: [
        "Define infinity, distance, and parent arrays.",
        "Explain when a distance is tentative versus final.",
        "Name stale-entry handling and overflow guards.",
        "Give a concrete alternative for negative edges and all-pairs requirements.",
      ],
      closing: "The selected algorithm follows directly from the edge-weight contract rather than from graph size alone.",
    },
    quiz: [
      q("sp-1", "When may Dijkstra stop for one target?", "When the target's current non-stale item is popped", ["When target is first pushed", "Before any relaxation", "After sorting vertices"], "Correct answer: When the target's current non-stale item is popped. The other options confuse related ideas or skip a key constraint."),
      q("sp-2", "What does Bellman-Ford's extra pass detect?", "A reachable negative cycle if another relaxation succeeds", ["A minimum spanning tree", "A trie prefix", "Only disconnected nodes"], "Correct answer: A reachable negative cycle if another relaxation succeeds. The other options confuse related ideas or skip a key constraint."),
      q("sp-3", "What is Floyd-Warshall's main use?", "All-pairs shortest paths on modest-size graphs", ["Streaming top K", "Unweighted components only", "Hash lookup"], "Correct answer: All-pairs shortest paths on modest-size graphs. The other options confuse related ideas or skip a key constraint."),
      q("sp-4", "Why use 0-1 BFS?", "Deque ordering replaces a heap when weights are only zero or one", ["It handles arbitrary negatives", "It computes an MST", "It removes visited state"], "Correct answer: Deque ordering replaces a heap when weights are only zero or one. The other options confuse related ideas or skip a key constraint."),
    ],
  }),
  makeDsaLesson({
    slug: "greedy-algorithms",
    title: "Greedy Algorithms",
    subtitle: "Local choices, exchange proofs, interval scheduling, and failure counterexamples.",
    difficulty: "advanced",
    minutes: 50,
    tags: ["greedy", "proof", "intervals"],
    clarify: [
      "What objective is optimized, and what choices become irreversible?",
      "Can an optimal solution exchange its first differing choice for the greedy choice without worsening?",
      "Does sorting expose the safe local decision, or does a small counterexample refute it?",
    ],
    model: [
      "Greedy commits one locally best choice and never revisits it.",
      "Correctness needs an exchange, staying-ahead, or cut proof.",
      "If future value depends on a capacity/state trade-off, DP may be necessary.",
    ],
    mentalModel:
      "A greedy algorithm is not merely a fast heuristic. It is correct only when problem structure guarantees that one locally optimal choice belongs to some global optimum. In interval scheduling, replacing the first selected interval with the earliest-finishing compatible interval leaves at least as much room. In jump reachability, one number summarizes every path: the farthest index reachable from the processed prefix.",
    invariant:
      "For interval scheduling, selected intervals are compatible and the last end time is no later than that of any equally sized selection from the processed prefix. For Jump Game, farthest is the maximum reachable index using processed positions.",
    implementations: [
      {
        title: "Core: maximum compatible intervals",
        code: `type Interval struct{ Start, End int }

func maximumActivities(intervals []Interval) []Interval {
	slices.SortFunc(intervals, func(a, b Interval) int {
		if a.End != b.End {
			return cmp.Compare(a.End, b.End)
		}
		return cmp.Compare(a.Start, b.Start)
	})
	selected := []Interval{}
	lastEnd := math.MinInt
	for _, interval := range intervals {
		if interval.Start >= lastEnd {
			selected = append(selected, interval)
			lastEnd = interval.End
		}
	}
	return selected
}`,
      },
      {
        title: "Core: Jump Game farthest reachable prefix",
        code: `func canReachEnd(nums []int) bool {
	farthest := 0
	for index, jump := range nums {
		if index > farthest {
			return false
		}
		if index+jump > farthest {
			farthest = index + jump
		}
		if farthest >= len(nums)-1 {
			return true
		}
	}
	return len(nums) == 0 || farthest >= len(nums)-1
}`,
      },
      {
        title: "Variant: minimum arrows for balloon intervals",
        code: `func minimumArrows(intervals []Interval) int {
	if len(intervals) == 0 {
		return 0
	}
	slices.SortFunc(intervals, func(a, b Interval) int {
		return cmp.Compare(a.End, b.End)
	})
	arrows, position := 1, intervals[0].End
	for _, interval := range intervals[1:] {
		if interval.Start > position {
			arrows++
			position = interval.End
		}
	}
	return arrows
}`,
      },
    ],
    time: "Sort-then-scan greedy O(n log n); already ordered Jump Game O(n)",
    space: "O(1) extra beyond sort/output, subject to sorting implementation",
    complexityNotes:
      "Fractional knapsack is greedy by value density; 0/1 knapsack is not. Similar wording does not imply the same proof structure.",
    dryRun: [
      "Intervals [(1,4),(2,3),(3,5),(4,7)] sort by end to [(2,3),(1,4),(3,5),(4,7)].",
      "Choose (2,3); skip (1,4); choose (3,5); skip (4,7), giving two activities.",
      "Choosing (1,4) first can still give two here, but earliest finish never leaves less room; the exchange argument proves safety for every input.",
    ],
    pitfalls: [
      "A plausible local rule without a proof is not a correct greedy algorithm",
      "Sorting by start or shortest duration does not solve activity selection",
      "Overflow in index+jump can corrupt the farthest invariant under unconstrained integers",
    ],
    recognition:
      "Reach for greedy when the problem asks maximum non-overlap, minimum resources after sorting, cheapest next edge across a cut, canonical scheduling, or farthest reachable prefix—and you can articulate an exchange or staying-ahead proof. Search for tiny counterexamples before committing.",
    answer: {
      opening: "I have a candidate local rule, but I will justify it with an exchange argument before treating it as an algorithm.",
      beats: [
        "Name the sort key and why alternatives fail.",
        "State the processed-prefix invariant.",
        "Show how any optimal solution can adopt the greedy first choice without loss.",
        "Test ties, touching intervals, empty input, and a counterexample to a tempting wrong rule.",
      ],
      closing: "The proof, not the short code, is what distinguishes this from a heuristic.",
    },
    quiz: [
      q("gr-1", "Why select the earliest-finishing compatible interval?", "It leaves at least as much room as any alternative first choice", ["It is the shortest interval", "It starts earliest", "It avoids sorting"], "Correct answer: It leaves at least as much room as any alternative first choice. The other options confuse related ideas or skip a key constraint."),
      q("gr-2", "What is an exchange argument?", "A proof that replacing an optimal choice with the greedy choice does not worsen the solution", ["A map operation", "A randomized test", "A heap deletion"], "Correct answer: A proof that replacing an optimal choice with the greedy choice does not worsen the solution. The other options confuse related ideas or skip a key constraint."),
      q("gr-3", "Why is 0/1 knapsack not generally greedy by value density?", "An indivisible high-density choice can block a better combination", ["Values cannot be sorted", "Capacity is negative", "DP cannot solve it"], "Correct answer: An indivisible high-density choice can block a better combination. The other options confuse related ideas or skip a key constraint."),
      q("gr-4", "What does Jump Game's farthest variable summarize?", "The maximum index reachable from the processed prefix", ["The minimum jump value", "A chosen path only", "The array length"], "Correct answer: The maximum index reachable from the processed prefix. The other options confuse related ideas or skip a key constraint."),
    ],
  }),
  makeDsaLesson({
    slug: "intervals-and-math",
    title: "Intervals & Number Theory Essentials",
    subtitle: "Endpoint semantics, sweeps, Euclid, modular arithmetic, and prime preprocessing.",
    difficulty: "intermediate",
    minutes: 55,
    tags: ["interval", "line-sweep", "gcd", "modular-arithmetic"],
    clarify: [
      "Are intervals closed, open, or half-open, and do touching endpoints overlap?",
      "Do I need merged ranges, maximum concurrency, or resource assignments?",
      "Can multiplication overflow before applying modulus, and are inputs signed?",
    ],
    model: [
      "Sort intervals to make every future start nondecreasing.",
      "A sweep converts starts and ends into ordered count changes.",
      "Euclid preserves gcd under (a,b) → (b,a mod b); exponentiation squares powers by bits.",
    ],
    mentalModel:
      "Intervals become manageable after explicit endpoint semantics and sorting. Merging tracks one current union; meeting-room counting tracks active intervals. Half-open [start,end) is production-friendly because an ending meeting frees a room for one starting at the same time. Number theory similarly relies on preserved structure: gcd divides both a and b exactly when it divides b and a mod b, while binary exponentiation decomposes an exponent into powers of two.",
    invariant:
      "Merged output is disjoint, sorted, and exactly covers every processed interval. In a chronological sweep, active equals starts seen minus ends seen. Euclid preserves the gcd each iteration.",
    implementations: [
      {
        title: "Core intervals: merge closed ranges",
        code: `func mergeIntervals(intervals []Interval) []Interval {
	if len(intervals) == 0 {
		return []Interval{}
	}
	slices.SortFunc(intervals, func(a, b Interval) int {
		return cmp.Compare(a.Start, b.Start)
	})
	result := []Interval{intervals[0]}
	for _, current := range intervals[1:] {
		last := &result[len(result)-1]
		if current.Start <= last.End { // closed intervals
			if current.End > last.End {
				last.End = current.End
			}
		} else {
			result = append(result, current)
		}
	}
	return result
}`,
      },
      {
        title: "Variant: minimum rooms for half-open meetings",
        code: `func minimumRooms(meetings []Interval) int {
	starts := make([]int, len(meetings))
	ends := make([]int, len(meetings))
	for i, meeting := range meetings {
		starts[i], ends[i] = meeting.Start, meeting.End
	}
	slices.Sort(starts)
	slices.Sort(ends)
	active, best, endIndex := 0, 0, 0
	for _, start := range starts {
		for endIndex < len(ends) && ends[endIndex] <= start {
			active--
			endIndex++
		}
		active++
		best = max(best, active)
	}
	return best
}`,
      },
      {
        title: "Core math: GCD and modular exponentiation",
        code: `func gcd(a, b int64) int64 {
	if a < 0 {
		a = -a
	}
	if b < 0 {
		b = -b
	}
	for b != 0 {
		a, b = b, a%b
	}
	return a
}

func modPow(base, exponent, modulus int64) int64 {
	if modulus <= 0 || exponent < 0 {
		panic("unsupported modulus or exponent")
	}
	result := int64(1) % modulus
	base %= modulus
	for exponent > 0 {
		if exponent&1 == 1 {
			result = result * base % modulus
		}
		base = base * base % modulus
		exponent >>= 1
	}
	return result
}`,
      },
    ],
    time: "Interval sorting O(n log n); gcd O(log min(a,b)); modPow O(log exponent)",
    space: "O(n) for separated endpoints; O(1) for merge scan beyond output and for shown math",
    complexityNotes:
      "The modular multiplication shown assumes int64 products do not overflow; use big.Int or overflow-safe multiplication when operands approach 64-bit limits.",
    dryRun: [
      "Merge closed intervals [1,3],[2,6],[8,10]: start with [1,3]; 2≤3 extends end to 6; 8>6 starts a new range.",
      "For half-open meetings [0,10) and [10,20), process end 10 before start 10, so active returns to zero and one room suffices.",
      "gcd(48,18): (48,18)→(18,12)→(12,6)→(6,0), so gcd is 6.",
    ],
    pitfalls: [
      "Touching endpoints overlap for closed intervals but not for half-open intervals",
      "Returning input sub-slices can mutate caller-owned interval storage",
      "Multiplying before modulus can overflow even when the final remainder is small",
    ],
    recognition:
      "Sort and sweep when the prompt says overlap, schedule, calendar, coverage, rooms, concurrency, or insert range. Reach for gcd/lcm on divisibility and periodic alignment, sieve on many prime queries, and modular exponentiation on huge powers.",
    answer: {
      opening: "I will define endpoint semantics first; that single choice determines the overlap comparison and event tie order.",
      beats: [
        "Sort by the endpoint that matches the objective.",
        "State what the current merged range or active count represents.",
        "For math, state the identity preserved each iteration.",
        "Test empty ranges, equal endpoints, negative inputs, zero, modulus one, and overflow.",
      ],
      closing: "Once semantics are explicit, both the interval sweep and arithmetic loop follow a small invariant.",
    },
    quiz: [
      q("im-1", "Do [0,10) and [10,20) overlap?", "No, half-open intervals release the endpoint before the next start", ["Yes, always", "Only in Go", "Only if sorted"], "Correct answer: No, half-open intervals release the endpoint before the next start. The other options confuse related ideas or skip a key constraint."),
      q("im-2", "What does Euclid preserve?", "gcd(a,b)=gcd(b,a mod b)", ["a+b", "a·b", "Prime count"], "Correct answer: gcd(a,b)=gcd(b,a mod b). The other options confuse related ideas or skip a key constraint."),
      q("im-3", "Why is modular multiplication still overflow-sensitive?", "The product may overflow before the modulus is applied", ["Modulus increases values", "int64 has no multiplication", "Exponents are strings"], "Correct answer: The product may overflow before the modulus is applied. The other options confuse related ideas or skip a key constraint."),
      q("im-4", "What does maximum sweep active count represent?", "Peak simultaneous interval usage", ["Total duration", "Number of endpoints", "Minimum start"], "Correct answer: Peak simultaneous interval usage. The other options confuse related ideas or skip a key constraint."),
    ],
  }),
  makeDsaLesson({
    slug: "string-algorithms",
    title: "String Algorithms: KMP & Rabin–Karp",
    subtitle: "Prefix fallback, rolling hashes, collision checks, and linear pattern matching.",
    difficulty: "advanced",
    minutes: 50,
    tags: ["string", "kmp", "rabin-karp", "pattern-matching"],
    prerequisites: ["strings-and-runes"],
    clarify: [
      "One pattern or many, first match or all matches, and are overlapping matches allowed?",
      "Are byte-based indices acceptable under the input alphabet?",
      "Is deterministic worst-case time required, or is verified hashing acceptable?",
    ],
    model: [
      "KMP reuses the longest prefix that is also a suffix after mismatch.",
      "The text pointer never moves backward; only the matched pattern length falls back.",
      "Rabin–Karp compares rolling fingerprints, then verifies bytes on equal hashes.",
    ],
    mentalModel:
      "Naive matching restarts the pattern after mismatch and can re-read the same text region O(m) times. KMP's LPS table records how much of the pattern is still known to match: lps[i] is the longest proper prefix of pattern[:i+1] that is also a suffix. Rabin–Karp treats each window as a polynomial hash updated in O(1), which is especially useful for multiple equal-length patterns or duplicate substring detection.",
    invariant:
      "In KMP, pattern[:matched] equals the suffix of text[:textIndex] currently aligned. In rolling hash, windowHash equals the polynomial fingerprint of exactly text[start:start+m].",
    implementations: [
      {
        title: "Core: naive search baseline",
        code: `func naiveMatches(text, pattern string) []int {
	if len(pattern) == 0 {
		return []int{}
	}
	result := []int{}
	for start := 0; start+len(pattern) <= len(text); start++ {
		matched := true
		for j := range pattern {
			if text[start+j] != pattern[j] {
				matched = false
				break
			}
		}
		if matched {
			result = append(result, start)
		}
	}
	return result
}`,
      },
      {
        title: "Optimal deterministic search: KMP",
        code: `func buildLPS(pattern string) []int {
	lps := make([]int, len(pattern))
	for i, length := 1, 0; i < len(pattern); {
		if pattern[i] == pattern[length] {
			length++
			lps[i] = length
			i++
		} else if length > 0 {
			length = lps[length-1]
		} else {
			i++
		}
	}
	return lps
}

func kmpMatches(text, pattern string) []int {
	if len(pattern) == 0 {
		return []int{}
	}
	lps := buildLPS(pattern)
	result := []int{}
	for i, matched := 0, 0; i < len(text); {
		if text[i] == pattern[matched] {
			i++
			matched++
			if matched == len(pattern) {
				result = append(result, i-matched)
				matched = lps[matched-1] // allow overlap
			}
		} else if matched > 0 {
			matched = lps[matched-1]
		} else {
			i++
		}
	}
	return result
}`,
      },
      {
        title: "Variant: verified Rabin–Karp rolling hash",
        code: `func rabinKarp(text, pattern string) []int {
	n, m := len(text), len(pattern)
	if m == 0 || m > n {
		return []int{}
	}
	const base, mod int64 = 257, 1_000_000_007
	var targetHash, windowHash, highest int64 = 0, 0, 1
	for i := 1; i < m; i++ {
		highest = highest * base % mod
	}
	for i := 0; i < m; i++ {
		targetHash = (targetHash*base + int64(pattern[i])) % mod
		windowHash = (windowHash*base + int64(text[i])) % mod
	}
	result := []int{}
	for start := 0; start+m <= n; start++ {
		if windowHash == targetHash && text[start:start+m] == pattern {
			result = append(result, start)
		}
		if start+m < n {
			windowHash = (windowHash - int64(text[start])*highest%mod + mod) % mod
			windowHash = (windowHash*base + int64(text[start+m])) % mod
		}
	}
	return result
}`,
      },
    ],
    time: "Naive O(nm); KMP O(n+m); Rabin–Karp expected O(n+m), worst O(nm) with repeated verified collisions",
    space: "KMP O(m) LPS; rolling hash O(1) excluding matches",
    complexityNotes:
      "These implementations return byte offsets and compare bytes. Unicode code-point matching requires consistently converting both strings and mapping result positions as required.",
    dryRun: [
      "Pattern “abab” has LPS [0,0,1,2]: after matching “ab” again, a mismatch can retain a shorter known prefix.",
      "Search text “ababab”: first match ends at index 4 and starts at 0; fallback matched=lps[3]=2 rather than zero.",
      "Continue with existing “ab” knowledge and find overlapping match at index 2 without moving the text pointer backward.",
    ],
    pitfalls: [
      "After a full KMP match, falling back to zero loses overlapping matches",
      "A rolling-hash equality is not proof; verify the actual substring",
      "Empty-pattern semantics must be chosen explicitly to avoid indexing pattern[0]",
    ],
    recognition:
      "Use KMP when one pattern needs deterministic linear matching or streaming fallback. Use Rabin–Karp for rolling-window equality, many same-length patterns, or duplicate-substring candidates. Use a trie/Aho–Corasick for many variable-length patterns.",
    answer: {
      opening: "I will establish empty-pattern and byte-index semantics, show the naive restart cost, then explain how prefix knowledge avoids it.",
      beats: [
        "Define LPS precisely as a proper prefix also equal to a suffix.",
        "Keep the text pointer monotonic on mismatch.",
        "Allow overlap after a match through LPS fallback.",
        "For hashes, normalize subtraction and verify collisions.",
      ],
      closing: "KMP's text index never retreats and the pattern index has amortized linear fallback, so total work is O(n+m).",
    },
    quiz: [
      q("kmp-1", "What does lps[i] store?", "The longest proper prefix of pattern[:i+1] that is also its suffix", ["A text index", "A hash collision count", "The next character"], "Correct answer: The longest proper prefix of pattern[:i+1] that is also its suffix. The other options confuse related ideas or skip a key constraint."),
      q("kmp-2", "Does KMP move the text index backward?", "No; mismatch changes only the matched pattern prefix when possible", ["Yes, after every mismatch", "Only for ASCII", "Only after a match"], "Correct answer: No; mismatch changes only the matched pattern prefix when possible. The other options confuse related ideas or skip a key constraint."),
      q("kmp-3", "Why verify a Rabin–Karp hash match?", "Distinct substrings can collide to the same hash", ["Hashes are always zero", "Verification improves sorting", "Modulus is negative"], "Correct answer: Distinct substrings can collide to the same hash. The other options confuse related ideas or skip a key constraint."),
      q("kmp-4", "How does KMP retain overlapping matches?", "After a match, set matched to lps[matched-1]", ["Skip pattern length bytes", "Clear the LPS table", "Reverse the text"], "Correct answer: After a match, set matched to lps[matched-1]. The other options confuse related ideas or skip a key constraint."),
    ],
  }),
  makeDsaLesson({
    slug: "binary-search-patterns",
    title: "Binary Search Patterns",
    subtitle: "Exact search, first/last boundaries, rotated arrays, and answer-space feasibility.",
    difficulty: "intermediate",
    minutes: 50,
    tags: ["binary-search", "boundary", "answer-space"],
    prerequisites: ["sorting-searching"],
    clarify: [
      "Am I finding an exact item, the first true position, or an optimal numeric answer?",
      "What predicate is monotonic, and which side is feasible?",
      "Are duplicates present, and can the answer lie just outside existing elements?",
    ],
    model: [
      "Reduce every variant to first true on a half-open domain whenever possible.",
      "Write the predicate sentence before midpoint code.",
      "For answer search, bounds must include every possible answer and check(mid) must be monotonic.",
    ],
    mentalModel:
      "Binary search discards half a totally ordered candidate domain using one monotonic observation. Exact search is a special case; boundary searches are more reusable. In answer-space problems, candidates are capacities, speeds, distances, or times rather than indices. A feasibility function maps them to false then true (minimum feasible) or true then false (maximum feasible), which you normalize before searching.",
    invariant:
      "For first true on [lo,hi), every candidate below lo is proven false and every candidate at or above hi is proven true; the unknown region shrinks until lo==hi.",
    implementations: [
      {
        title: "Core: reusable first-true and equal range",
        code: `func firstTrue(n int, predicate func(int) bool) int {
	lo, hi := 0, n
	for lo < hi {
		mid := lo + (hi-lo)/2
		if predicate(mid) {
			hi = mid
		} else {
			lo = mid + 1
		}
	}
	return lo
}

func equalRange(nums []int, target int) (int, int) {
	left := firstTrue(len(nums), func(i int) bool {
		return nums[i] >= target
	})
	right := firstTrue(len(nums), func(i int) bool {
		return nums[i] > target
	})
	if left == len(nums) || nums[left] != target {
		return -1, -1
	}
	return left, right - 1
}`,
      },
      {
        title: "Variant: minimum ship capacity (search the answer)",
        code: `func minimumCapacity(weights []int, days int) int {
	lo, hi := 0, 0
	for _, weight := range weights {
		lo = max(lo, weight)
		hi += weight
	}
	for lo < hi {
		mid := lo + (hi-lo)/2
		usedDays, load := 1, 0
		for _, weight := range weights {
			if load+weight > mid {
				usedDays++
				load = 0
			}
			load += weight
		}
		if usedDays <= days {
			hi = mid
		} else {
			lo = mid + 1
		}
	}
	return lo
}`,
      },
      {
        title: "Variant: search a rotated distinct array",
        code: `func searchRotated(nums []int, target int) int {
	lo, hi := 0, len(nums)-1
	for lo <= hi {
		mid := lo + (hi-lo)/2
		if nums[mid] == target {
			return mid
		}
		if nums[lo] <= nums[mid] { // left half sorted
			if nums[lo] <= target && target < nums[mid] {
				hi = mid - 1
			} else {
				lo = mid + 1
			}
		} else { // right half sorted
			if nums[mid] < target && target <= nums[hi] {
				lo = mid + 1
			} else {
				hi = mid - 1
			}
		}
	}
	return -1
}`,
      },
    ],
    time: "O(log n) predicate calls; answer search O(check-cost · log(range))",
    space: "O(1) iterative auxiliary space",
    complexityNotes:
      "A linear O(n) feasibility scan inside binary search gives O(n log R). Duplicate values in a rotated array can destroy the strict half-selection and degrade worst-case time to O(n).",
    dryRun: [
      "Ship weights [3,2,2,4,1,4] in 3 days: lower bound is max=4, upper bound sum=16.",
      "At capacity 10, two days suffice, so 10 is feasible and hi moves down; at 7, three days suffice; at 5, four days are needed.",
      "The transition is false through 5 and true from 6, so minimum feasible capacity is 6.",
    ],
    pitfalls: [
      "Using an inclusive template while reasoning about half-open bounds creates off-by-one loops",
      "A non-monotonic check function makes binary search invalid",
      "Answer bounds that exclude the true optimum silently return a plausible wrong value",
    ],
    recognition:
      "Reach for binary search on sorted lookup, first/last occurrence, insertion point, rotated order, peak, or when a question asks minimum possible maximum or maximum possible minimum. Test whether a guessed answer can be checked and whether feasibility changes only once.",
    answer: {
      opening: "I will phrase a monotonic predicate and identify the exact transition we need before choosing bounds.",
      beats: [
        "Give a definitely false/true boundary argument.",
        "Use one consistent interval convention.",
        "Explain why each branch discards only impossible answers.",
        "Test transition at the first candidate, last candidate, absent values, and duplicates.",
      ],
      closing: "The candidate domain halves each iteration while preserving the first feasible answer.",
    },
    quiz: [
      q("bs-1", "What property must an answer-space check have?", "Its truth value changes monotonically across the ordered candidates", ["It must be O(1)", "It must sort input", "It must recurse"], "Correct answer: Its truth value changes monotonically across the ordered candidates. The other options confuse related ideas or skip a key constraint."),
      q("bs-2", "Why is max(weights) the shipping lower bound?", "No package can be split, so capacity must fit the heaviest package", ["It is the average", "It minimizes days automatically", "It is always feasible"], "Correct answer: No package can be split, so capacity must fit the heaviest package. The other options confuse related ideas or skip a key constraint."),
      q("bs-3", "What does firstTrue return if no index is true?", "n, the end of the half-open domain", ["-1 necessarily", "Zero", "The last index"], "Correct answer: n, the end of the half-open domain. The other options confuse related ideas or skip a key constraint."),
      q("bs-4", "Why do duplicates complicate rotated search?", "They can make it impossible to tell which half is strictly ordered", ["They make arrays unsliceable", "They require a heap", "They change target"], "Correct answer: They can make it impossible to tell which half is strictly ordered. The other options confuse related ideas or skip a key constraint."),
    ],
  }),
  makeDsaLesson({
    slug: "backtracking-templates",
    title: "Backtracking Templates",
    subtitle: "Combination, permutation, partition, board-search, deduplication, and pruning templates.",
    difficulty: "advanced",
    minutes: 55,
    tags: ["backtracking", "template", "pruning", "deduplication"],
    prerequisites: ["recursion-backtracking"],
    clarify: [
      "Does order distinguish solutions, and may a candidate be reused?",
      "Are duplicate input values distinct choices or duplicate outputs to suppress?",
      "What lower bound, ordering, or constraint proves a branch impossible?",
    ],
    model: [
      "Combinations loop from start; permutations loop all positions with used flags.",
      "Reuse recurses with i; single use recurses with i+1.",
      "Sort first so same-depth duplicates and monotonic pruning become visible.",
    ],
    mentalModel:
      "Most backtracking problems differ in only four decisions: what constitutes a complete solution, which candidates are legal now, how the next state changes, and what state must be undone. Duplicate suppression is depth-specific: after sorting, skip nums[i] when i>start and nums[i]==nums[i-1] for combinations. Board search temporarily marks a cell because each path, not every search globally, owns visited state.",
    invariant:
      "At depth d, path is a valid partial candidate of length or sum d-state, and the loop generates each legal next equivalence class exactly once. Restoration makes board/path state identical before and after each candidate.",
    diagram: {
      kind: "tree-dfs",
      title: "Decision tree with pruned branches",
      caption: "Each depth owns one decision; pruning cuts a subtree only when no descendant can be valid.",
    },
    implementations: [
      {
        title: "Combination template: unique sum with single use",
        code: `func combinationSumOnce(nums []int, target int) [][]int {
	slices.Sort(nums)
	result, path := [][]int{}, []int{}
	var search func(int, int)
	search = func(start, remaining int) {
		if remaining == 0 {
			result = append(result, append([]int(nil), path...))
			return
		}
		for i := start; i < len(nums); i++ {
			if i > start && nums[i] == nums[i-1] {
				continue // same-depth duplicate
			}
			if nums[i] > remaining {
				break
			}
			path = append(path, nums[i])
			search(i+1, remaining-nums[i])
			path = path[:len(path)-1]
		}
	}
	search(0, target)
	return result
}`,
      },
      {
        title: "Permutation template: unique permutations",
        code: `func uniquePermutations(nums []int) [][]int {
	slices.Sort(nums)
	result, path := [][]int{}, []int{}
	used := make([]bool, len(nums))
	var search func()
	search = func() {
		if len(path) == len(nums) {
			result = append(result, append([]int(nil), path...))
			return
		}
		for i := range nums {
			if used[i] || (i > 0 && nums[i] == nums[i-1] && !used[i-1]) {
				continue
			}
			used[i] = true
			path = append(path, nums[i])
			search()
			path = path[:len(path)-1]
			used[i] = false
		}
	}
	search()
	return result
}`,
      },
      {
        title: "Board template: word path with temporary marking",
        code: `func wordExists(board [][]byte, word string) bool {
	if len(board) == 0 || len(word) == 0 {
		return len(word) == 0
	}
	var search func(int, int, int) bool
	search = func(row, col, index int) bool {
		if index == len(word) {
			return true
		}
		if row < 0 || row >= len(board) || col < 0 ||
			col >= len(board[0]) || board[row][col] != word[index] {
			return false
		}
		saved := board[row][col]
		board[row][col] = 0
		found := search(row+1, col, index+1) ||
			search(row-1, col, index+1) ||
			search(row, col+1, index+1) ||
			search(row, col-1, index+1)
		board[row][col] = saved
		return found
	}
	for row := range board {
		for col := range board[row] {
			if search(row, col, 0) {
				return true
			}
		}
	}
	return false
}`,
      },
    ],
    time: "Problem-dependent exponential: combinations up to O(2ⁿ), permutations O(n·n!), board search O(rc·4ᴸ)",
    space: "O(n) or O(L) recursion/path excluding output",
    complexityNotes:
      "Pruning improves explored instances but not always the worst-case bound. Sorting costs O(n log n) and enables duplicate skipping and positive-number cutoff.",
    dryRun: [
      "For nums [1,1,2], target 3, sort unchanged. At root choose first 1; at next depth the second 1 is allowed because it is a different position.",
      "After returning to root, skip the second 1 because i>start and it equals the previous root candidate; this avoids generating [1,2] twice.",
      "Choosing 2 then sees remaining 1 with no later candidate, so that branch ends. Only [1,2] is emitted.",
    ],
    pitfalls: [
      "Duplicate checks for combinations and permutations use different conditions",
      "Pruning nums[i]>remaining assumes sorted positive candidates",
      "Early return in board search must still restore the marked cell",
    ],
    recognition:
      "Use these templates for all unique combinations, permutations with duplicates, palindrome partitioning, N-Queens, Sudoku, and grid word paths. Identify whether each depth selects a position, a value class, a cut, or a board cell.",
    answer: {
      opening: "I will classify this as combination, permutation, partition, or board path, then instantiate the corresponding state and duplicate rule.",
      beats: [
        "State reuse and output-order semantics.",
        "Explain same-depth versus same-path duplicate suppression.",
        "Show restoration even on successful early exits.",
        "Give output-sensitive bounds and the exact assumption behind pruning.",
      ],
      closing: "The template is reliable because every customization corresponds to one explicit problem contract.",
    },
    quiz: [
      q("bkt-1", "When may combination search skip nums[i]==nums[i-1]?", "When i>start, meaning the duplicate is a sibling choice at the same depth", ["Always", "Only after success", "Never"], "Correct answer: When i>start, meaning the duplicate is a sibling choice at the same depth. The other options confuse related ideas or skip a key constraint."),
      q("bkt-2", "What changes when a candidate may be reused?", "Recurse with i instead of i+1", ["Remove the base case", "Never unchoose", "Use BFS"], "Correct answer: Recurse with i instead of i+1. The other options confuse related ideas or skip a key constraint."),
      q("bkt-3", "Why temporarily mark a board cell?", "A cell cannot be reused within the current path but may be used by another starting path", ["To sort the board", "To count bytes", "To persist mutation"], "Correct answer: A cell cannot be reused within the current path but may be used by another starting path. The other options confuse related ideas or skip a key constraint."),
      q("bkt-4", "When is nums[i]>remaining a safe break?", "After sorting positive candidates", ["With arbitrary negative candidates", "Before sorting", "For permutations only"], "Correct answer: After sorting positive candidates. The other options confuse related ideas or skip a key constraint."),
    ],
  }),
  makeDsaLesson({
    slug: "union-find-dsu",
    title: "Union–Find (Disjoint Set Union)",
    subtitle: "Component representatives, path compression, union by size, and offline connectivity.",
    difficulty: "intermediate",
    minutes: 45,
    tags: ["union-find", "dsu", "connectivity", "kruskal"],
    prerequisites: ["graphs-bfs-dfs"],
    clarify: [
      "Are connectivity updates only additions, or must edges also be deleted?",
      "Do I need component count, component size, cycle detection, or an MST?",
      "Are labels dense 0..n-1 or should they be compressed/mapped first?",
    ],
    model: [
      "Each component is a rooted parent forest; the root is its representative.",
      "Find compresses paths; union attaches the smaller tree below the larger.",
      "A failed union means both endpoints were already connected.",
    ],
    mentalModel:
      "DSU answers dynamic equivalence under merges. It does not store paths or adjacency; it stores only component membership. Initially every item is its own set. Find follows parent links to the representative and rewrites links to flatten future searches. Union by size prevents tall trees before compression. Together they make m operations O(m α(n)), effectively constant at realistic sizes.",
    invariant:
      "parent[root]==root for every representative; two items are connected exactly when Find returns the same root. size is meaningful only at roots and equals component cardinality.",
    implementations: [
      {
        title: "Core: iterative path compression and union by size",
        code: `type DSU struct {
	parent []int
	size   []int
	count  int
}

func NewDSU(n int) *DSU {
	d := &DSU{parent: make([]int, n), size: make([]int, n), count: n}
	for i := 0; i < n; i++ {
		d.parent[i], d.size[i] = i, 1
	}
	return d
}

func (d *DSU) Find(x int) int {
	root := x
	for root != d.parent[root] {
		root = d.parent[root]
	}
	for x != root {
		next := d.parent[x]
		d.parent[x] = root
		x = next
	}
	return root
}

func (d *DSU) Union(a, b int) bool {
	rootA, rootB := d.Find(a), d.Find(b)
	if rootA == rootB {
		return false
	}
	if d.size[rootA] < d.size[rootB] {
		rootA, rootB = rootB, rootA
	}
	d.parent[rootB] = rootA
	d.size[rootA] += d.size[rootB]
	d.count--
	return true
}`,
      },
      {
        title: "Variant: detect the redundant undirected edge",
        code: `func redundantEdge(edges [][2]int, n int) ([2]int, bool) {
	dsu := NewDSU(n)
	for _, edge := range edges {
		if !dsu.Union(edge[0], edge[1]) {
			return edge, true
		}
	}
	return [2]int{}, false
}`,
      },
      {
        title: "Variant: Kruskal minimum spanning tree",
        code: `type CostEdge struct{ From, To, Cost int }

func kruskal(n int, edges []CostEdge) (int64, bool) {
	slices.SortFunc(edges, func(a, b CostEdge) int {
		return cmp.Compare(a.Cost, b.Cost)
	})
	dsu := NewDSU(n)
	var total int64
	chosen := 0
	for _, edge := range edges {
		if dsu.Union(edge.From, edge.To) {
			total += int64(edge.Cost)
			chosen++
			if chosen == n-1 {
				break
			}
		}
	}
	return total, chosen == n-1
}`,
      },
    ],
    time: "O((n+m) α(n)) for DSU operations; Kruskal O(E log E) due to sorting",
    space: "O(n) parent and size arrays",
    complexityNotes:
      "α(n), the inverse Ackermann function, is below five for practical input sizes. Standard DSU does not support arbitrary edge deletion or path queries.",
    dryRun: [
      "Start {0},{1},{2},{3}. Union(0,1) makes root 0 size 2; Union(2,3) makes root 2 size 2.",
      "Union(1,3) finds roots 0 and 2, joins them, and component count becomes 1.",
      "Union(0,2) now finds the same representative and returns false, identifying a cycle-forming edge.",
    ],
    pitfalls: [
      "Updating size on a non-root corrupts union-by-size decisions",
      "DSU proves connectivity but cannot reconstruct the connecting path",
      "Standard DSU handles incremental additions, not online deletions",
    ],
    recognition:
      "Reach for DSU on repeated merge/connected queries, redundant undirected edges, account merging, equality constraints, island additions, and Kruskal MST. Prefer DFS/BFS if you need paths or rich neighborhood traversal.",
    answer: {
      opening: "This is incremental component membership, so I will represent each component by a compressed root and merge roots by size.",
      beats: [
        "Define root and size invariants.",
        "Explain why a failed union detects an already connected pair.",
        "Separate edge-sort cost from near-constant DSU cost.",
        "Call out unsupported deletions and label mapping.",
      ],
      closing: "Path compression and union by size keep the parent forest almost flat.",
    },
    quiz: [
      q("dsu-1", "What does Find return?", "A representative root for the item's component", ["A shortest path", "Every neighbor", "An edge weight"], "Correct answer: A representative root for the item's component. The other options confuse related ideas or skip a key constraint."),
      q("dsu-2", "What does Union returning false mean?", "The items already had the same representative", ["The indices are sorted", "Memory is full", "A new component formed"], "Correct answer: The items already had the same representative. The other options confuse related ideas or skip a key constraint."),
      q("dsu-3", "Where is component size authoritative?", "At the representative root", ["At every historical node", "Only index zero", "In the edge list"], "Correct answer: At the representative root. The other options confuse related ideas or skip a key constraint."),
      q("dsu-4", "What is standard DSU poor at?", "Arbitrary online edge deletions and path reconstruction", ["Incremental connectivity", "Kruskal", "Cycle detection"], "Correct answer: Arbitrary online edge deletions and path reconstruction. The other options confuse related ideas or skip a key constraint."),
    ],
  }),
  makeDsaLesson({
    slug: "bit-manipulation-go",
    title: "Bit Manipulation in Go",
    subtitle: "Unsigned shifts, masks, XOR cancellation, bit counting, and subset tricks.",
    difficulty: "intermediate",
    minutes: 45,
    tags: ["bits", "xor", "mask", "go"],
    clarify: [
      "Are values signed, and which fixed width should operations use?",
      "Is the goal to test flags, cancel pairs, count bits, enumerate subsets, or isolate a bit?",
      "Can shifting by or beyond the width occur under input constraints?",
    ],
    model: [
      "Write a small binary example and label bit positions from zero.",
      "Use unsigned integers when right shift should introduce zeros.",
      "XOR is addition modulo two per bit: x^x=0, x^0=x, and order does not matter.",
    ],
    mentalModel:
      "Bits are compact boolean algebra. AND filters, OR sets, XOR toggles/detects parity, and AND NOT clears. In Go, shift behavior depends on operand typing; converting to uint gives explicit logical bit intent. The identity x & (x-1) removes the lowest set bit, while x & -x isolates it in two's-complement arithmetic—most clearly expressed with unsigned x & -x.",
    invariant:
      "A mask bit is one exactly for the represented property. In pair-cancellation XOR, the accumulator equals XOR of all values processed, so duplicate pairs contribute zero.",
    implementations: [
      {
        title: "Core: flag operations and Kernighan bit count",
        code: `func hasBit(mask uint64, bit uint) bool {
	return mask&(uint64(1)<<bit) != 0
}

func setBit(mask uint64, bit uint) uint64 {
	return mask | uint64(1)<<bit
}

func clearBit(mask uint64, bit uint) uint64 {
	return mask &^ uint64(1)<<bit
}

func countSetBits(value uint64) int {
	count := 0
	for value != 0 {
		value &= value - 1 // remove lowest set bit
		count++
	}
	return count
}`,
      },
      {
        title: "XOR variant: one unpaired value",
        code: `func singleNumber(nums []int) int {
	accumulator := 0
	for _, value := range nums {
		accumulator ^= value
	}
	return accumulator
}

func missingZeroToN(nums []int) int {
	missing := len(nums)
	for index, value := range nums {
		missing ^= index ^ value
	}
	return missing
}`,
      },
      {
        title: "Variant: two unpaired values",
        code: `func twoSingles(nums []int) (int, int) {
	combined := 0
	for _, value := range nums {
		combined ^= value
	}
	distinguishingBit := uint(combined) & -uint(combined)
	first := 0
	for _, value := range nums {
		if uint(value)&distinguishingBit != 0 {
			first ^= value
		}
	}
	return first, combined ^ first
}`,
      },
    ],
    time: "Flag operations O(1); XOR scan O(n); Kernighan count O(number of set bits)",
    space: "O(1)",
    complexityNotes:
      "math/bits provides optimized standard operations such as bits.OnesCount64 and bits.LeadingZeros64. Prefer it in production unless the interview asks for derivation.",
    dryRun: [
      "count bits of 12 (1100₂): 1100 & 1011 becomes 1000, removing one set bit.",
      "1000 & 0111 becomes 0000, so count is 2.",
      "For [4,1,2,1,2], XOR may reorder as (1^1)^(2^2)^4 = 0^0^4 = 4.",
    ],
    pitfalls: [
      "Signed right shifts preserve sign on signed values; use an unsigned type for logical shifts",
      "Operator precedence around shifts and masks can be unclear; parenthesize intent",
      "XOR cancellation requires the exact multiplicity contract",
    ],
    recognition:
      "Reach for bits when the prompt mentions powers of two, parity, flags, subset masks, paired duplicates, missing values in a known range, Hamming distance, or compact DP state. Do not force bit tricks when readability or unbounded sets call for normal structures.",
    answer: {
      opening: "I will choose an explicit unsigned width and write the needed bit identity on a small binary value.",
      beats: [
        "Map each bit to a clear semantic fact.",
        "Derive cancellation or lowest-bit behavior algebraically.",
        "State multiplicity and width assumptions.",
        "Test zero, highest bit, negative input conversion, and shift bounds.",
      ],
      closing: "The implementation is constant-space because the accumulator preserves exactly the required bitwise summary.",
    },
    quiz: [
      q("bit-1", "What does x&(x-1) do for nonzero x?", "Clears the lowest set bit", ["Sets every bit", "Negates x", "Counts bytes"], "Correct answer: Clears the lowest set bit. The other options confuse related ideas or skip a key constraint."),
      q("bit-2", "Why does XOR find one unpaired value?", "Equal pairs cancel and XOR is associative and commutative", ["XOR sorts values", "XOR stores a map", "It works for any multiplicity"], "Correct answer: Equal pairs cancel and XOR is associative and commutative. The other options confuse related ideas or skip a key constraint."),
      q("bit-3", "Why prefer uint for logical shifts?", "It makes zero-filling bit intent explicit without sign extension", ["uint has infinite width", "Signed ints cannot shift", "It prevents overflow entirely"], "Correct answer: It makes zero-filling bit intent explicit without sign extension. The other options confuse related ideas or skip a key constraint."),
      q("bit-4", "What does &^ do in Go?", "Bit clear (AND NOT)", ["XOR", "Division", "Left rotation"], "Correct answer: Bit clear (AND NOT). The other options confuse related ideas or skip a key constraint."),
    ],
  }),
  makeDsaLesson({
    slug: "topological-sort-patterns",
    title: "Topological Sort Patterns",
    subtitle: "Dependency direction, Kahn frontiers, DFS colors, cycle witnesses, and DAG DP.",
    difficulty: "advanced",
    minutes: 50,
    tags: ["topological-sort", "dag", "dependencies", "kahn"],
    prerequisites: ["graphs-bfs-dfs"],
    clarify: [
      "Does edge u→v mean u is a prerequisite of v, or the reverse?",
      "Do I need any valid order, lexicographically smallest order, all orders, or only cycle detection?",
      "Can duplicate dependency edges inflate indegrees?",
    ],
    model: [
      "A topological order places every prerequisite before its dependent.",
      "Kahn repeatedly removes indegree-zero vertices; DFS appends after descendants and reverses.",
      "If fewer than V vertices finish, the remaining directed subgraph contains a cycle.",
    ],
    mentalModel:
      "Topological sorting linearizes a partial order and exists only for a DAG. Kahn's algorithm models prerequisites literally: indegree counts unresolved prerequisites and the queue contains currently available work. DFS uses three colors—unvisited, active, complete—where an edge to active is a back edge and proves a cycle. Once ordered, any DP whose edges flow forward can process each state once.",
    invariant:
      "In Kahn's algorithm, indegree[v] equals unresolved incoming edges from unprocessed vertices, and the frontier contains exactly the processable zero-indegree vertices.",
    diagram: {
      kind: "bfs-levels",
      title: "Dependency waves",
      caption: "Each wave contains tasks whose prerequisites were removed by earlier waves.",
    },
    implementations: [
      {
        title: "Core: Kahn order and cycle detection",
        code: `func topologicalOrder(n int, edges [][2]int) ([]int, bool) {
	graph := make([][]int, n)
	indegree := make([]int, n)
	for _, edge := range edges {
		from, to := edge[0], edge[1]
		graph[from] = append(graph[from], to)
		indegree[to]++
	}
	queue := []int{}
	for node, degree := range indegree {
		if degree == 0 {
			queue = append(queue, node)
		}
	}
	order := make([]int, 0, n)
	for head := 0; head < len(queue); head++ {
		node := queue[head]
		order = append(order, node)
		for _, next := range graph[node] {
			indegree[next]--
			if indegree[next] == 0 {
				queue = append(queue, next)
			}
		}
	}
	return order, len(order) == n
}`,
      },
      {
        title: "Variant: DFS colors with cycle detection",
        code: `func topologicalDFS(graph [][]int) ([]int, bool) {
	const visiting, complete = 1, 2
	color := make([]int, len(graph))
	order := make([]int, 0, len(graph))
	var visit func(int) bool
	visit = func(node int) bool {
		if color[node] == visiting {
			return false
		}
		if color[node] == complete {
			return true
		}
		color[node] = visiting
		for _, next := range graph[node] {
			if !visit(next) {
				return false
			}
		}
		color[node] = complete
		order = append(order, node)
		return true
	}
	for node := range graph {
		if color[node] == 0 && !visit(node) {
			return nil, false
		}
	}
	slices.Reverse(order)
	return order, true
}`,
      },
      {
        title: "DAG variant: longest weighted path by topo order",
        code: `func longestDAGPath(graph [][]WeightedEdge, source int, order []int) []int64 {
	const negativeInfinity int64 = math.MinInt64
	distance := make([]int64, len(graph))
	for i := range distance {
		distance[i] = negativeInfinity
	}
	distance[source] = 0
	for _, node := range order {
		if distance[node] == negativeInfinity {
			continue
		}
		for _, edge := range graph[node] {
			distance[edge.To] = max(
				distance[edge.To],
				distance[node]+int64(edge.Weight),
			)
		}
	}
	return distance
}`,
      },
    ],
    time: "Kahn and DFS O(V+E); DAG relaxation O(V+E) after ordering",
    space: "O(V+E) graph plus O(V) indegree/frontier/color/stack",
    complexityNotes:
      "A min-heap instead of a queue produces the lexicographically smallest available order in O((V+E) log V). Enumerating all orders can be exponential.",
    dryRun: [
      "Dependencies A→C, B→C, C→D give indegrees A=0,B=0,C=2,D=1; initial frontier is [A,B].",
      "Remove A: C drops to 1. Remove B: C drops to 0 and enters the queue. Remove C then releases D.",
      "Order [A,B,C,D] is valid; [B,A,C,D] is also valid. Topological order is generally not unique.",
    ],
    pitfalls: [
      "Reversing prerequisite edge direction returns the wrong order while still looking plausible",
      "Using one visited boolean in DFS cannot distinguish an active-cycle edge from a completed node",
      "Duplicate edges must either be deduplicated or consistently counted and decremented",
    ],
    recognition:
      "Reach for topological sort on prerequisites, builds, course schedules, workflow tasks, alien dictionaries, dependency installation, and DP on a DAG. If dependencies can cycle, cycle detection is part of the contract, not an optional add-on.",
    answer: {
      opening: "I will define edge direction aloud, then use indegree as the count of unresolved prerequisites.",
      beats: [
        "Build adjacency and indegree together.",
        "Explain why only zero-indegree work is safe next.",
        "Detect a cycle by processed count.",
        "Discuss deterministic ordering, duplicate edges, and disconnected DAG components.",
      ],
      closing: "Every edge is removed once, and processing all vertices is equivalent to the graph being acyclic.",
    },
    quiz: [
      q("topo-1", "What does indegree represent in Kahn's algorithm?", "The number of unresolved prerequisites/incoming edges", ["The number of outgoing paths", "The shortest distance", "The heap size"], "Correct answer: The number of unresolved prerequisites/incoming edges. The other options confuse related ideas or skip a key constraint."),
      q("topo-2", "How does Kahn detect a cycle?", "Fewer than V vertices can be removed", ["The queue grows", "An indegree becomes zero", "Edges are weighted"], "Correct answer: Fewer than V vertices can be removed. The other options confuse related ideas or skip a key constraint."),
      q("topo-3", "What DFS edge proves a directed cycle?", "An edge to a currently visiting (active) vertex", ["An edge to a complete vertex", "Any cross edge", "An edge from zero"], "Correct answer: An edge to a currently visiting (active) vertex. The other options confuse related ideas or skip a key constraint."),
      q("topo-4", "Is topological order unique?", "Not generally; multiple zero-indegree choices can exist", ["Always", "Only for disconnected graphs", "Never valid"], "Correct answer: Not generally; multiple zero-indegree choices can exist. The other options confuse related ideas or skip a key constraint."),
    ],
  }),
  makeDsaLesson({
    slug: "monotonic-stack-queue",
    title: "Monotonic Stack & Queue",
    subtitle: "Nearest boundaries, contribution counting, histogram areas, and window extrema.",
    difficulty: "advanced",
    minutes: 55,
    tags: ["monotonic-stack", "monotonic-deque", "histogram", "window"],
    prerequisites: ["stacks-and-queues", "sliding-window-two-pointers"],
    clarify: [
      "Do I need nearest greater/smaller on the left or right, and are equals popped?",
      "Should duplicate values choose a strict boundary on one side to avoid double counting?",
      "Is the window fixed-size so expired indices must leave from the deque front?",
    ],
    model: [
      "The stack stores unresolved indices whose answer has not appeared yet.",
      "Popping proves the current value is the first boundary that resolves the popped index.",
      "A monotonic deque removes expired indices at the front and dominated candidates at the back.",
    ],
    mentalModel:
      "Monotonic structures discard candidates that can never matter again. In a decreasing stack for next-greater, a larger current value resolves every smaller index on top. Each index is pushed once and popped once. For a sliding maximum, a newer value at least as large dominates an older smaller value because it expires later and is never worse; the deque front remains the best live candidate.",
    invariant:
      "Stack indices remain monotonic by value and unresolved in position order. Deque indices lie inside the current window, increase by index, and decrease by value, so the front is the maximum.",
    diagram: {
      kind: "sliding-window",
      title: "Window plus decreasing candidate deque",
      caption: "The deque stores only candidates that can still become a future window maximum.",
    },
    implementations: [
      {
        title: "Core stack: next greater value",
        code: `func nextGreater(nums []int) []int {
	answer := make([]int, len(nums))
	for i := range answer {
		answer[i] = -1
	}
	stack := []int{} // indices with decreasing values
	for index, value := range nums {
		for len(stack) > 0 && nums[stack[len(stack)-1]] < value {
			unresolved := stack[len(stack)-1]
			stack = stack[:len(stack)-1]
			answer[unresolved] = value
		}
		stack = append(stack, index)
	}
	return answer
}`,
      },
      {
        title: "Histogram variant: largest rectangle",
        code: `func largestRectangle(heights []int) int {
	best := 0
	stack := []int{} // increasing heights
	for index := 0; index <= len(heights); index++ {
		current := 0 // sentinel flush
		if index < len(heights) {
			current = heights[index]
		}
		for len(stack) > 0 && heights[stack[len(stack)-1]] > current {
			bar := stack[len(stack)-1]
			stack = stack[:len(stack)-1]
			left := -1
			if len(stack) > 0 {
				left = stack[len(stack)-1]
			}
			width := index - left - 1
			best = max(best, heights[bar]*width)
		}
		stack = append(stack, index)
	}
	return best
}`,
      },
      {
        title: "Deque variant: maximum of every size-k window",
        code: `func maxSlidingWindow(nums []int, k int) []int {
	if k <= 0 || k > len(nums) {
		return []int{}
	}
	deque := []int{}
	result := make([]int, 0, len(nums)-k+1)
	for right, value := range nums {
		left := right - k + 1
		if len(deque) > 0 && deque[0] < left {
			deque = deque[1:]
		}
		for len(deque) > 0 && nums[deque[len(deque)-1]] <= value {
			deque = deque[:len(deque)-1]
		}
		deque = append(deque, right)
		if left >= 0 {
			result = append(result, nums[deque[0]])
		}
	}
	return result
}`,
      },
    ],
    time: "O(n) amortized for each shown algorithm",
    space: "O(n) stack worst case; O(k) window deque",
    complexityNotes:
      "Nested pop loops are linear in total because an index cannot be popped twice. Strict versus non-strict comparisons determine duplicate ownership and must match the problem.",
    dryRun: [
      "Next greater for [2,1,2,4,3]: push indices 0(2),1(1); at value 2 pop index 1 and answer 2, but equal index 0 remains.",
      "At value 4, pop index 2 and then 0, assigning 4 to both. Push 4; value 3 remains unresolved.",
      "Final answers are [4,2,4,-1,-1]. Each pop found the first greater value because intervening values failed to pop it.",
    ],
    pitfalls: [
      "Storing values instead of indices loses distance, expiry, and duplicate identity",
      "Wrong < versus <= handling can double-count or discard equal boundaries",
      "Histogram algorithms need a final sentinel or explicit stack flush",
    ],
    recognition:
      "Reach for a monotonic stack on next/previous greater/smaller, daily temperatures, stock span, histogram, rain water, and subarray contribution. Reach for a monotonic deque on maximum/minimum in every fixed window or DP optimized over a recent range.",
    answer: {
      opening: "I will identify which unresolved indices the structure stores and the exact event that proves one can be popped forever.",
      beats: [
        "Choose increasing/decreasing and strict/non-strict policy.",
        "Store indices, not only values.",
        "Explain amortized O(n) by one push and one pop per index.",
        "Test monotone input, duplicates, one element, and k boundaries.",
      ],
      closing: "Dominated candidates are permanently removed, leaving only boundaries that can still affect a future answer.",
    },
    quiz: [
      q("mono-1", "Why is a monotonic stack algorithm O(n)?", "Each index is pushed once and popped at most once", ["The inner loop never runs", "The stack is sorted globally", "It uses hashing"], "Correct answer: Each index is pushed once and popped at most once. The other options confuse related ideas or skip a key constraint."),
      q("mono-2", "Why store deque indices for window maxima?", "Indices reveal expiry and distinguish duplicates", ["Values cannot compare", "Indices reduce n", "Slices require them"], "Correct answer: Indices reveal expiry and distinguish duplicates. The other options confuse related ideas or skip a key constraint."),
      q("mono-3", "What does the deque front represent?", "The best value among live, undominated window candidates", ["The newest item always", "The smallest index ever", "An expired value"], "Correct answer: The best value among live, undominated window candidates. The other options confuse related ideas or skip a key constraint."),
      q("mono-4", "Why add a zero-height histogram sentinel?", "It forces all remaining bars to resolve their right boundary", ["It increases every area", "It sorts heights", "It removes duplicates"], "Correct answer: It forces all remaining bars to resolve their right boundary. The other options confuse related ideas or skip a key constraint."),
    ],
  }),
];
