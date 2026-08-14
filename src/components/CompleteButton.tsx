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
      className={`px-4 py-2 text-[0.8rem] font-semibold tracking-tight transition ${
        done
          ? "bg-mint/35 text-teal-deep"
          : "border border-[var(--line-strong)] bg-foam/70 text-ink hover:border-teal"
      }`}
    >
      {done ? "Completed" : "Mark complete"}
    </button>
  );
}
