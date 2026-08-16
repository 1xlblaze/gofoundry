import Link from "next/link";
import { lessonsForTrack } from "@/content";
import type { TrackMeta } from "@/content/types";
import { DifficultyChip, StatusChip } from "@/components/ui";

export function LearnCurriculum({
  entries,
}: {
  entries: Array<{ track: TrackMeta; lessons: ReturnType<typeof lessonsForTrack> }>;
}) {
  return (
    <div className="space-y-16">
      {entries.map(({ track, lessons }) => (
          <section key={track.id} id={`track-${track.id}`} data-motion>
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--line)] pb-5">
              <div>
                <p className="type-label" style={{ color: track.accent }}>{track.short}</p>
                <h2 className="type-title mt-2 text-[var(--text-h2)]">
                  <Link
                    href={`/track/${track.id}`}
                    className="text-ink transition-colors hover:text-teal-deep"
                  >
                    {track.title}
                  </Link>
                </h2>
              </div>
              <p className="font-mono text-sm text-ink-faint">
                {lessons.length} lessons in view
              </p>
            </div>

            <ol className="mt-3 grid gap-2">
              {lessons.map((lesson, i) => (
                <li key={lesson.slug} data-motion>
                  <Link href={`/lesson/${lesson.slug}`} className="learn-lesson-row">
                    <div className="learn-lesson-row-inner">
                      <div className="flex gap-4">
                        <span className="w-7 font-mono text-sm text-ink-faint">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <p className="type-title text-[1.05rem] text-ink">{lesson.title}</p>
                          <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-soft">
                            {lesson.subtitle}
                          </p>
                        </div>
                      </div>
                      <div className="learn-lesson-meta pl-11 sm:pl-0">
                        {lesson.free ? <StatusChip status="free" /> : null}
                        <span className="ds-chip ds-diff-neutral">{lesson.minutes}m</span>
                        <DifficultyChip level={lesson.difficulty} />
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
      ))}

      {entries.length === 0 ? (
        <div className="panel learn-filter-empty" data-motion>
          <p className="type-label">No matches</p>
          <p>Try clearing filters or searching with a shorter phrase.</p>
          <Link href="/learn" className="secondary-btn">Clear all filters</Link>
        </div>
      ) : null}
    </div>
  );
}
