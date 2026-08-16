export type TrackId =
  | "foundations"
  | "dsa"
  | "concepts"
  | "internals"
  | "lld"
  | "hld"
  | "method"
  | "stdlib"
  | "web";

export type Difficulty = "beginner" | "intermediate" | "advanced";

export type DiagramKind =
  | "two-pointers"
  | "sliding-window"
  | "linked-list-reverse"
  | "bfs-levels"
  | "tree-dfs"
  | "heap-shape"
  | "token-bucket"
  | "outbox"
  | "gpm-scheduler"
  | "hash-map-buckets"
  | "heat-cycle"
  | "url-shortener-arch"
  | "chat-arch"
  | "video-arch"
  | "ride-arch"
  | "payment-arch"
  | "feed-arch"
  | "lru-cache-structure"
  | "singleflight-timeline";

export type ContentBlock =
  | { type: "prose"; title?: string; body: string }
  | { type: "code"; title?: string; language: "go" | "bash" | "text"; code: string }
  | { type: "callout"; tone: "tip" | "warn" | "note"; body: string }
  | { type: "complexity"; time: string; space: string; notes?: string }
  | { type: "steps"; title?: string; items: string[] }
  | {
      type: "think";
      title?: string;
      clarify: string[];
      model: string[];
      pitfalls?: string[];
    }
  | {
      type: "answer";
      title?: string;
      opening: string;
      beats: string[];
      closing?: string;
    }
  | {
      type: "diagram";
      title?: string;
      kind: DiagramKind;
      caption?: string;
    }
  | {
      type: "tradeoff";
      title: string;
      choices: Array<{
        label: string;
        pros: string[];
        cons: string[];
        when: string;
      }>;
    }
  | {
      type: "capacity";
      title?: string;
      rows: Array<{ label: string; value: string }>;
    };

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string;
};

export type Lesson = {
  slug: string;
  track: TrackId;
  title: string;
  subtitle: string;
  difficulty: Difficulty;
  minutes: number;
  tags: string[];
  free?: boolean;
  prerequisites?: string[];
  blocks: ContentBlock[];
  quiz: QuizQuestion[];
};

export type TrackMeta = {
  id: TrackId;
  title: string;
  short: string;
  description: string;
  accent: string;
};
