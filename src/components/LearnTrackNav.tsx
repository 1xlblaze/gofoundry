"use client";

import Link from "next/link";
import { tracks } from "@/content";
import type { TrackId } from "@/content/types";

export function LearnTrackNav({
  activeTrack,
  trackProgress,
}: {
  activeTrack?: TrackId;
  trackProgress: Record<string, { done: number; total: number }>;
}) {
  return (
    <nav className="learn-track-nav panel" aria-label="Jump to track">
      <p className="type-label">Tracks</p>
      <ul className="learn-track-nav-list">
        {tracks.map((track) => {
          const stats = trackProgress[track.id];
          const pct = stats?.total
            ? Math.round((stats.done / stats.total) * 100)
            : 0;
          return (
            <li key={track.id}>
              <a
                href={`#track-${track.id}`}
                className={`learn-track-nav-link${
                  activeTrack === track.id ? " is-active" : ""
                }`}
              >
                <span className="learn-track-nav-short" style={{ color: track.accent }}>
                  {track.short}
                </span>
                <span className="learn-track-nav-title">{track.title}</span>
                <span className="learn-track-nav-pct">{pct}%</span>
              </a>
            </li>
          );
        })}
      </ul>
      <Link href="/progress" className="ghost-btn learn-track-nav-cta">
        View full progress →
      </Link>
    </nav>
  );
}
