import type { Lesson, TrackId, TrackMeta } from "./types";
import { methodLessons } from "./method";
import { dsaLessons } from "./dsa";
import { conceptsLessons } from "./concepts";
import { internalsLessons } from "./internals";
import { lldLessons } from "./lld";
import { hldLessons } from "./hld";

export const tracks: TrackMeta[] = [
  {
    id: "method",
    title: "Foundry HEAT Method",
    short: "HEAT",
    description:
      "Our USP: Hear → Etch → Anchor → Temper — how to think, diagram, and answer in Go.",
    accent: "var(--accent-method)",
  },
  {
    id: "dsa",
    title: "Data Structures & Algorithms",
    short: "DSA",
    description:
      "Arrays to DP — interview-ready patterns with diagrams and idiomatic Go.",
    accent: "var(--accent-dsa)",
  },
  {
    id: "concepts",
    title: "Go Concepts",
    short: "Concepts",
    description:
      "Interfaces, concurrency, context, errors, generics, and performance habits.",
    accent: "var(--accent-concepts)",
  },
  {
    id: "internals",
    title: "Runtime Internals",
    short: "Internals",
    description:
      "Scheduler, GC, maps, channels, escape analysis, and sync primitives.",
    accent: "var(--accent-internals)",
  },
  {
    id: "lld",
    title: "Low-Level Design",
    short: "LLD",
    description:
      "SOLID, patterns, and component designs: cache, limiter, shortener, and more.",
    accent: "var(--accent-lld)",
  },
  {
    id: "hld",
    title: "High-Level Design",
    short: "HLD",
    description:
      "Distributed systems foundations and full case studies you can defend in interviews.",
    accent: "var(--accent-hld)",
  },
];

export const allLessons: Lesson[] = [
  ...methodLessons,
  ...dsaLessons,
  ...conceptsLessons,
  ...internalsLessons,
  ...lldLessons,
  ...hldLessons,
];

const bySlug = new Map(allLessons.map((l) => [l.slug, l]));

export function getLesson(slug: string): Lesson | undefined {
  return bySlug.get(slug);
}

export function getTrack(id: TrackId): TrackMeta {
  return tracks.find((t) => t.id === id)!;
}

export function lessonsForTrack(id: TrackId): Lesson[] {
  return allLessons.filter((l) => l.track === id);
}

export function searchLessons(query: string): Lesson[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return allLessons.filter((l) => {
    const hay = [l.title, l.subtitle, l.slug, ...l.tags, l.track]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export function adjacentLessons(slug: string): {
  prev?: Lesson;
  next?: Lesson;
} {
  const lesson = getLesson(slug);
  if (!lesson) return {};
  const list = lessonsForTrack(lesson.track);
  const i = list.findIndex((l) => l.slug === slug);
  return {
    prev: i > 0 ? list[i - 1] : undefined,
    next: i >= 0 && i < list.length - 1 ? list[i + 1] : undefined,
  };
}
