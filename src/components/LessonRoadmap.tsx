import Link from "next/link";
import type { ContentBlock } from "@/content/types";
import type { LessonSection } from "@/lib/lesson-sections";
import { sectionsFromBlocks } from "@/lib/lesson-sections";
import { MotionDiagram } from "@/components/MotionDiagram";

const toneAccent: Record<string, string> = {
  visual: "#0f766e",
  think: "#2563eb",
  read: "#d97706",
  action: "#ea580c",
  neutral: "#64748b",
};

function roadmapNodes(segments: LessonSection[]) {
  if (segments.length <= 8) {
    return segments.map((segment) => ({
      id: segment.id,
      label: segment.label,
      sub: segment.tone,
      href: `#${segment.id}`,
      accent: toneAccent[segment.tone] ?? "#0f766e",
    }));
  }

  const tones: LessonSection["tone"][] = ["visual", "think", "action", "neutral"];
  return tones
    .map((tone) => {
      const matches = segments.filter((segment) => segment.tone === tone);
      const first = matches[0];
      if (!first) return null;
      return {
        id: `${tone}-group`,
        label: `${matches.length} ${tone === "visual" ? "diagrams" : tone}`,
        sub: first.label,
        href: `#${first.id}`,
        accent: toneAccent[tone] ?? "#0f766e",
      };
    })
    .filter((node): node is NonNullable<typeof node> => node !== null);
}

export function LessonRoadmap({ blocks }: { blocks: ContentBlock[] }) {
  const segments = sectionsFromBlocks(blocks);
  const diagramCount = segments.filter((s) => s.tone === "visual").length;
  const thinkCount = segments.filter((s) => s.tone === "think").length;
  const compact = segments.length >= 6;

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
      {compact ? (
        <div className="lesson-roadmap-diagram">
          <MotionDiagram
            title="Lesson thread"
            caption="Long lesson? Walk the diagram first, then open only the section you need."
            headingLevel="p"
            nodes={roadmapNodes(segments)}
          />
        </div>
      ) : null}
      <ol className="lesson-roadmap-track">
        {segments.map((segment) => (
          <li
            key={`${segment.index}-${segment.label}`}
            className={`lesson-roadmap-step lesson-roadmap-${segment.tone}`}
          >
            <Link href={`#${segment.id}`} className="lesson-roadmap-link">
              <span className="lesson-roadmap-index">
                {String(segment.index + 1).padStart(2, "0")}
              </span>
              <span>{segment.label}</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
