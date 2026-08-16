"use client";

import Link from "next/link";
import { CompleteButton } from "@/components/CompleteButton";
import type { Lesson, TrackMeta } from "@/content/types";

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
  prerequisites?: Array<{ slug: string; title: string }>;
}) {
  return (
    <header className="lesson-chrome panel reveal-delay-1">
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

      <div className="lesson-context-rail" aria-label="Lesson details">
        {lesson.free ? (
          <span className="lesson-context-chip lesson-context-chip-brand">Open sample</span>
        ) : null}
        <span className="lesson-context-chip">{lesson.minutes} min</span>
        <span className="lesson-context-chip lesson-context-chip-level">
          {lesson.difficulty}
        </span>
        <span className="lesson-context-chip">{stats.sections} sections</span>
        {stats.diagrams > 0 ? (
          <span className="lesson-context-chip">{stats.diagrams} diagrams</span>
        ) : null}
        {stats.checkpoints > 0 ? (
          <span className="lesson-context-chip">{stats.checkpoints} checkpoints</span>
        ) : null}
        {stats.codeBlocks > 0 ? (
          <span className="lesson-context-chip">{stats.codeBlocks} code</span>
        ) : null}
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

      {prerequisites && prerequisites.length > 0 ? (
        <p className="lesson-chrome-prereq">
          <span className="lesson-chrome-prereq-label">Prerequisites</span>
          {prerequisites.map((item, i) => (
            <span key={item.slug}>
              {i > 0 ? ", " : ""}
              <Link href={`/lesson/${item.slug}`}>{item.title}</Link>
            </span>
          ))}
        </p>
      ) : null}
    </header>
  );
}
