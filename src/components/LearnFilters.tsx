"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { tracks } from "@/content";

export function LearnFilters({
  filteredCount,
  totalCount,
}: {
  filteredCount: number;
  totalCount: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const track = searchParams.get("track") ?? "all";
  const level = searchParams.get("level") ?? "all";
  const q = searchParams.get("q") ?? "";
  const topic = searchParams.get("topic") ?? "";

  const filtersActive =
    track !== "all" || level !== "all" || q.trim().length > 0 || topic.trim().length > 0;

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const query = params.toString();
    router.push(query ? `/learn?${query}` : "/learn");
  }

  function clearFilters() {
    router.push("/learn");
  }

  return (
    <div className="learn-filters panel" data-motion role="search" aria-label="Filter lessons">
      <label className="learn-filter-search">
        <span className="price-visually-hidden">Search lessons</span>
        <input
          type="search"
          className="search-box"
          placeholder="Search lessons…"
          value={q}
          onChange={(event) => updateParam("q", event.target.value)}
        />
      </label>
      <div className="filters learn-filter-row">
        <button
          type="button"
          className={`filter-btn ${track === "all" ? "active" : ""}`}
          onClick={() => updateParam("track", "all")}
        >
          All tracks
        </button>
        {tracks.map((trackMeta) => (
          <button
            key={trackMeta.id}
            type="button"
            className={`filter-btn ${track === trackMeta.id ? "active" : ""}`}
            onClick={() => updateParam("track", trackMeta.id)}
          >
            {trackMeta.short}
          </button>
        ))}
      </div>
      <div className="filters learn-filter-row">
        {(["all", "beginner", "intermediate", "advanced"] as const).map((option) => (
          <button
            key={option}
            type="button"
            className={`filter-btn ${level === option ? "active" : ""}`}
            onClick={() => updateParam("level", option)}
          >
            {option === "all" ? "All levels" : option}
          </button>
        ))}
      </div>
      {filtersActive ? (
        <p className="learn-filter-summary">
          Showing <strong>{filteredCount}</strong> of {totalCount} lessons
          <button type="button" className="ghost-btn learn-filter-clear" onClick={clearFilters}>
            Clear filters
          </button>
        </p>
      ) : null}
    </div>
  );
}
