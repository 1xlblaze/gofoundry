import type { Lesson } from "./types";

/** Unique GoFoundry USP — the HEAT cycle for solving & interviewing in Go. */
export const methodLessons: Lesson[] = [
  {
    slug: "foundry-heat-method",
    track: "method",
    title: "The Foundry HEAT Method",
    subtitle:
      "Our unique model: Hear → Etch → Anchor → Temper — how Go engineers should think, diagram, and answer.",
    difficulty: "beginner",
    minutes: 18,
    tags: ["usp", "interview", "method"],
    blocks: [
      {
        type: "diagram",
        title: "HEAT cycle",
        kind: "heat-cycle",
        caption: "Every GoFoundry problem runs this loop — not code-first.",
      },
      {
        type: "prose",
        title: "Why HEAT exists",
        body: "Most courses dump solutions. GoFoundry trains a repeatable forge cycle tuned for Go: clarify costs (allocations, APIs), draw the state machine, pick a Go-native pattern, then temper with idiomatic code and proof. That is our USP — a named operating system for DSA, LLD, and HLD in Go.",
      },
      {
        type: "think",
        title: "How to THINK (before typing)",
        clarify: [
          "Input/output shapes and mutability — slice shared backing? map concurrency?",
          "Constraints: n size, online vs offline, latency SLO, memory budget",
          "Failure modes: empty, single element, duplicates, cycles, overflow",
        ],
        model: [
          "Name the data structure that owns truth (slice header, pointer graph, heap, DSU…)",
          "Sketch transitions on paper/diagram before choosing an algorithm family",
          "Prefer Go stdlib levers (sort.Search, container/heap, context) when they fit",
        ],
        pitfalls: [
          "Coding a clever trick before stating invariants",
          "Ignoring escape/alloc cost in hot paths during interviews when asked to optimize",
        ],
      },
      {
        type: "answer",
        title: "How to ANSWER (interview script)",
        opening:
          "Restate the problem in one sentence, then constraints and the success metric.",
        beats: [
          "H — Clarify: ask 2–3 high-leverage questions (sorted? duplicates? concurrency?).",
          "E — Etch: draw the diagram (pointers, window, queue layers, component boxes).",
          "A — Anchor: name the pattern + complexity target before coding.",
          "T — Temper: write clean Go, narrate invariants, then dry-run an example + edge case.",
        ],
        closing:
          "End with trade-offs: what changes if n is 10× or we need concurrent readers?",
      },
      {
        type: "steps",
        title: "Use HEAT on every GoFoundry lesson",
        items: [
          "Read Think block first — do not skip to code",
          "Study the diagram until you can redraw it from memory",
          "Say the Answer script out loud once",
          "Only then implement / compare with the Go sample",
          "Close with quiz + mark complete",
        ],
      },
    ],
    quiz: [
      {
        id: "heat1",
        prompt: "In HEAT, what does Etch mean?",
        options: [
          "Premature micro-optimization",
          "Diagram the state / data flow before coding",
          "Memorize leetcode titles",
          "Skip clarifying questions",
        ],
        answerIndex: 1,
        explanation: "Etch = visual model. Drawing is part of the method, not decoration.",
      },
      {
        id: "heat2",
        prompt: "Temper includes which interview move?",
        options: [
          "Only pasting code silently",
          "Idiomatic Go + dry-run + complexity proof",
          "Changing languages mid-problem",
          "Ignoring edge cases",
        ],
        answerIndex: 1,
        explanation: "Temper is where code meets proof and Go idioms.",
      },
    ],
  },
  {
    slug: "interview-operating-system",
    track: "method",
    title: "Interview Operating System",
    subtitle: "Timed beats, what to say when stuck, and Go-specific signals interviewers love.",
    difficulty: "intermediate",
    minutes: 16,
    tags: ["interview", "communication"],
    prerequisites: ["foundry-heat-method"],
    blocks: [
      {
        type: "prose",
        title: "45-minute forge schedule",
        body: "0–4 min Hear. 4–10 min Etch + Anchor (diagram + approach). 10–35 min Temper (code). 35–45 min tests, complexity, extensions. If you are silent for >30s, narrate the invariant you are protecting.",
      },
      {
        type: "answer",
        title: "When you get stuck",
        opening: "Name the blocker out loud — interviewers grade recovery.",
        beats: [
          "Shrink the problem: solve for n≤3 on the diagram.",
          "Re-state the invariant that broke.",
          "Offer a slower correct approach, then optimize — never freeze.",
          "In Go: check nil, len==0, and whether you mutated a shared slice header.",
        ],
      },
      {
        type: "think",
        title: "Go-specific tells of seniority",
        clarify: [
          "You mention API boundaries and error wrapping",
          "You discuss concurrency hazards without prompting",
          "You choose clarity over clever bit tricks unless asked",
        ],
        model: [
          "table-driven tests as a finishing move",
          "context as first parameter when sketching services",
          "small interfaces defined on the consumer side",
        ],
      },
    ],
    quiz: [
      {
        id: "ios1",
        prompt: "Best recovery when stuck?",
        options: [
          "Stare silently at the editor",
          "Shrink on the diagram and restate the broken invariant",
          "Ask to switch to Python immediately",
          "Delete everything without explanation",
        ],
        answerIndex: 1,
        explanation: "Visible recovery with a smaller instance is a strong signal.",
      },
    ],
  },
];
