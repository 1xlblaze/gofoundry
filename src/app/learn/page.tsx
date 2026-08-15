"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { allLessons, tracks, lessonsForTrack } from "@/content";
import type { TrackId } from "@/content/types";
import { LearnTrackNav } from "@/components/LearnTrackNav";
import {
  DifficultyChip,
  ScrollReveal,
  StatCard,
  StatusChip,
} from "@/components/ui";
import { loadProgress, type ProgressState } from "@/lib/progress";
import { getContinueLesson } from "@/lib/continueLesson";

export default function LearnPage() {
  const [progress, setProgress] = useState<ProgressState>({
    completed: [],
    quizScores: {},
    completedAt: {},
  });
  const [activeTrack, setActiveTrack] = useState<TrackId | undefined>();

  useEffect(() => {
    const refresh = () => setProgress(loadProgress());
    refresh();
    window.addEventListener("gofoundry-progress", refresh);
    return () => window.removeEventListener("gofoundry-progress", refresh);
  }, []);

  useEffect(() => {
    const sections = tracks
      .map((track) => document.getElementById(`track-${track.id}`))
      .filter((node): node is HTMLElement => node !== null);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          const id = visible[0].target.id.replace("track-", "") as TrackId;
          setActiveTrack(id);
        }
      },
      { rootMargin: "-25% 0px -55% 0px", threshold: 0.01 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const done = progress.completed.length;
  const total = allLessons.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const trackProgress = useMemo(() => {
    const map: Record<string, { done: number; total: number }> = {};
    for (const track of tracks) {
      const lessons = lessonsForTrack(track.id);
      map[track.id] = {
        done: lessons.filter((lesson) => progress.completed.includes(lesson.slug)).length,
        total: lessons.length,
      };
    }
    return map;
  }, [progress.completed]);

  const continueLesson = getContinueLesson(progress);

  return (
    <ScrollReveal>
      <div className="shell" style={{ padding: "2.5rem 0 3.5rem" }}>
        <div className="page-hero reveal" data-motion>
          <h1>Curriculum</h1>
          <p>
            Work the tracks in any order. Progress stays in this browser until you sign in.
          </p>
        </div>

        <div className="learn-layout-grid">
          <aside className="learn-sidebar" data-motion>
            <div className="progress-dashboard learn-sidebar-stats">
              <StatCard value={done} suffix={` / ${total}`} label="Lessons complete" />
              <StatCard value={pct} suffix="%" label="Overall progress" />
              <StatCard
                value={Object.keys(progress.quizScores).length}
                label="Quizzes scored"
              />
            </div>

            <div className="progress-bar learn-sidebar-bar">
              <span style={{ width: `${pct}%` }} />
            </div>

            <LearnTrackNav activeTrack={activeTrack} trackProgress={trackProgress} />
          </aside>

          <div className="learn-main">
            {continueLesson ? (
              <div className="progress-streak-banner" data-motion>
                <div>
                  <p className="type-label">Your journey</p>
                  <p style={{ margin: 0, fontWeight: 650 }}>
                    {done === 0
                      ? "Start with your first lesson — pick a track in the sidebar."
                      : `Continue with ${continueLesson.title}`}
                  </p>
                </div>
                <Link href={`/lesson/${continueLesson.slug}`} className="primary-btn">
                  {done === 0 ? "Start learning" : "Continue →"}
                </Link>
              </div>
            ) : null}

            <div className="space-y-16">
            {tracks.map((track) => {
              const lessons = lessonsForTrack(track.id);
              const trackDone = trackProgress[track.id]?.done ?? 0;
              const trackPct = lessons.length
                ? Math.round((trackDone / lessons.length) * 100)
                : 0;

              return (
                <section key={track.id} id={`track-${track.id}`} data-motion>
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
                    <div className="ring-summary">
                      <div
                        className="ring-wrap"
                        role="img"
                        aria-label={`${trackPct}% of ${track.title} complete`}
                      >
                        <svg className="ring-chart" viewBox="0 0 40 40" aria-hidden="true">
                          <circle className="ring-track" cx="20" cy="20" r="16" />
                          <circle
                            className="ring-progress"
                            cx="20"
                            cy="20"
                            r="16"
                            pathLength="100"
                            stroke={track.accent}
                            strokeDashoffset={100 - trackPct}
                          />
                        </svg>
                        <span className="ring-label">{trackPct}%</span>
                      </div>
                      <p className="font-mono text-sm text-ink-faint">
                        {trackDone}/{lessons.length}
                      </p>
                    </div>
                  </div>

                  <ol className="mt-3 grid gap-2">
                    {lessons.map((lesson, i) => {
                      const complete = progress.completed.includes(lesson.slug);
                      return (
                        <li key={lesson.slug} data-motion>
                          <Link href={`/lesson/${lesson.slug}`} className="learn-lesson-row">
                            <div className="learn-lesson-row-inner">
                              <div className="flex gap-4">
                                <span className="w-7 font-mono text-sm text-ink-faint">
                                  {String(i + 1).padStart(2, "0")}
                                </span>
                                <div>
                                  <p className="type-title text-[1.05rem] text-ink">
                                    {lesson.title}
                                  </p>
                                  <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-soft">
                                    {lesson.subtitle}
                                  </p>
                                </div>
                              </div>
                              <div className="learn-lesson-meta pl-11 sm:pl-0">
                                {lesson.free ? <StatusChip status="free" /> : null}
                                <span className="ds-chip ds-diff-neutral">{lesson.minutes}m</span>
                                <DifficultyChip level={lesson.difficulty} />
                                {complete ? <StatusChip status="done" /> : null}
                              </div>
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
        </div>
      </div>
    </ScrollReveal>
  );
}
