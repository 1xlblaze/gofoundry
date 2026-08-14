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
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
      <button
        type="button"
        onClick={() => {
          markComplete(slug);
          setDone(true);
        }}
        className={done ? "primary-btn" : "secondary-btn"}
        style={{ padding: "0.45rem 0.9rem", fontSize: "0.8rem" }}
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
          className="ghost-btn danger-btn"
          style={{ padding: "0.4rem 0.75rem", fontSize: "0.75rem" }}
        >
          Reset
        </button>
      )}
    </div>
  );
}
