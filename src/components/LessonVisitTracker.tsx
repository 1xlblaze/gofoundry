"use client";

import { useEffect } from "react";
import { touchLastLesson } from "@/lib/progress";

export function LessonVisitTracker({ slug }: { slug: string }) {
  useEffect(() => {
    touchLastLesson(slug);
  }, [slug]);

  return null;
}
