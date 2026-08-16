"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { lessonsForTrack, tracks } from "@/content";
import type { TrackId } from "@/content/types";
import { LearnTrackNav } from "@/components/LearnTrackNav";
import { StatCard } from "@/components/ui";
import { loadProgress } from "@/lib/progress";
import { getContinueLesson } from "@/lib/continueLesson";

export function LearnProgressPanel({ total }: { total: number }) {
  const [progress, setProgress] = useState(loadProgress());
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
  const pct = total ? Math.round((done / total) * 100) : 0;
  const continueLesson = getContinueLesson(progress);

  const trackProgress: Record<string, { done: number; total: number }> = {};
  for (const track of tracks) {
    const trackLessons = lessonsForTrack(track.id);
    trackProgress[track.id] = {
      done: trackLessons.filter((lesson) => progress.completed.includes(lesson.slug)).length,
      total: trackLessons.length,
    };
  }

  return (
    <>
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

      <aside className="learn-sidebar" data-motion>
        <div className="progress-dashboard learn-sidebar-stats">
          <StatCard value={done} suffix={` / ${total}`} label="Lessons complete" />
          <StatCard value={pct} suffix="%" label="Overall progress" />
          <StatCard value={Object.keys(progress.quizScores).length} label="Quizzes scored" />
        </div>
        <div className="progress-bar learn-sidebar-bar">
          <span style={{ width: `${pct}%` }} />
        </div>
        <LearnTrackNav activeTrack={activeTrack} trackProgress={trackProgress} />
      </aside>
    </>
  );
}
