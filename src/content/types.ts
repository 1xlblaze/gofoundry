export type TrackId =
  | "dsa"
  | "concepts"
  | "internals"
  | "lld"
  | "hld";

export type Difficulty = "beginner" | "intermediate" | "advanced";

export type ContentBlock =
  | { type: "prose"; title?: string; body: string }
  | { type: "code"; title?: string; language: "go" | "bash" | "text"; code: string }
  | { type: "callout"; tone: "tip" | "warn" | "note"; body: string }
  | { type: "complexity"; time: string; space: string; notes?: string }
  | { type: "steps"; title?: string; items: string[] };

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
