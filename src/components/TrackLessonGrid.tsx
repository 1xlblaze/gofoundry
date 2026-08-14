"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Lesson, TrackMeta } from "@/content/types";
import { loadProgress } from "@/lib/progress";

export function TrackLessonGrid({
  track,
  lessons,
}: {
  track: TrackMeta;
  lessons: Lesson[];
}) {
  const [completed, setCompleted] = useState<string[]>([]);

  useEffect(() => {
    const refresh = () => setCompleted(loadProgress().completed);
    refresh();
    window.addEventListener("gofoundry-progress", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("gofoundry-progress", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const completedSet = useMemo(() => new Set(completed), [completed]);
  const doneCount = lessons.filter((lesson) => completedSet.has(lesson.slug)).length;
  const remainingMinutes = lessons
    .filter((lesson) => !completedSet.has(lesson.slug))
    .reduce((sum, lesson) => sum + lesson.minutes, 0);

  const continueLesson =
    lessons.find((lesson) => !completedSet.has(lesson.slug)) ?? lessons[lessons.length - 1];

  const progressPercent = lessons.length
    ? Math.round((doneCount / lessons.length) * 100)
    : 0;

  return (
    <>
      <div className="track-progress panel">
        <div className="track-progress-head">
          <div>
            <p className="type-label">Track progress</p>
            <p className="track-progress-stat">
              {doneCount} / {lessons.length} complete
              {remainingMinutes > 0 ? ` · ~${remainingMinutes} min left` : ""}
            </p>
          </div>
          {continueLesson ? (
            <Link href={`/lesson/${continueLesson.slug}`} className="primary-btn track-continue-btn">
              {doneCount === 0 ? "Start here" : "Continue where you left off"}
            </Link>
          ) : null}
        </div>
        <div
          className="track-progress-bar"
          role="progressbar"
          aria-label={`${track.short} track progress`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPercent}
        >
          <span style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <div className="grid-lessons">
        {lessons.map((lesson, i) => {
          const isComplete = completedSet.has(lesson.slug);
          return (
            <Link
              key={lesson.slug}
              href={`/lesson/${lesson.slug}`}
              className={`lesson-card${isComplete ? " lesson-card-complete" : ""}`}
              data-motion
            >
              <div className="lesson-card-top">
                <span
                  className="chip lesson-card-index"
                  style={{ color: track.accent, fontFamily: "var(--font-mono)" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                {lesson.free ? (
                  <span className="chip chip-brand">Free</span>
                ) : (
                  <span className="chip chip-muted">Staff-grade</span>
                )}
                {isComplete ? <span className="chip chip-complete">Done</span> : null}
              </div>
              <h3>{lesson.title}</h3>
              <p>{lesson.subtitle}</p>
              <div className="lesson-card-meta">
                <span className="chip">{lesson.minutes} min</span>
                <span className="chip chip-brand" style={{ textTransform: "capitalize" }}>
                  {lesson.difficulty}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
