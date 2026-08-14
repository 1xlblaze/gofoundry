"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { searchLessons, getTrack } from "@/content";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const results = useMemo(() => searchLessons(q), [q]);

  return (
    <div className="reading-rail mx-auto px-6 py-14 sm:py-16">
      <p className="type-label">Find lessons</p>
      <h1 className="type-title mt-3 text-[var(--text-h1)] text-ink">Search</h1>
      <p className="mt-4 text-[var(--text-lead)] leading-relaxed text-ink-soft">
        DSA, concepts, internals, LLD, and HLD — one index.
      </p>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="dijkstra, garbage collector, rate limiter…"
        className="mt-10 w-full border-b border-[var(--line-strong)] bg-transparent py-4 text-lg outline-none placeholder:text-ink-faint focus:border-teal"
        autoFocus
      />
      <ul className="mt-6">
        {results.map((lesson) => {
          const track = getTrack(lesson.track);
          return (
            <li key={lesson.slug} className="border-b border-[var(--line)]">
              <Link href={`/lesson/${lesson.slug}`} className="group block py-5">
                <p className="type-label" style={{ color: track.accent }}>
                  {track.short}
                </p>
                <p className="type-title mt-2 text-[1.15rem] text-ink transition-colors group-hover:text-teal-deep">
                  {lesson.title}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                  {lesson.subtitle}
                </p>
              </Link>
            </li>
          );
        })}
        {q.trim() && results.length === 0 && (
          <li className="py-10 text-ink-soft">No lessons matched “{q}”.</li>
        )}
      </ul>
    </div>
  );
}
