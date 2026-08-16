"use client";

import Link from "next/link";
import { CompleteButton } from "@/components/CompleteButton";
import type { Lesson, TrackMeta } from "@/content/types";
import {
  formatLessonCheckpoints,
  formatLessonCodeBlocks,
  formatLessonDiagrams,
  formatLessonSections,
  type PrerequisiteLink,
} from "@/lib/lesson-display";

type LessonStats = {
  sections: number;
  diagrams: number;
  checkpoints: number;
  codeBlocks: number;
};

export function LessonChrome({
  lesson,
  track,
  stats,
  prerequisites,
}: {
  lesson: Lesson;
  track: TrackMeta;
  stats: LessonStats;
  prerequisites?: PrerequisiteLink[];
}) {
  const statChips = [
    lesson.free ? { label: "Open sample", className: "lesson-context-chip-brand" } : null,
    { label: `${lesson.minutes} min`, className: "" },
    { label: lesson.difficulty, className: "lesson-context-chip-level" },
    { label: formatLessonSections(stats.sections), className: "" },
    formatLessonDiagrams(stats.diagrams)
      ? { label: formatLessonDiagrams(stats.diagrams)!, className: "" }
      : null,
    formatLessonCheckpoints(stats.checkpoints)
      ? { label: formatLessonCheckpoints(stats.checkpoints)!, className: "" }
      : null,
    formatLessonCodeBlocks(stats.codeBlocks)
      ? { label: formatLessonCodeBlocks(stats.codeBlocks)!, className: "" }
      : null,
  ].filter(Boolean) as Array<{ label: string; className: string }>;

  return (
    <header className="lesson-chrome panel">
      <div className="lesson-chrome-top">
        <div className="lesson-chrome-track">
          <span
            className="lesson-chrome-track-dot"
            style={{ background: track.accent }}
            aria-hidden
          />
          <span className="type-label" style={{ color: track.accent }}>
            {track.title}
          </span>
        </div>
        <CompleteButton slug={lesson.slug} />
      </div>

      <h1 className="lesson-chrome-title">{lesson.title}</h1>
      <p className="lesson-chrome-subtitle">{lesson.subtitle}</p>

      <div className="lesson-chrome-meta">
        <div className="lesson-context-rail" aria-label="Lesson stats">
          {statChips.map((chip) => (
            <span
              key={chip.label}
              className={`lesson-context-chip${chip.className ? ` ${chip.className}` : ""}`}
            >
              {chip.label}
            </span>
          ))}
        </div>

        {lesson.tags.length > 0 ? (
          <div className="lesson-topics" aria-label="Topics covered in this lesson">
            {lesson.tags.map((tag) => (
              <Link
                key={tag}
                href={`/learn?topic=${encodeURIComponent(tag)}`}
                className="lesson-topic-chip"
              >
                {tag}
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      {prerequisites && prerequisites.length > 0 ? (
        <p className="lesson-chrome-prereq">
          <span className="lesson-chrome-prereq-label">Prerequisites</span>
          {prerequisites.map((item, i) => (
            <span key={item.key}>
              {i > 0 ? ", " : ""}
              {item.href ? (
                <Link href={item.href}>{item.title}</Link>
              ) : (
                <span className="lesson-chrome-prereq-text">{item.title}</span>
              )}
            </span>
          ))}
        </p>
      ) : null}
    </header>
  );
}
