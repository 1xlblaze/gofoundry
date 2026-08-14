"use client";

import { useEffect, useState } from "react";
import { loadProgress, markComplete, resetLesson } from "@/lib/progress";

export function CompleteButton({ slug }: { slug: string }) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDone(loadProgress().completed.includes(slug));
    const refresh = () => setDone(loadProgress().completed.includes(slug));
    window.addEventListener("gofoundry-progress", refresh);
    return () => window.removeEventListener("gofoundry-progress", refresh);
  }, [slug]);

  return (
    <div className="flex flex-wrap items-center gap-2">
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
      {done && (
        <button
          type="button"
          onClick={() => {
            if (confirm("Reset this lesson? You can start it fresh.")) {
              resetLesson(slug);
              setDone(false);
            }
          }}
          className="px-3 py-2 text-[0.75rem] font-semibold text-copper underline underline-offset-2"
        >
          Reset lesson
        </button>
      )}
    </div>
  );
}
