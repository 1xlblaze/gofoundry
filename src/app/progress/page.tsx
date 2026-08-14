"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { allLessons, getTrack, tracks } from "@/content";
import type { TrackId } from "@/content/types";
import {
  loadProgress,
  resetAllProgress,
  resetLesson,
  type ProgressState,
} from "@/lib/progress";

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

  function onResetLesson(slug: string, title: string) {
    if (confirm(`Reset “${title}”? Completion and quiz score will be cleared.`)) {
      setProgress(resetLesson(slug));
    }
  }

  return (
    <div className="shell" style={{ padding: "2.5rem 0 3.5rem" }}>
      <div className="page-hero reveal">
        <h1>Progress</h1>
        <p>
          Track every lesson in one ledger. Reset a single lesson to practice fresh,
          or wipe the board and start the forge again.
        </p>
      </div>

      <div className="stat-row reveal-delay-1" style={{ marginBottom: "1rem" }}>
        <div className="stat">
          <strong>
            {doneCount}
            <span style={{ fontSize: "1rem", color: "var(--muted)" }}> / {total}</span>
          </strong>
          <span>Completed</span>
        </div>
        <div className="stat">
          <strong>{pct}%</strong>
          <span>Completion</span>
        </div>
        <div className="stat">
          <strong>{Object.keys(progress.quizScores).length}</strong>
          <span>Quizzes scored</span>
        </div>
      </div>

      <div className="progress-bar" style={{ marginBottom: "1.5rem" }}>
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

      <div className="table-wrap progress-desktop">
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
                  <span className="chip chip-brand" style={{ color: row.trackMeta.accent }}>
                    {row.trackMeta.short}
                  </span>
                </td>
                <td style={{ textTransform: "capitalize" }}>{row.difficulty}</td>
                <td>
                  <span className={`status-pill ${row.done ? "done" : "open"}`}>
                    {row.done ? "Done" : "Todo"}
                  </span>
                </td>
                <td>
                  {row.score === undefined ? (
                    "—"
                  ) : (
                    <span className="status-pill quiz">{Math.round(row.score * 100)}%</span>
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

      <div className="progress-mobile">
        {rows.map((row) => (
          <div key={row.slug} className="progress-mobile-card">
            <div className="row">
              <Link href={`/lesson/${row.slug}`} style={{ fontWeight: 700 }}>
                {row.title}
              </Link>
              <span className={`status-pill ${row.done ? "done" : "open"}`}>
                {row.done ? "Done" : "Todo"}
              </span>
            </div>
            <div className="row" style={{ color: "var(--muted)", fontSize: "0.82rem" }}>
              <span>{row.trackMeta.short} · {row.difficulty}</span>
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
  );
}
