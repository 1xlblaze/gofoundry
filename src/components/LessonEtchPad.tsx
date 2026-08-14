"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { presetForTrack } from "@/lib/etch-diagram";

const EtchCanvas = dynamic(
  () => import("@/components/EtchCanvas").then((mod) => mod.EtchCanvas),
  {
    ssr: false,
    loading: () => <div className="etch-canvas-loading">Loading drawing canvas…</div>,
  },
);

type LessonEtchPadProps = {
  lessonSlug: string;
  trackId: string;
  title: string;
};

export function LessonEtchPad({ lessonSlug, trackId, title }: LessonEtchPadProps) {
  const [open, setOpen] = useState(false);
  const preset = presetForTrack(trackId);

  return (
    <section className="panel lesson-etch-pad" aria-labelledby={`etch-${lessonSlug}`}>
      <div className="lesson-etch-pad-head">
        <div>
          <p className="type-label">Etch along</p>
          <h2 id={`etch-${lessonSlug}`}>Sketch {title} before the theory fades</h2>
          <p>
            Use the whiteboard to mirror the architecture — boxes for services, arrows for data
            flow, and notes for invariants. Your sketch autosaves in this browser.
          </p>
        </div>
        <button type="button" className="secondary-btn" onClick={() => setOpen((v) => !v)}>
          {open ? "Hide sketch pad" : "Open sketch pad"}
        </button>
      </div>
      {open && (
        <EtchCanvas
          storageKey={`gofoundry-lesson-etch-${lessonSlug}`}
          preset={preset}
          height={360}
          compact
        />
      )}
    </section>
  );
}
