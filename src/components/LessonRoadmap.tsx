import type { ContentBlock } from "@/content/types";
import { sectionsFromBlocks } from "@/lib/lesson-sections";

export function LessonRoadmap({ blocks }: { blocks: ContentBlock[] }) {
  const segments = sectionsFromBlocks(blocks);
  const diagramCount = segments.filter((s) => s.tone === "visual").length;
  const thinkCount = segments.filter((s) => s.tone === "think").length;
  const actionCount = segments.filter((s) => s.tone === "action").length;

  if (segments.length < 2) return null;

  return (
    <section className="lesson-overview panel" aria-label="Lesson roadmap">
      <div className="lesson-overview-head">
        <div>
          <p className="type-label">Lesson overview</p>
          <p className="lesson-overview-lead">
            {segments.length} sections with diagrams, checkpoints, and code — use the section
            navigator to jump ahead. Everything below is free to read.
          </p>
        </div>
        <dl className="lesson-overview-stats">
          <div>
            <dt>Sections</dt>
            <dd>{segments.length}</dd>
          </div>
          <div>
            <dt>Diagrams</dt>
            <dd>{diagramCount}</dd>
          </div>
          <div>
            <dt>Checkpoints</dt>
            <dd>{thinkCount}</dd>
          </div>
          {actionCount > 0 ? (
            <div>
              <dt>Code blocks</dt>
              <dd>{actionCount}</dd>
            </div>
          ) : null}
        </dl>
      </div>
    </section>
  );
}
