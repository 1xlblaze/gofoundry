"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { allLessons, getTrack, tracks } from "@/content";
import type { TrackId } from "@/content/types";
import { ProgressSaveCue } from "@/components/ProgressSaveCue";
import {
  DifficultyChip,
  EmptyState,
  ScrollReveal,
  StatCard,
  StatusChip,
} from "@/components/ui";
import {
  loadProgress,
  resetAllProgress,
  resetLesson,
  type ProgressState,
} from "@/lib/progress";
import { getContinueLesson } from "@/lib/continueLesson";

function formatDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

export default function ProgressPage() {
  const [progress, setProgress] = useState<ProgressState>({
    completed: [],
    quizScores: {},
    completedAt: {},
  });
  const [trackFilter, setTrackFilter] = useState<TrackId | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "done" | "todo">("all");

  useEffect(() => {
    const refresh = () => setProgress(loadProgress());
    refresh();
    window.addEventListener("gofoundry-progress", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("gofoundry-progress", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const rows = useMemo(() => {
    return allLessons
      .filter((l) => (trackFilter === "all" ? true : l.track === trackFilter))
      .filter((l) => {
        const done = progress.completed.includes(l.slug);
        if (statusFilter === "done") return done;
        if (statusFilter === "todo") return !done;
        return true;
      })
      .map((l) => {
        const done = progress.completed.includes(l.slug);
        const score = progress.quizScores[l.slug];
        return {
          ...l,
          done,
          score,
          completedAt: progress.completedAt[l.slug],
          trackMeta: getTrack(l.track),
        };
      });
  }, [progress, trackFilter, statusFilter]);

  const doneCount = progress.completed.length;
  const total = allLessons.length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;
  const quizCount = Object.keys(progress.quizScores).length;
  const streakDays = useMemo(() => {
    const dates = Object.values(progress.completedAt)
      .map((iso) => iso.slice(0, 10))
      .filter(Boolean);
    return new Set(dates).size;
  }, [progress.completedAt]);

  const continueLesson = getContinueLesson(progress);

  function onResetLesson(slug: string, title: string) {
    if (confirm(`Reset “${title}”? Completion and quiz score will be cleared.`)) {
      setProgress(resetLesson(slug));
    }
  }

  return (
    <ScrollReveal>
      <div className="shell" style={{ padding: "2.5rem 0 3.5rem" }}>
        <div className="page-hero reveal" data-motion>
          <h1>Progress</h1>
          <p>
            Track every lesson in one ledger. Reset a single lesson to practice fresh,
            or wipe the board and start the forge again.
          </p>
        </div>

        <ProgressSaveCue className="learn-progress-save-cue" />

        <div className="progress-dashboard" data-motion>
          <StatCard value={doneCount} suffix={` / ${total}`} label="Lessons complete" />
          <StatCard value={pct} suffix="%" label="Completion" />
          <StatCard value={quizCount} label="Quizzes scored" />
        </div>

        {doneCount === 0 ? (
          <EmptyState
            title="Nothing tracked yet"
            description="Open any lesson to start a ledger in this browser. Sign in later if you want the same progress on another device."
            actionHref={continueLesson ? `/lesson/${continueLesson.slug}` : "/learn"}
            actionLabel={continueLesson ? `Start ${continueLesson.title}` : "Browse curriculum →"}
            icon="⚒"
          />
        ) : (
          <div className="progress-streak-banner" data-motion>
            <div>
              <p className="type-label">Active days</p>
              <p style={{ margin: 0, fontWeight: 650 }}>
                {streakDays} day{streakDays === 1 ? "" : "s"} with completed lessons
              </p>
            </div>
            <Link
              href={continueLesson ? `/lesson/${continueLesson.slug}` : "/learn"}
              className="ghost-btn"
            >
              Continue learning →
            </Link>
          </div>
        )}

        <div className="progress-bar" style={{ marginBottom: "1.5rem" }} data-motion>
          <span style={{ width: `${pct}%` }} />
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.85rem",
            justifyContent: "space-between",
            alignItems: "end",
            marginBottom: "1.25rem",
          }}
          data-motion
        >
          <div className="filters" style={{ marginBottom: 0 }}>
            <button
              type="button"
              className={`filter-btn ${trackFilter === "all" ? "active" : ""}`}
              onClick={() => setTrackFilter("all")}
            >
              All tracks
            </button>
            {tracks.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`filter-btn ${trackFilter === t.id ? "active" : ""}`}
                onClick={() => setTrackFilter(t.id)}
              >
                {t.short}
              </button>
            ))}
          </div>
          <div className="filters" style={{ marginBottom: 0 }}>
            {(["all", "done", "todo"] as const).map((s) => (
              <button
                key={s}
                type="button"
                className={`filter-btn ${statusFilter === s ? "active" : ""}`}
                onClick={() => setStatusFilter(s)}
              >
                {s === "all" ? "All" : s === "done" ? "Done" : "Todo"}
              </button>
            ))}
            <button
              type="button"
              className="ghost-btn danger-btn"
              onClick={() => {
                if (
                  confirm(
                    "Reset ALL progress? Every lesson and quiz score will be cleared.",
                  )
                ) {
                  setProgress(resetAllProgress());
                }
              }}
            >
              Reset all
            </button>
          </div>
        </div>

        <div className="table-wrap progress-desktop" data-motion>
          <table className="progress-table">
            <thead>
              <tr>
                <th>Lesson</th>
                <th>Track</th>
                <th>Level</th>
                <th>Status</th>
                <th>Quiz</th>
                <th>Completed</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.slug}>
                  <td>
                    <Link href={`/lesson/${row.slug}`}>{row.title}</Link>
                    <div style={{ color: "var(--muted)", fontSize: "0.78rem", marginTop: 2 }}>
                      {row.subtitle}
                    </div>
                  </td>
                  <td>
                    <StatusChip
                      status="staff"
                      label={row.trackMeta.short}
                      className="ds-track-chip"
                    />
                  </td>
                  <td>
                    <DifficultyChip level={row.difficulty} />
                  </td>
                  <td>
                    <StatusChip status={row.done ? "done" : "todo"} />
                  </td>
                  <td>
                    {row.score === undefined ? (
                      "—"
                    ) : (
                      <StatusChip status="quiz" label={`${Math.round(row.score * 100)}%`} />
                    )}
                  </td>
                  <td>{formatDate(row.completedAt)}</td>
                  <td>
                    <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
                      <Link href={`/lesson/${row.slug}`}>Open</Link>
                      {(row.done || row.score !== undefined) && (
                        <button
                          type="button"
                          className="ghost-btn danger-btn"
                          style={{ padding: "0.25rem 0.65rem", fontSize: "0.75rem" }}
                          onClick={() => onResetLesson(row.slug, row.title)}
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty">
                    No lessons match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="progress-mobile" data-motion>
          {rows.map((row) => (
            <div key={row.slug} className="progress-mobile-card animated-card">
              <div className="row">
                <Link href={`/lesson/${row.slug}`} style={{ fontWeight: 700 }}>
                  {row.title}
                </Link>
                <StatusChip status={row.done ? "done" : "todo"} />
              </div>
              <div className="row" style={{ color: "var(--muted)", fontSize: "0.82rem" }}>
                <span>
                  {row.trackMeta.short} · <DifficultyChip level={row.difficulty} />
                </span>
                <span>
                  {row.score === undefined ? "No quiz" : `${Math.round(row.score * 100)}% quiz`}
                </span>
              </div>
              <div className="row">
                <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
                  {formatDate(row.completedAt)}
                </span>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <Link href={`/lesson/${row.slug}`} className="ghost-btn" style={{ padding: "0.3rem 0.7rem", fontSize: "0.75rem" }}>
                    Open
                  </Link>
                  {(row.done || row.score !== undefined) && (
                    <button
                      type="button"
                      className="ghost-btn danger-btn"
                      style={{ padding: "0.3rem 0.7rem", fontSize: "0.75rem" }}
                      onClick={() => onResetLesson(row.slug, row.title)}
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {rows.length === 0 && <div className="empty">No lessons match these filters.</div>}
        </div>
      </div>
    </ScrollReveal>
  );
}
