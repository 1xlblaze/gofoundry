"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { allLessons, tracks, lessonsForTrack } from "@/content";
import { loadProgress, type ProgressState } from "@/lib/progress";

export default function LearnPage() {
  const [progress, setProgress] = useState<ProgressState>({
    completed: [],
    quizScores: {},
    completedAt: {},
  });

  useEffect(() => {
    const refresh = () => setProgress(loadProgress());
    refresh();
    window.addEventListener("gofoundry-progress", refresh);
    return () => window.removeEventListener("gofoundry-progress", refresh);
  }, []);

  const done = progress.completed.length;
  const total = allLessons.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="shell" style={{ padding: "2.5rem 0 3.5rem" }}>
      <div className="page-hero reveal">
        <h1>Curriculum</h1>
        <p>Work the tracks in any order. Progress stays in this browser.</p>
      </div>

      <div className="reveal-delay-1" style={{ maxWidth: "28rem", marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.45rem", fontSize: "0.9rem" }}>
          <span style={{ fontWeight: 650 }}>
            {done} / {total} complete
          </span>
          <span style={{ color: "var(--muted)", fontFamily: "var(--font-mono)" }}>{pct}%</span>
        </div>
        <div className="progress-bar">
          <span style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="mt-16 space-y-16">
        {tracks.map((track) => {
          const lessons = lessonsForTrack(track.id);
          const trackDone = lessons.filter((l) =>
            progress.completed.includes(l.slug),
          ).length;
          return (
            <section key={track.id}>
              <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--line)] pb-5">
                <div>
                  <p className="type-label" style={{ color: track.accent }}>
                    {track.short}
                  </p>
                  <h2 className="type-title mt-2 text-[var(--text-h2)]">
                    <Link
                      href={`/track/${track.id}`}
                      className="text-ink transition-colors hover:text-teal-deep"
                    >
                      {track.title}
                    </Link>
                  </h2>
                </div>
                <p className="font-mono text-sm text-ink-faint">
                  {trackDone}/{lessons.length}
                </p>
              </div>
              <ol className="mt-2">
                {lessons.map((lesson, i) => {
                  const complete = progress.completed.includes(lesson.slug);
                  return (
                    <li key={lesson.slug} className="border-b border-[var(--line)]">
                      <Link
                        href={`/lesson/${lesson.slug}`}
                        className="group flex flex-col gap-2 py-5 transition sm:flex-row sm:items-baseline sm:justify-between sm:gap-8"
                      >
                        <div className="flex gap-5">
                          <span className="w-7 font-mono text-sm text-ink-faint">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <div>
                            <p className="type-title text-[1.1rem] text-ink transition-colors group-hover:text-teal-deep">
                              {lesson.title}
                            </p>
                            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-ink-soft">
                              {lesson.subtitle}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 pl-12 font-mono text-[0.7rem] tracking-wide text-ink-faint uppercase sm:pl-0">
                          <span>{lesson.minutes}m</span>
                          <span>{lesson.difficulty}</span>
                          {complete && (
                            <span className="bg-mint/35 px-2 py-0.5 font-semibold text-teal-deep normal-case tracking-tight">
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
