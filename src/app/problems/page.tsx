import Link from "next/link";
import type { Metadata } from "next";
import { getLesson } from "@/content";

export const metadata: Metadata = {
  title: "Problem Bank",
  description:
    "Patterns-first index of classic interview problems, mapped to GoFoundry lessons with Go solutions.",
};

type PatternGroup = {
  name: string;
  strategy: string;
  lessons: string[];
  extra?: string[];
};

const groups: PatternGroup[] = [
  {
    name: "Two Pointers & Sliding Window",
    strategy: "Shrink the search space with converging or expanding indices instead of nested loops.",
    lessons: ["arrays-and-slices", "strings-and-runes", "sliding-window-two-pointers"],
    extra: [
      "3Sum / 4Sum (sorted + two pointers)",
      "Container With Most Water",
      "Longest Repeating Character Replacement",
      "Minimum Size Subarray Sum",
    ],
  },
  {
    name: "Linked Lists",
    strategy: "Dummy heads, fast/slow pointers, and careful pointer rewiring.",
    lessons: ["linked-lists"],
    extra: [
      "Merge K Sorted Lists (heap + linked list)",
      "Reorder List",
      "Copy List with Random Pointer",
      "LRU Cache (see LLD track)",
    ],
  },
  {
    name: "Stacks, Queues & Monotonic Structures",
    strategy: "Use a stack to defer decisions until you see the element that resolves them.",
    lessons: ["stacks-and-queues", "monotonic-stack-queue"],
    extra: [
      "Daily Temperatures",
      "Largest Rectangle in Histogram",
      "Sliding Window Maximum (monotonic deque)",
      "Implement Queue using Stacks",
    ],
  },
  {
    name: "Hashing",
    strategy: "Trade O(n) space for O(1) average lookups to collapse O(n²) scans.",
    lessons: ["hash-maps-and-sets"],
    extra: [
      "Longest Consecutive Sequence",
      "Subarray Sum Equals K (prefix sum + map)",
      "Isomorphic Strings",
    ],
  },
  {
    name: "Trees",
    strategy: "Recursion mirrors tree structure; know pre/in/post/level order cold.",
    lessons: ["binary-trees", "bst-and-heaps"],
    extra: [
      "Lowest Common Ancestor",
      "Validate BST",
      "Serialize / Deserialize Binary Tree",
      "Kth Smallest Element in a BST",
    ],
  },
  {
    name: "Graphs",
    strategy: "Adjacency list + BFS/DFS/Union-Find/topological sort, chosen by what the question asks for.",
    lessons: [
      "graphs-bfs-dfs",
      "graphs-advanced",
      "shortest-paths-dijkstra",
      "union-find-dsu",
      "topological-sort-patterns",
    ],
    extra: [
      "Clone Graph",
      "Word Ladder (BFS shortest transformation)",
      "Alien Dictionary (topological sort)",
      "Network Delay Time (Dijkstra)",
      "Number of Connected Components (Union-Find)",
    ],
  },
  {
    name: "Backtracking",
    strategy: "Choose → explore → unchoose; prune branches that can't reach a valid solution.",
    lessons: ["recursion-backtracking", "backtracking-templates"],
    extra: ["Permutations II (with duplicates)", "N-Queens", "Word Search", "Palindrome Partitioning"],
  },
  {
    name: "Dynamic Programming",
    strategy: "Define state precisely, write the recurrence, then decide top-down memo vs bottom-up table.",
    lessons: ["dynamic-programming"],
    extra: [
      "Longest Common Subsequence",
      "Edit Distance",
      "House Robber II (circular)",
      "Longest Increasing Subsequence (O(n log n))",
      "Partition Equal Subset Sum",
    ],
  },
  {
    name: "Greedy",
    strategy: "Prove (or find a counterexample for) the local-choice-is-global-optimum claim before coding.",
    lessons: ["greedy-algorithms"],
    extra: ["Gas Station", "Task Scheduler", "Non-overlapping Intervals"],
  },
  {
    name: "Intervals & Sweep Line",
    strategy: "Sort by start or end; sweep with running counters for overlap/room-counting problems.",
    lessons: ["intervals-and-math"],
    extra: ["Insert Interval", "Employee Free Time", "Car Pooling"],
  },
  {
    name: "Binary Search",
    strategy: "Search on the answer space when the predicate is monotonic, not just on sorted arrays.",
    lessons: ["sorting-searching", "binary-search-patterns"],
    extra: [
      "Search in Rotated Sorted Array",
      "Median of Two Sorted Arrays",
      "Koko Eating Bananas (search on answer)",
    ],
  },
  {
    name: "Tries & Bit Manipulation",
    strategy: "Prefix trees for string sets; bit tricks for subsets and XOR properties.",
    lessons: ["tries-and-bitmask", "bit-manipulation-go"],
    extra: ["Word Search II (Trie + DFS)", "Design Add and Search Words", "Counting Bits"],
  },
  {
    name: "String Algorithms",
    strategy: "Linear-time pattern matching beats the naive O(nm) scan at scale.",
    lessons: ["string-algorithms"],
    extra: ["Shortest Palindrome", "Repeated String Match", "Longest Happy Prefix"],
  },
];

export default function ProblemsPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-14 sm:py-16">
      <p className="type-label">Practice, organized by pattern</p>
      <h1 className="type-title mt-3 text-[var(--text-h1)] text-ink">Problem Bank</h1>
      <p className="mt-4 max-w-2xl text-[var(--text-lead)] leading-relaxed text-ink-soft">
        Interview prep fails when you memorize solutions instead of patterns. Every
        pattern below links to a GoFoundry lesson with the HEAT think/diagram/answer
        breakdown, plus a curated set of named problems to drill once the pattern
        clicks.
      </p>

      <div className="mt-14 space-y-12">
        {groups.map((g) => (
          <section key={g.name} className="border-t border-[var(--line)] pt-8">
            <h2 className="type-title text-[1.4rem] text-ink">{g.name}</h2>
            <p className="mt-2 max-w-2xl text-[1.02rem] text-ink-soft">
              {g.strategy}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {g.lessons.map((slug) => {
                const lesson = getLesson(slug);
                if (!lesson) return null;
                return (
                  <Link
                    key={slug}
                    href={`/lesson/${slug}`}
                    className="border border-[var(--line-strong)] bg-foam/70 px-3.5 py-2 text-sm font-semibold text-ink transition hover:border-teal hover:text-teal-deep"
                  >
                    {lesson.title} →
                  </Link>
                );
              })}
            </div>
            {g.extra && g.extra.length > 0 && (
              <ul className="mt-5 grid gap-x-8 gap-y-2 sm:grid-cols-2">
                {g.extra.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-ink-soft">
                    <span className="text-teal">·</span>
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
