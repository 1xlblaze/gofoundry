"use client";

import { useEffect, useState } from "react";
import { loadProgress, markComplete } from "@/lib/progress";

export function CompleteButton({ slug }: { slug: string }) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDone(loadProgress().completed.includes(slug));
  }, [slug]);

  return (
    <button
      type="button"
      onClick={() => {
        markComplete(slug);
        setDone(true);
      }}
      className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
        done
          ? "bg-mint/40 text-teal-deep"
          : "border border-[var(--line)] bg-foam/80 text-ink hover:border-teal"
      }`}
    >
      {done ? "Completed" : "Mark complete"}
    </button>
  );
}
