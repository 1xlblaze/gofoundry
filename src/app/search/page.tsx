"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { searchLessons, getTrack } from "@/content";

const SUGGESTIONS = ["scheduler", "rate limiter", "escape analysis", "context", "channel"];

export default function SearchPage() {
  const [q, setQ] = useState("");
  const results = useMemo(() => searchLessons(q), [q]);

  return (
    <div className="shell" style={{ maxWidth: 760, padding: "2.5rem 0 3.5rem" }}>
      <div className="page-hero reveal">
        <h1>Search</h1>
        <p>DSA, concepts, internals, LLD, and HLD — one index.</p>
      </div>
      <label className="search-field-label" htmlFor="lesson-search">
        Search lessons
      </label>
      <input
        id="lesson-search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="dijkstra, garbage collector, rate limiter…"
        className="search-box reveal-delay-1"
      />
      <div className="search-suggest-row" aria-label="Suggested searches">
        {SUGGESTIONS.map((term) => (
          <button
            key={term}
            type="button"
            className="search-suggest"
            aria-pressed={q === term}
            onClick={() => setQ(term)}
          >
            {term}
          </button>
        ))}
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: "1.25rem 0 0" }} className="stagger">
        {results.map((lesson) => {
          const track = getTrack(lesson.track);
          return (
            <li key={lesson.slug}>
              <Link href={`/lesson/${lesson.slug}`} className="lesson-card" style={{ marginBottom: "0.75rem" }}>
                <div className="meta-row" style={{ marginTop: 0, marginBottom: "0.35rem" }}>
                  <span className="chip chip-brand" style={{ color: track.accent }}>
                    {track.short}
                  </span>
                </div>
                <h3>{lesson.title}</h3>
                <p>{lesson.subtitle}</p>
              </Link>
            </li>
          );
        })}
        {q.trim() && results.length === 0 && (
          <li className="empty">No lessons matched “{q}”.</li>
        )}
      </ul>
    </div>
  );
}
