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
    <div className="mx-auto max-w-6xl px-6 py-12">
      <p
        className="text-xs font-semibold uppercase tracking-[0.18em]"
        style={{ color: track.accent }}
      >
        {track.short}
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight">
        {track.title}
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-ink-soft">{track.description}</p>

      <div className="mt-12 grid gap-4">
        {lessons.map((lesson, i) => (
          <Link
            key={lesson.slug}
            href={`/lesson/${lesson.slug}`}
            className="group flex flex-col gap-2 border-l-4 bg-foam/60 px-5 py-5 transition hover:bg-foam sm:flex-row sm:items-center sm:justify-between"
            style={{ borderColor: track.accent }}
          >
            <div className="flex gap-4">
              <span className="font-mono text-sm text-ink-soft">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h2 className="font-semibold group-hover:text-teal-deep">{lesson.title}</h2>
                <p className="mt-1 text-sm text-ink-soft">{lesson.subtitle}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {lesson.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs uppercase tracking-wide text-ink-soft/80"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="pl-10 text-sm text-ink-soft sm:pl-0 sm:text-right">
              <p>{lesson.minutes} min</p>
              <p className="capitalize">{lesson.difficulty}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
