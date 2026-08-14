import Link from "next/link";
import type { ContentBlock } from "@/content/types";
import { lessonSectionId, sectionsFromBlocks } from "@/lib/lesson-sections";

export function LessonRoadmap({ blocks }: { blocks: ContentBlock[] }) {
  const segments = sectionsFromBlocks(blocks);
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
