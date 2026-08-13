"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { searchLessons, getTrack } from "@/content";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const results = useMemo(() => searchLessons(q), [q]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight">
        Search
      </h1>
      <p className="mt-3 text-ink-soft">
        Find lessons across DSA, concepts, internals, LLD, and HLD.
      </p>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="e.g. dijkstra, garbage collector, rate limiter…"
        className="mt-8 w-full rounded-2xl border border-[var(--line)] bg-foam/80 px-5 py-4 text-base outline-none ring-teal/30 focus:ring-2"
        autoFocus
      />
      <ul className="mt-8 divide-y divide-[var(--line)]">
        {results.map((lesson) => {
          const track = getTrack(lesson.track);
          return (
            <li key={lesson.slug}>
              <Link
                href={`/lesson/${lesson.slug}`}
                className="block py-4 transition hover:bg-foam/50"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  {track.short}
                </p>
                <p className="mt-1 font-semibold">{lesson.title}</p>
                <p className="text-sm text-ink-soft">{lesson.subtitle}</p>
              </Link>
            </li>
          );
        })}
        {q.trim() && results.length === 0 && (
          <li className="py-8 text-ink-soft">No lessons matched “{q}”.</li>
        )}
      </ul>
    </div>
  );
}
