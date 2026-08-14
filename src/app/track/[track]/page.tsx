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
    <div className="shell" style={{ padding: "2.5rem 0 3.5rem" }}>
      <div className="page-hero reveal">
        <p className="kicker" style={{ color: track.accent }}>
          {track.short}
        </p>
        <h1>{track.title}</h1>
        <p>{track.description}</p>
      </div>

      <div className="grid-lessons stagger">
        {lessons.map((lesson, i) => (
          <Link key={lesson.slug} href={`/lesson/${lesson.slug}`} className="lesson-card">
            <div className="meta-row" style={{ marginTop: 0, marginBottom: "0.45rem" }}>
              <span className="chip" style={{ color: track.accent, fontFamily: "var(--font-mono)" }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="chip">{lesson.minutes} min</span>
              <span className="chip chip-brand" style={{ textTransform: "capitalize" }}>
                {lesson.difficulty}
              </span>
            </div>
            <h3>{lesson.title}</h3>
            <p>{lesson.subtitle}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
