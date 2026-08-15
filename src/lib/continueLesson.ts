import { adjacentLessons, allLessons } from "@/content";
import type { Lesson } from "@/content/types";
import type { ProgressState } from "@/lib/progress";

export function getContinueLesson(progress: ProgressState): Lesson | undefined {
  const last = progress.lastLessonSlug
    ? allLessons.find((lesson) => lesson.slug === progress.lastLessonSlug)
    : undefined;

  if (last && !progress.completed.includes(last.slug)) {
    return last;
  }

  if (last) {
    const { next } = adjacentLessons(last.slug);
    if (next && !progress.completed.includes(next.slug)) {
      return next;
    }
  }

  return allLessons.find((lesson) => !progress.completed.includes(lesson.slug));
}
