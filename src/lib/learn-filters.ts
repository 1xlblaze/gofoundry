import { allLessons, lessonsForTrack, tracks } from "@/content";
import type { Difficulty, TrackId } from "@/content/types";

export type LearnFilterParams = {
  topic?: string;
  track?: string;
  q?: string;
  level?: string;
};

export function parseLearnFilters(params: LearnFilterParams) {
  const topic = params.topic?.trim() ?? "";
  const track =
    params.track && tracks.some((t) => t.id === params.track)
      ? (params.track as TrackId)
      : "all";
  const q = params.q?.trim().toLowerCase() ?? "";
  const level =
    params.level === "beginner" ||
    params.level === "intermediate" ||
    params.level === "advanced"
      ? (params.level as Difficulty)
      : "all";

  return { topic, track, q, level };
}

export function filterLesson(
  lesson: {
    title: string;
    subtitle: string;
    difficulty: Difficulty;
    tags: string[];
  },
  filters: ReturnType<typeof parseLearnFilters>,
) {
  if (filters.level !== "all" && lesson.difficulty !== filters.level) return false;

  if (filters.topic) {
    const topicLower = filters.topic.toLowerCase();
    const tagMatch = lesson.tags.some((tag) => tag.toLowerCase() === topicLower);
    const textMatch = lesson.title.toLowerCase().includes(topicLower);
    if (!tagMatch && !textMatch) return false;
  }

  if (filters.q) {
    const hay = [lesson.title, lesson.subtitle, ...lesson.tags].join(" ").toLowerCase();
    if (!hay.includes(filters.q)) return false;
  }

  return true;
}

export function filteredLearnTracks(filters: ReturnType<typeof parseLearnFilters>) {
  const visibleTracks =
    filters.track === "all" ? tracks : tracks.filter((track) => track.id === filters.track);

  return visibleTracks
    .map((track) => ({
      track,
      lessons: lessonsForTrack(track.id).filter((lesson) => filterLesson(lesson, filters)),
    }))
    .filter((entry) => entry.lessons.length > 0);
}

export function countFilteredLessons(filters: ReturnType<typeof parseLearnFilters>) {
  return filteredLearnTracks(filters).reduce((sum, entry) => sum + entry.lessons.length, 0);
}

export const learnLessonTotal = allLessons.length;
