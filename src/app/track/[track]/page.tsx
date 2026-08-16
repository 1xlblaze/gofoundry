import { notFound } from "next/navigation";
import { getTrack, lessonsForTrack, tracks } from "@/content";
import { AnimatedCard, ScrollReveal } from "@/components/ui";
import { TrackLessonGrid } from "@/components/TrackLessonGrid";
import type { TrackId } from "@/content/types";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/site-metadata";

type Props = { params: Promise<{ track: string }> };

export function generateStaticParams() {
  return tracks.map((t) => ({ track: t.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { track: id } = await params;
  const track = tracks.find((t) => t.id === id);
  if (!track) return {};
  return buildPageMetadata({
    title: track.title,
    description: track.description,
    path: `/track/${id}`,
  });
}

export default async function TrackPage({ params }: Props) {
  const { track: id } = await params;
  if (!tracks.some((t) => t.id === id)) notFound();
  const track = getTrack(id as TrackId);
  const lessons = lessonsForTrack(track.id);

  return (
    <ScrollReveal>
      <div className="shell track-page" style={{ padding: "2.5rem 0 3.5rem" }}>
        <div className="page-hero reveal">
          <p className="kicker" style={{ color: track.accent }}>
            {track.short}
          </p>
          <h1>{track.title}</h1>
          <p>{track.description}</p>
        </div>

        <TrackLessonGrid track={track} lessons={lessons} />
      </div>
    </ScrollReveal>
  );
}
