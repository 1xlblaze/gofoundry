"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { allLessons, tracks, lessonsForTrack } from "@/content";
import { loadProgress, type ProgressState } from "@/lib/progress";

export default function LearnPage() {
  const [progress, setProgress] = useState<ProgressState>({
    completed: [],
    quizScores: {},
  });

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  const done = progress.completed.length;
  const total = allLessons.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight">
        Curriculum
      </h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Work the tracks in any order. Progress is saved in this browser.
      </p>

      <div className="mt-8">
        <div className="mb-2 flex items-end justify-between text-sm">
          <span className="font-medium text-ink">
            {done} / {total} lessons complete
          </span>
          <span className="text-ink-soft">{pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-paper-2">
          <div
            className="h-full rounded-full bg-teal transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="mt-14 space-y-14">
        {tracks.map((track) => {
          const lessons = lessonsForTrack(track.id);
          const trackDone = lessons.filter((l) =>
            progress.completed.includes(l.slug),
          ).length;
          return (
            <section key={track.id}>
              <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--line)] pb-4">
                <div>
                  <p
                    className="text-xs font-semibold uppercase tracking-[0.18em]"
                    style={{ color: track.accent }}
                  >
                    {track.short}
                  </p>
                  <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold">
                    <Link href={`/track/${track.id}`} className="hover:text-teal-deep">
                      {track.title}
                    </Link>
                  </h2>
                </div>
                <p className="text-sm text-ink-soft">
                  {trackDone}/{lessons.length} done
                </p>
              </div>
              <ol className="mt-6 divide-y divide-[var(--line)]">
                {lessons.map((lesson, i) => {
                  const complete = progress.completed.includes(lesson.slug);
                  return (
                    <li key={lesson.slug}>
                      <Link
                        href={`/lesson/${lesson.slug}`}
                        className="flex flex-col gap-1 py-4 transition hover:bg-foam/50 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
                      >
                        <div className="flex gap-4">
                          <span className="w-8 font-mono text-sm text-ink-soft">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <div>
                            <p className="font-semibold text-ink">{lesson.title}</p>
                            <p className="text-sm text-ink-soft">{lesson.subtitle}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 pl-12 text-xs font-medium uppercase tracking-wide text-ink-soft sm:pl-0">
                          <span>{lesson.minutes} min</span>
                          <span>{lesson.difficulty}</span>
                          {complete && (
                            <span className="rounded-full bg-mint/40 px-2 py-1 text-teal-deep">
                              Done
                            </span>
                          )}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}
