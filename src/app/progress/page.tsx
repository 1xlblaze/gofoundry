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

  return (
    <div className="mx-auto max-w-6xl px-6 py-14 sm:py-16">
      <p className="type-label">Your forge ledger</p>
      <h1 className="type-title mt-3 text-[var(--text-h1)] text-ink">Progress</h1>
      <p className="mt-4 max-w-2xl text-[var(--text-lead)] leading-relaxed text-ink-soft">
        Track every lesson in one table. Reset a single lesson to practice fresh, or
        wipe the board and start the forge again.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="border border-[var(--line)] bg-foam/80 px-5 py-5">
          <p className="type-label">Completed</p>
          <p className="brand-mark mt-2 text-3xl text-ink">
            {doneCount}
            <span className="text-lg text-ink-faint"> / {total}</span>
          </p>
        </div>
        <div className="border border-[var(--line)] bg-foam/80 px-5 py-5">
          <p className="type-label">Completion</p>
          <p className="brand-mark mt-2 text-3xl text-teal-deep">{pct}%</p>
        </div>
        <div className="border border-[var(--line)] bg-foam/80 px-5 py-5">
          <p className="type-label">Quizzes scored</p>
          <p className="brand-mark mt-2 text-3xl text-ink">
            {Object.keys(progress.quizScores).length}
          </p>
        </div>
      </div>

      <div className="mt-6 h-1.5 overflow-hidden bg-paper-2">
        <div className="h-full bg-teal transition-all" style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap gap-3">
          <label className="flex flex-col gap-1.5 text-xs font-semibold tracking-wide text-ink-faint uppercase">
            Track
            <select
              value={trackFilter}
              onChange={(e) => setTrackFilter(e.target.value as TrackId | "all")}
              className="min-w-[10rem] border border-[var(--line-strong)] bg-foam px-3 py-2 text-sm font-medium text-ink normal-case tracking-normal"
            >
              <option value="all">All tracks</option>
              {tracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.short}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold tracking-wide text-ink-faint uppercase">
            Status
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "all" | "done" | "todo")
              }
              className="min-w-[10rem] border border-[var(--line-strong)] bg-foam px-3 py-2 text-sm font-medium text-ink normal-case tracking-normal"
            >
              <option value="all">All</option>
              <option value="done">Completed</option>
              <option value="todo">Not started</option>
            </select>
          </label>
        </div>
        <button
          type="button"
          className="btn-ghost !border-copper/40 !text-copper"
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
          Reset all progress
        </button>
      </div>

      <div className="mt-8 overflow-x-auto border border-[var(--line)]">
        <table className="progress-table w-full min-w-[720px] border-collapse text-left text-sm">
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
                  <Link
                    href={`/lesson/${row.slug}`}
                    className="font-semibold text-ink hover:text-teal-deep"
                  >
                    {row.title}
                  </Link>
                  <p className="mt-0.5 text-xs text-ink-faint line-clamp-1">
                    {row.subtitle}
                  </p>
                </td>
                <td>
                  <span
                    className="text-xs font-semibold tracking-wide uppercase"
                    style={{ color: row.trackMeta.accent }}
                  >
                    {row.trackMeta.short}
                  </span>
                </td>
                <td className="capitalize text-ink-soft">{row.difficulty}</td>
                <td>
                  {row.done ? (
                    <span className="bg-mint/35 px-2 py-1 text-xs font-semibold text-teal-deep">
                      Done
                    </span>
                  ) : (
                    <span className="text-xs text-ink-faint">Todo</span>
                  )}
                </td>
                <td className="font-mono text-xs text-ink-soft">
                  {row.score === undefined
                    ? "—"
                    : `${Math.round(row.score * 100)}%`}
                </td>
                <td className="text-xs text-ink-faint">{formatDate(row.completedAt)}</td>
                <td>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/lesson/${row.slug}`}
                      className="text-xs font-semibold text-teal-deep underline underline-offset-2"
                    >
                      Open
                    </Link>
                    {(row.done || row.score !== undefined) && (
                      <button
                        type="button"
                        className="text-xs font-semibold text-copper underline underline-offset-2"
                        onClick={() => {
                          if (
                            confirm(
                              `Reset “${row.title}”? Completion and quiz score will be cleared.`,
                            )
                          ) {
                            setProgress(resetLesson(row.slug));
                          }
                        }}
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
                <td colSpan={7} className="py-10 text-center text-ink-soft">
                  No lessons match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
