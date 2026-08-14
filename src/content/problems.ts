export type ProblemDifficulty = "Easy" | "Medium" | "Hard";

export type Problem = {
  id: string;
  title: string;
  difficulty: ProblemDifficulty;
  leetcodeUrl?: string;
  pattern: string;
  lessonSlug?: string;
  note?: string;
};

export type PatternTopic = {
  id: string;
  name: string;
  strategy: string;
  lessonSlugs: string[];
  problems: Problem[];
};

type ProblemSeed = [
  id: string,
  title: string,
  difficulty: ProblemDifficulty,
  lessonSlug?: string,
];

type TopicSeed = Omit<PatternTopic, "problems"> & {
  problems: ProblemSeed[];
};

function createTopic(topic: TopicSeed): PatternTopic {
  return {
    ...topic,
    problems: topic.problems.map(([id, title, difficulty, lessonSlug]) => ({
      id,
      title,
      difficulty,
      leetcodeUrl: `https://leetcode.com/problems/${id}/`,
      pattern: topic.name,
      lessonSlug: lessonSlug ?? topic.lessonSlugs[0],
    })),
  };
}

export const patternTopics: PatternTopic[] = [
  createTopic({
    id: "arrays-two-pointers",
    name: "Arrays & Two Pointers",
    strategy:
      "Use indexing, hashing, prefix information, and converging pointers to replace repeated scans.",
    lessonSlugs: ["arrays-and-slices", "sliding-window-two-pointers"],
    problems: [
      ["two-sum", "Two Sum", "Easy"],
      ["contains-duplicate", "Contains Duplicate", "Easy"],
      ["product-of-array-except-self", "Product of Array Except Self", "Medium"],
      ["maximum-subarray", "Maximum Subarray", "Medium"],
      ["3sum", "3Sum", "Medium", "sliding-window-two-pointers"],
      ["container-with-most-water", "Container With Most Water", "Medium", "sliding-window-two-pointers"],
      ["sort-colors", "Sort Colors", "Medium"],
      ["move-zeroes", "Move Zeroes", "Easy", "sliding-window-two-pointers"],
      ["squares-of-a-sorted-array", "Squares of a Sorted Array", "Easy", "sliding-window-two-pointers"],
      ["trapping-rain-water", "Trapping Rain Water", "Hard", "sliding-window-two-pointers"],
    ],
  }),
  createTopic({
    id: "sliding-window",
    name: "Sliding Window",
    strategy:
      "Maintain exactly the state inside a moving range, expanding for candidates and shrinking to restore validity.",
    lessonSlugs: ["sliding-window-two-pointers"],
    problems: [
      ["best-time-to-buy-and-sell-stock", "Best Time to Buy and Sell Stock", "Easy"],
      [
        "longest-substring-without-repeating-characters",
        "Longest Substring Without Repeating Characters",
        "Medium",
      ],
      [
        "longest-repeating-character-replacement",
        "Longest Repeating Character Replacement",
        "Medium",
      ],
      ["permutation-in-string", "Permutation in String", "Medium"],
      ["minimum-size-subarray-sum", "Minimum Size Subarray Sum", "Medium"],
      ["find-all-anagrams-in-a-string", "Find All Anagrams in a String", "Medium"],
      ["sliding-window-maximum", "Sliding Window Maximum", "Hard"],
      ["minimum-window-substring", "Minimum Window Substring", "Hard"],
    ],
  }),
  createTopic({
    id: "strings",
    name: "Strings",
    strategy:
      "Normalize the representation first, then use frequency maps, careful parsing, or direct character scans.",
    lessonSlugs: ["strings-and-runes", "hash-maps-and-sets"],
    problems: [
      ["valid-anagram", "Valid Anagram", "Easy", "hash-maps-and-sets"],
      ["group-anagrams", "Group Anagrams", "Medium", "hash-maps-and-sets"],
      ["valid-palindrome", "Valid Palindrome", "Easy"],
      ["longest-common-prefix", "Longest Common Prefix", "Easy"],
      ["string-to-integer-atoi", "String to Integer (atoi)", "Medium"],
      ["multiply-strings", "Multiply Strings", "Medium"],
      ["zigzag-conversion", "Zigzag Conversion", "Medium"],
      ["count-and-say", "Count and Say", "Medium"],
    ],
  }),
  createTopic({
    id: "linked-list",
    name: "Linked List",
    strategy:
      "Reach for dummy heads, fast and slow pointers, and explicit save-rewire-advance pointer updates.",
    lessonSlugs: ["linked-lists"],
    problems: [
      ["reverse-linked-list", "Reverse Linked List", "Easy"],
      ["merge-two-sorted-lists", "Merge Two Sorted Lists", "Easy"],
      ["linked-list-cycle", "Linked List Cycle", "Easy"],
      ["remove-nth-node-from-end-of-list", "Remove Nth Node From End of List", "Medium"],
      ["reorder-list", "Reorder List", "Medium"],
      ["add-two-numbers", "Add Two Numbers", "Medium"],
      ["copy-list-with-random-pointer", "Copy List with Random Pointer", "Medium"],
      ["lru-cache", "LRU Cache", "Medium"],
      ["merge-k-sorted-lists", "Merge k Sorted Lists", "Hard"],
    ],
  }),
  createTopic({
    id: "stack-queue",
    name: "Stack & Queue",
    strategy:
      "Choose a stack for nested or deferred work and a queue when processing order must remain first-in, first-out.",
    lessonSlugs: ["stacks-and-queues"],
    problems: [
      ["valid-parentheses", "Valid Parentheses", "Easy"],
      ["min-stack", "Min Stack", "Medium"],
      ["evaluate-reverse-polish-notation", "Evaluate Reverse Polish Notation", "Medium"],
      ["implement-queue-using-stacks", "Implement Queue using Stacks", "Easy"],
      ["implement-stack-using-queues", "Implement Stack using Queues", "Easy"],
      ["simplify-path", "Simplify Path", "Medium"],
      ["decode-string", "Decode String", "Medium"],
      ["basic-calculator-ii", "Basic Calculator II", "Medium"],
      ["basic-calculator", "Basic Calculator", "Hard"],
    ],
  }),
  createTopic({
    id: "monotonic-stack",
    name: "Monotonic Stack",
    strategy:
      "Keep candidates in sorted stack or deque order so each new value resolves dominated elements once.",
    lessonSlugs: ["monotonic-stack-queue"],
    problems: [
      ["daily-temperatures", "Daily Temperatures", "Medium"],
      ["next-greater-element-i", "Next Greater Element I", "Easy"],
      ["next-greater-element-ii", "Next Greater Element II", "Medium"],
      ["online-stock-span", "Online Stock Span", "Medium"],
      ["132-pattern", "132 Pattern", "Medium"],
      ["sum-of-subarray-minimums", "Sum of Subarray Minimums", "Medium"],
      ["largest-rectangle-in-histogram", "Largest Rectangle in Histogram", "Hard"],
      ["maximal-rectangle", "Maximal Rectangle", "Hard"],
    ],
  }),
  createTopic({
    id: "binary-search",
    name: "Binary Search",
    strategy:
      "Identify a monotonic decision boundary, state what each half means, and preserve it with every update.",
    lessonSlugs: ["binary-search-patterns", "sorting-searching"],
    problems: [
      ["binary-search", "Binary Search", "Easy"],
      ["search-insert-position", "Search Insert Position", "Easy"],
      ["search-a-2d-matrix", "Search a 2D Matrix", "Medium"],
      ["find-minimum-in-rotated-sorted-array", "Find Minimum in Rotated Sorted Array", "Medium"],
      ["search-in-rotated-sorted-array", "Search in Rotated Sorted Array", "Medium"],
      ["koko-eating-bananas", "Koko Eating Bananas", "Medium"],
      [
        "capacity-to-ship-packages-within-d-days",
        "Capacity To Ship Packages Within D Days",
        "Medium",
      ],
      ["find-peak-element", "Find Peak Element", "Medium"],
      ["median-of-two-sorted-arrays", "Median of Two Sorted Arrays", "Hard"],
    ],
  }),
  createTopic({
    id: "sorting",
    name: "Sorting",
    strategy:
      "Select a comparison, counting, or divide-and-conquer sort based on constraints and the ordering you need.",
    lessonSlugs: ["sorting-searching"],
    problems: [
      ["merge-sorted-array", "Merge Sorted Array", "Easy"],
      ["sort-an-array", "Sort an Array", "Medium"],
      ["largest-number", "Largest Number", "Medium"],
      ["sort-list", "Sort List", "Medium"],
      ["insertion-sort-list", "Insertion Sort List", "Medium"],
      ["sort-characters-by-frequency", "Sort Characters By Frequency", "Medium"],
    ],
  }),
  createTopic({
    id: "recursion-backtracking",
    name: "Recursion & Backtracking",
    strategy:
      "Model one decision per recursion level, then choose, explore, and undo while pruning impossible branches.",
    lessonSlugs: ["recursion-backtracking", "backtracking-templates"],
    problems: [
      ["subsets", "Subsets", "Medium"],
      ["combination-sum", "Combination Sum", "Medium"],
      ["permutations", "Permutations", "Medium"],
      ["subsets-ii", "Subsets II", "Medium"],
      ["combination-sum-ii", "Combination Sum II", "Medium"],
      ["word-search", "Word Search", "Medium"],
      ["palindrome-partitioning", "Palindrome Partitioning", "Medium"],
      [
        "letter-combinations-of-a-phone-number",
        "Letter Combinations of a Phone Number",
        "Medium",
      ],
      ["n-queens", "N-Queens", "Hard"],
      ["sudoku-solver", "Sudoku Solver", "Hard"],
    ],
  }),
  createTopic({
    id: "trees",
    name: "Trees (Binary Tree + BST)",
    strategy:
      "Let recursion mirror the tree shape, and use BST ordering only when it actually narrows the search.",
    lessonSlugs: ["binary-trees", "bst-and-heaps"],
    problems: [
      ["maximum-depth-of-binary-tree", "Maximum Depth of Binary Tree", "Easy"],
      ["same-tree", "Same Tree", "Easy"],
      ["invert-binary-tree", "Invert Binary Tree", "Easy"],
      ["binary-tree-level-order-traversal", "Binary Tree Level Order Traversal", "Medium"],
      ["diameter-of-binary-tree", "Diameter of Binary Tree", "Easy"],
      ["balanced-binary-tree", "Balanced Binary Tree", "Easy"],
      ["subtree-of-another-tree", "Subtree of Another Tree", "Easy"],
      [
        "lowest-common-ancestor-of-a-binary-search-tree",
        "Lowest Common Ancestor of a Binary Search Tree",
        "Medium",
        "bst-and-heaps",
      ],
      ["validate-binary-search-tree", "Validate Binary Search Tree", "Medium", "bst-and-heaps"],
      [
        "kth-smallest-element-in-a-bst",
        "Kth Smallest Element in a BST",
        "Medium",
        "bst-and-heaps",
      ],
      ["binary-tree-maximum-path-sum", "Binary Tree Maximum Path Sum", "Hard"],
      ["serialize-and-deserialize-binary-tree", "Serialize and Deserialize Binary Tree", "Hard"],
    ],
  }),
  createTopic({
    id: "heaps",
    name: "Heaps",
    strategy:
      "Keep only the best candidates seen so far when you need repeated min, max, top-k, or streaming access.",
    lessonSlugs: ["bst-and-heaps"],
    problems: [
      ["kth-largest-element-in-a-stream", "Kth Largest Element in a Stream", "Easy"],
      ["last-stone-weight", "Last Stone Weight", "Easy"],
      ["k-closest-points-to-origin", "K Closest Points to Origin", "Medium"],
      ["top-k-frequent-elements", "Top K Frequent Elements", "Medium"],
      ["task-scheduler", "Task Scheduler", "Medium"],
      ["find-median-from-data-stream", "Find Median from Data Stream", "Hard"],
      ["ipo", "IPO", "Hard"],
      [
        "smallest-range-covering-elements-from-k-lists",
        "Smallest Range Covering Elements from K Lists",
        "Hard",
      ],
    ],
  }),
  createTopic({
    id: "graphs-bfs-dfs",
    name: "Graphs (BFS/DFS)",
    strategy:
      "Build the adjacency or grid-neighbor model, mark nodes when discovered, and match BFS or DFS to the goal.",
    lessonSlugs: ["graphs-bfs-dfs"],
    problems: [
      ["number-of-islands", "Number of Islands", "Medium"],
      ["clone-graph", "Clone Graph", "Medium"],
      ["max-area-of-island", "Max Area of Island", "Medium"],
      ["pacific-atlantic-water-flow", "Pacific Atlantic Water Flow", "Medium"],
      ["surrounded-regions", "Surrounded Regions", "Medium"],
      ["rotting-oranges", "Rotting Oranges", "Medium"],
      ["word-ladder", "Word Ladder", "Hard"],
      ["open-the-lock", "Open the Lock", "Medium"],
      ["shortest-path-in-binary-matrix", "Shortest Path in Binary Matrix", "Medium"],
      ["keys-and-rooms", "Keys and Rooms", "Medium"],
    ],
  }),
  createTopic({
    id: "graphs-advanced",
    name: "Graphs Advanced (Union-Find/Topo/Dijkstra)",
    strategy:
      "Use DSU for connectivity, topological order for dependencies, and a priority queue for weighted shortest paths.",
    lessonSlugs: [
      "graphs-advanced",
      "union-find-dsu",
      "topological-sort-patterns",
      "shortest-paths-dijkstra",
    ],
    problems: [
      ["redundant-connection", "Redundant Connection", "Medium", "union-find-dsu"],
      [
        "number-of-connected-components-in-an-undirected-graph",
        "Number of Connected Components in an Undirected Graph",
        "Medium",
        "union-find-dsu",
      ],
      ["accounts-merge", "Accounts Merge", "Medium", "union-find-dsu"],
      ["course-schedule", "Course Schedule", "Medium", "topological-sort-patterns"],
      ["course-schedule-ii", "Course Schedule II", "Medium", "topological-sort-patterns"],
      ["alien-dictionary", "Alien Dictionary", "Hard", "topological-sort-patterns"],
      ["network-delay-time", "Network Delay Time", "Medium", "shortest-paths-dijkstra"],
      [
        "cheapest-flights-within-k-stops",
        "Cheapest Flights Within K Stops",
        "Medium",
        "shortest-paths-dijkstra",
      ],
      ["path-with-minimum-effort", "Path With Minimum Effort", "Medium", "shortest-paths-dijkstra"],
      ["min-cost-to-connect-all-points", "Min Cost to Connect All Points", "Medium"],
      ["swim-in-rising-water", "Swim in Rising Water", "Hard", "shortest-paths-dijkstra"],
      ["reconstruct-itinerary", "Reconstruct Itinerary", "Hard"],
    ],
  }),
  createTopic({
    id: "dynamic-programming",
    name: "Dynamic Programming (1D + 2D + Subsequences)",
    strategy:
      "Define the state and recurrence in words first, then choose memoization or a bottom-up traversal order.",
    lessonSlugs: ["dynamic-programming"],
    problems: [
      ["climbing-stairs", "Climbing Stairs", "Easy"],
      ["min-cost-climbing-stairs", "Min Cost Climbing Stairs", "Easy"],
      ["house-robber", "House Robber", "Medium"],
      ["house-robber-ii", "House Robber II", "Medium"],
      ["coin-change", "Coin Change", "Medium"],
      ["unique-paths", "Unique Paths", "Medium"],
      ["longest-common-subsequence", "Longest Common Subsequence", "Medium"],
      ["longest-increasing-subsequence", "Longest Increasing Subsequence", "Medium"],
      ["partition-equal-subset-sum", "Partition Equal Subset Sum", "Medium"],
      ["word-break", "Word Break", "Medium"],
      ["edit-distance", "Edit Distance", "Medium"],
      ["distinct-subsequences", "Distinct Subsequences", "Hard"],
    ],
  }),
  createTopic({
    id: "greedy",
    name: "Greedy",
    strategy:
      "Make the locally best choice only after identifying the invariant or exchange argument that proves it is safe.",
    lessonSlugs: ["greedy-algorithms"],
    problems: [
      ["jump-game", "Jump Game", "Medium"],
      ["jump-game-ii", "Jump Game II", "Medium"],
      ["gas-station", "Gas Station", "Medium"],
      ["partition-labels", "Partition Labels", "Medium"],
      ["hand-of-straights", "Hand of Straights", "Medium"],
      ["merge-triplets-to-form-target-triplet", "Merge Triplets to Form Target Triplet", "Medium"],
      ["candy", "Candy", "Hard"],
      ["boats-to-save-people", "Boats to Save People", "Medium"],
    ],
  }),
  createTopic({
    id: "tries-bit-manipulation",
    name: "Tries & Bit Manipulation",
    strategy:
      "Use tries for shared prefixes and bitwise identities when a compact set, subset, or XOR representation removes work.",
    lessonSlugs: ["tries-and-bitmask", "bit-manipulation-go"],
    problems: [
      ["implement-trie-prefix-tree", "Implement Trie (Prefix Tree)", "Medium"],
      [
        "design-add-and-search-words-data-structure",
        "Design Add and Search Words Data Structure",
        "Medium",
      ],
      ["word-search-ii", "Word Search II", "Hard"],
      ["single-number", "Single Number", "Easy", "bit-manipulation-go"],
      ["number-of-1-bits", "Number of 1 Bits", "Easy", "bit-manipulation-go"],
      ["counting-bits", "Counting Bits", "Easy", "bit-manipulation-go"],
      ["reverse-bits", "Reverse Bits", "Easy", "bit-manipulation-go"],
      ["missing-number", "Missing Number", "Easy", "bit-manipulation-go"],
      ["sum-of-two-integers", "Sum of Two Integers", "Medium", "bit-manipulation-go"],
      [
        "maximum-xor-of-two-numbers-in-an-array",
        "Maximum XOR of Two Numbers in an Array",
        "Medium",
      ],
    ],
  }),
  createTopic({
    id: "intervals",
    name: "Intervals",
    strategy:
      "Sort by the endpoint that drives the decision, then merge, count, or greedily discard overlaps.",
    lessonSlugs: ["intervals-and-math"],
    problems: [
      ["insert-interval", "Insert Interval", "Medium"],
      ["merge-intervals", "Merge Intervals", "Medium"],
      ["non-overlapping-intervals", "Non-overlapping Intervals", "Medium"],
      ["meeting-rooms", "Meeting Rooms", "Easy"],
      ["meeting-rooms-ii", "Meeting Rooms II", "Medium"],
      [
        "minimum-number-of-arrows-to-burst-balloons",
        "Minimum Number of Arrows to Burst Balloons",
        "Medium",
      ],
      ["car-pooling", "Car Pooling", "Medium"],
      ["employee-free-time", "Employee Free Time", "Hard"],
    ],
  }),
  createTopic({
    id: "string-algorithms",
    name: "String Algorithms",
    strategy:
      "Precompute prefix or palindrome structure so repeated comparisons do not fall back to a quadratic scan.",
    lessonSlugs: ["string-algorithms"],
    problems: [
      [
        "find-the-index-of-the-first-occurrence-in-a-string",
        "Find the Index of the First Occurrence in a String",
        "Easy",
      ],
      ["repeated-substring-pattern", "Repeated Substring Pattern", "Easy"],
      ["longest-palindromic-substring", "Longest Palindromic Substring", "Medium"],
      ["palindromic-substrings", "Palindromic Substrings", "Medium"],
      ["shortest-palindrome", "Shortest Palindrome", "Hard"],
      ["longest-happy-prefix", "Longest Happy Prefix", "Hard"],
    ],
  }),
];

export const totalProblemCount = patternTopics.reduce(
  (count, topic) => count + topic.problems.length,
  0,
);
