"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getLesson } from "@/content";
import { listPlatformProblems } from "@/content/platform-problems/index";
import {
  patternTopics,
  totalProblemCount,
  type ProblemDifficulty,
} from "@/content/problems";
import {
  loadProblemProgress,
  resetAllProblems,
  toggleDone,
  toggleStar,
  type ProblemProgressState,
} from "@/lib/problemProgress";

type DifficultyFilter = "All" | ProblemDifficulty;
type StatusFilter = "All" | "Done" | "Todo" | "Starred";

const emptyProgress: ProblemProgressState = {
  done: [],
  starred: [],
  notes: {},
};

const knownProblemIds = new Set(
  patternTopics.flatMap((topic) => topic.problems.map((problem) => problem.id)),
);

const platformProblems = listPlatformProblems();

export default function ProblemsPage() {
  const [progress, setProgress] = useState<ProblemProgressState>(emptyProgress);
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("All");
  const [status, setStatus] = useState<StatusFilter>("All");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const refresh = () => setProgress(loadProblemProgress());
    refresh();
    window.addEventListener("gofoundry-problem-progress", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("gofoundry-problem-progress", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const doneIds = useMemo(() => new Set(progress.done), [progress.done]);
  const starredIds = useMemo(() => new Set(progress.starred), [progress.starred]);

  const doneCount = progress.done.filter((id) => knownProblemIds.has(id)).length;
  const starredCount = progress.starred.filter((id) => knownProblemIds.has(id)).length;
  const completion = totalProblemCount
    ? Math.round((doneCount / totalProblemCount) * 100)
    : 0;

  const visibleTopics = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return patternTopics
      .map((topic) => {
        const topicMatches = topic.name.toLowerCase().includes(normalizedQuery);
        const problems = topic.problems.filter((problem) => {
          const isDone = doneIds.has(problem.id);
          const isStarred = starredIds.has(problem.id);
          const matchesDifficulty =
            difficulty === "All" || problem.difficulty === difficulty;
          const matchesStatus =
            status === "All" ||
            (status === "Done" && isDone) ||
            (status === "Todo" && !isDone) ||
            (status === "Starred" && isStarred);
          const matchesQuery =
            !normalizedQuery ||
            topicMatches ||
            problem.title.toLowerCase().includes(normalizedQuery);

          return matchesDifficulty && matchesStatus && matchesQuery;
        });

        return { ...topic, problems };
      })
      .filter((topic) => topic.problems.length > 0);
  }, [difficulty, doneIds, query, starredIds, status]);

  return (
    <div className="shell sheet-page">
      <header className="page-hero sheet-hero">
        <span className="kicker">Pattern-first interview practice</span>
        <h1>Practice Sheet</h1>
        <p>
          A curated, pattern-first path of {totalProblemCount} classic problems that
          complements the GoFoundry lesson tracks. The full sheet is free within
          GoFoundry; solve on LeetCode and track your progress here.
        </p>
      </header>

      <Link className="heat-canvas-practice-cta" href="/heat">
        Plan your next solution in the HEAT canvas →
      </Link>

      <section className="panel platform-problems-banner">
        <p className="kicker">Staff-grade in-app problems</p>
        <h2>20 DSA + 5 LLD modules with runtime invariants</h2>
        <p>
          Solve inside GoFoundry with dual algorithmic + zero-allocation evaluation.
          All staff problems and the Lab are free during the public beta.
        </p>
        <div className="platform-problem-cards">
          {platformProblems.map((problem) => (
            <Link
              key={problem.id}
              href={`/problems/${problem.id}`}
              className="platform-problem-card"
            >
              <span className="teaser-chip">{problem.trackId.toUpperCase()}</span>
              <span className="teaser-chip teaser-chip-free">Free</span>
              <h3>{problem.title}</h3>
              <p>
                {problem.algorithmicSpecs.timeComplexity} · max{" "}
                {problem.runtimeInvariants.maxHeapAllocsPerRun ?? 0} allocs/run
              </p>
            </Link>
          ))}
        </div>
      </section>

      <div className="stat-row sheet-stats">
        <div className="stat">
          <strong>
            {doneCount}
            <span className="sheet-stat-total"> / {totalProblemCount}</span>
          </strong>
          <span>Solved / Total</span>
        </div>
        <div className="stat">
          <strong>{completion}%</strong>
          <span>Completion</span>
        </div>
        <div className="stat">
          <strong>{starredCount}</strong>
          <span>Starred</span>
        </div>
      </div>

      <div
        className="progress-bar sheet-overall-progress"
        role="progressbar"
        aria-label="Overall practice sheet completion"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={completion}
      >
        <span style={{ width: `${completion}%` }} />
      </div>

      <section className="panel sheet-filters" aria-label="Problem filters">
        <div className="sheet-search-row">
          <input
            type="search"
            className="search-box sheet-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search a problem or topic…"
            aria-label="Search problems by title or topic"
          />
          <button
            type="button"
            className="ghost-btn danger-btn sheet-reset"
            onClick={() => {
              if (confirm("Reset ALL practice-sheet progress and stars?")) {
                setProgress(resetAllProblems());
              }
            }}
          >
            Reset all
          </button>
        </div>

        <div className="sheet-filter-groups">
          <div className="sheet-filter-group">
            <span className="sheet-filter-label">Difficulty</span>
            <div className="filters sheet-filter-buttons">
              {(["All", "Easy", "Medium", "Hard"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`filter-btn ${difficulty === option ? "active" : ""}`}
                  onClick={() => setDifficulty(option)}
                  aria-pressed={difficulty === option}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="sheet-filter-group">
            <span className="sheet-filter-label">Status</span>
            <div className="filters sheet-filter-buttons">
              {(["All", "Done", "Todo", "Starred"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`filter-btn ${status === option ? "active" : ""}`}
                  onClick={() => setStatus(option)}
                  aria-pressed={status === option}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="sheet-layout">
        <aside className="panel sheet-toc" aria-label="Practice sheet topics">
          <h2>Topics</h2>
          <nav className="sheet-toc-list">
            {patternTopics.map((topic) => {
              const solved = topic.problems.filter((problem) =>
                doneIds.has(problem.id),
              ).length;

              return (
                <a key={topic.id} href={`#${topic.id}`} className="sheet-toc-link">
                  <span>{topic.name}</span>
                  <small>
                    {solved}/{topic.problems.length}
                  </small>
                </a>
              );
            })}
          </nav>
        </aside>

        <main className="sheet-topics">
          {visibleTopics.map((topic) => {
            const originalTopic = patternTopics.find(
              (candidate) => candidate.id === topic.id,
            )!;
            const solved = originalTopic.problems.filter((problem) =>
              doneIds.has(problem.id),
            ).length;

            return (
              <section
                key={topic.id}
                id={topic.id}
                className="panel sheet-topic"
              >
                <div className="sheet-topic-head">
                  <div>
                    <h2>{topic.name}</h2>
                    <p>{topic.strategy}</p>
                  </div>
                  <span className="chip sheet-topic-progress">
                    {solved} / {originalTopic.problems.length}
                  </span>
                </div>

                <div className="sheet-lesson-links">
                  {topic.lessonSlugs.map((slug) => {
                    const lesson = getLesson(slug);
                    if (!lesson) return null;

                    return (
                      <Link
                        key={slug}
                        href={`/lesson/${slug}`}
                        className="chip chip-brand sheet-lesson-link"
                      >
                        {lesson.title} →
                      </Link>
                    );
                  })}
                </div>

                <div className="table-wrap sheet-table-wrap">
                  <table className="progress-table sheet-table">
                    <thead>
                      <tr>
                        <th className="sheet-check-column">
                          <span className="sheet-visually-hidden">Done</span>
                        </th>
                        <th>Problem</th>
                        <th>Difficulty</th>
                        <th className="sheet-star-column">Save</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topic.problems.map((problem) => {
                        const isDone = doneIds.has(problem.id);
                        const isStarred = starredIds.has(problem.id);

                        return (
                          <tr
                            key={problem.id}
                            className={`sheet-problem-row ${
                              isDone ? "sheet-problem-done" : ""
                            }`}
                          >
                            <td className="sheet-check-column">
                              <input
                                type="checkbox"
                                className="sheet-checkbox"
                                checked={isDone}
                                onChange={() =>
                                  setProgress(toggleDone(problem.id))
                                }
                                aria-label={`Mark ${problem.title} ${
                                  isDone ? "not done" : "done"
                                }`}
                              />
                            </td>
                            <td>
                              {problem.leetcodeUrl ? (
                                <a
                                  href={problem.leetcodeUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`sheet-problem-link ${
                                    isDone ? "sheet-problem-title-done" : ""
                                  }`}
                                >
                                  {problem.title}
                                  <svg
                                    className="sheet-external-icon"
                                    viewBox="0 0 16 16"
                                    aria-hidden="true"
                                  >
                                    <path
                                      d="M6 3h7v7M13 3 5 11M11 8v5H3V5h5"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="1.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </a>
                              ) : (
                                <span
                                  className={
                                    isDone ? "sheet-problem-title-done" : undefined
                                  }
                                >
                                  {problem.title}
                                </span>
                              )}
                            </td>
                            <td>
                              <span
                                className={`chip sheet-difficulty sheet-diff-${problem.difficulty.toLowerCase()}`}
                              >
                                {problem.difficulty}
                              </span>
                            </td>
                            <td className="sheet-star-column">
                              <button
                                type="button"
                                className={`sheet-star ${
                                  isStarred ? "sheet-star-active" : ""
                                }`}
                                onClick={() =>
                                  setProgress(toggleStar(problem.id))
                                }
                                aria-label={`${
                                  isStarred ? "Unstar" : "Star"
                                } ${problem.title}`}
                                aria-pressed={isStarred}
                              >
                                <span aria-hidden="true">
                                  {isStarred ? "★" : "☆"}
                                </span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}

          {visibleTopics.length === 0 && (
            <div className="panel empty sheet-empty">
              No problems match these filters. Try clearing the search or choosing
              a different difficulty.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
