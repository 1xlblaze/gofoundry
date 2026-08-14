import Link from "next/link";
import { notFound } from "next/navigation";
import { getTrack, lessonsForTrack, tracks } from "@/content";
import type { TrackId } from "@/content/types";
import type { Metadata } from "next";

type Props = { params: Promise<{ track: string }> };

export function generateStaticParams() {
  return tracks.map((t) => ({ track: t.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { track: id } = await params;
  const track = tracks.find((t) => t.id === id);
  if (!track) return {};
  return { title: track.title, description: track.description };
}

export default async function TrackPage({ params }: Props) {
  const { track: id } = await params;
  if (!tracks.some((t) => t.id === id)) notFound();
  const track = getTrack(id as TrackId);
  const lessons = lessonsForTrack(track.id);

  return (
    <div className="mx-auto max-w-6xl px-6 py-14 sm:py-16">
      <p className="type-label" style={{ color: track.accent }}>
        {track.short}
      </p>
      <h1 className="type-title mt-3 max-w-3xl text-[var(--text-h1)] text-ink">
        {track.title}
      </h1>
      <p className="mt-4 max-w-2xl text-[var(--text-lead)] leading-relaxed text-ink-soft">
        {track.description}
      </p>

      <div className="mt-14 border-t border-[var(--line)]">
        {lessons.map((lesson, i) => (
          <Link
            key={lesson.slug}
            href={`/lesson/${lesson.slug}`}
            className="group flex flex-col gap-3 border-b border-[var(--line)] py-6 transition sm:flex-row sm:items-baseline sm:justify-between sm:gap-10"
          >
            <div className="flex gap-5">
              <span
                className="font-mono text-sm"
                style={{ color: track.accent }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h2 className="type-title text-[1.25rem] text-ink transition-colors group-hover:text-teal-deep">
                  {lesson.title}
                </h2>
                <p className="mt-2 max-w-2xl text-[0.95rem] leading-relaxed text-ink-soft">
                  {lesson.subtitle}
                </p>
                <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
                  {lesson.tags.map((tag) => (
                    <span key={tag} className="font-mono text-[0.7rem] text-ink-faint">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="pl-10 font-mono text-xs tracking-wide text-ink-faint uppercase sm:pl-0 sm:text-right">
              <p>{lesson.minutes} min</p>
              <p className="mt-1 capitalize">{lesson.difficulty}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
