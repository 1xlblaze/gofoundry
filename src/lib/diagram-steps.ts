import type { DiagramKind } from "@/content/types";

export const diagramSteps: Partial<Record<DiagramKind, string[]>> = {
  "lru-cache-structure": [
    "Doubly linked list with sentinel roots — order from MRU (left) to LRU (right).",
    "Hash map stores key → node pointer for O(1) lookup without scanning the list.",
    "On Get hit: unlink node, push to MRU front, return value — sizes stay equal.",
    "Eviction removes LRU tail; stampede protection uses singleflight on miss paths.",
  ],
  "singleflight-timeline": [
    "Four goroutines miss on key E concurrently — cache is empty.",
    "Misses collapse through singleflight.Group — one leader executes Do(key).",
    "Leader loads value while G2–G4 block on the shared in-flight call.",
    "Result is stored in cache; all waiters receive the same immutable copy.",
  ],
  "two-pointers": [
    "Left and right pointers bracket the searchable range on the array.",
    "Move the pointer that restores the invariant after each comparison.",
    "Pointers converge until the window is exhausted or target is found.",
  ],
  "sliding-window": [
    "Expand the right edge to grow the candidate window.",
    "When invalid, shrink from the left until the invariant holds again.",
    "Track the best window while scanning — typical O(n) single pass.",
  ],
  "linked-list-reverse": [
    "Track prev, curr, and next — never lose the forward link.",
    "Rewire curr.Next to prev, then advance the trio one node.",
    "Repeat until curr is nil; prev becomes the new head.",
  ],
  "heat-cycle": [
    "Hear — clarify constraints, costs, and failure modes.",
    "Etch — diagram state, data flow, and concurrency boundaries.",
    "Anchor — choose pattern, complexity targets, and trade-offs.",
    "Temper — write idiomatic Go and prove with tests and diagnostics.",
  ],
};
