import type { ContentBlock } from "@/content/types";

const BLOCK_META: Record<
  ContentBlock["type"],
  { label: string; tone: "neutral" | "visual" | "action" | "think" }
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

export function LessonRoadmap({ blocks }: { blocks: ContentBlock[] }) {
  const segments = blocks.map((block, index) => ({
    index,
    ...BLOCK_META[block.type],
  }));

  const diagramCount = segments.filter((s) => s.tone === "visual").length;
  const thinkCount = segments.filter((s) => s.tone === "think").length;

  return (
    <section className="panel lesson-roadmap" aria-label="Lesson roadmap">
      <div className="lesson-roadmap-head">
        <p className="type-label">At a glance</p>
        <h2>Don&apos;t lose the plot — follow the visual thread</h2>
        <p>
          {segments.length} sections · {diagramCount} diagram{diagramCount === 1 ? "" : "s"} ·{" "}
          {thinkCount} thinking checkpoint{thinkCount === 1 ? "" : "s"}. Jump ahead or skim the
          shape before diving into theory.
        </p>
      </div>
      <ol className="lesson-roadmap-track">
        {segments.map((segment) => (
          <li
            key={`${segment.index}-${segment.label}`}
            className={`lesson-roadmap-step lesson-roadmap-${segment.tone}`}
          >
            <span className="lesson-roadmap-index">{String(segment.index + 1).padStart(2, "0")}</span>
            <span>{segment.label}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
