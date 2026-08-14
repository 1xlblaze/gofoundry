import type { ContentBlock } from "@/content/types";

export type LessonSection = {
  id: string;
  index: number;
  label: string;
  tone: "neutral" | "visual" | "action" | "think";
};

const BLOCK_META: Record<
  ContentBlock["type"],
  { label: string; tone: LessonSection["tone"] }
> = {
  prose: { label: "Concept", tone: "neutral" },
  code: { label: "Code", tone: "action" },
  callout: { label: "Note", tone: "neutral" },
  complexity: { label: "Complexity", tone: "neutral" },
  steps: { label: "Steps", tone: "action" },
  tradeoff: { label: "Tradeoffs", tone: "think" },
  capacity: { label: "Capacity", tone: "neutral" },
  think: { label: "Think", tone: "think" },
  answer: { label: "Answer script", tone: "action" },
  diagram: { label: "Diagram", tone: "visual" },
};

export function lessonSectionId(index: number) {
  return `lesson-section-${index + 1}`;
}

export function sectionsFromBlocks(blocks: ContentBlock[]): LessonSection[] {
  return blocks.map((block, index) => {
    const meta = BLOCK_META[block.type];
    const title =
      "title" in block && block.title ? block.title : meta.label;
    return {
      id: lessonSectionId(index),
      index,
      label: title,
      tone: meta.tone,
    };
  });
}
