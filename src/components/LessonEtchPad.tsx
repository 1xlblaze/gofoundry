"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { etchSavedAt, presetForTrack } from "@/lib/etch-diagram";

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

function formatSavedAt(timestamp: number) {
  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (seconds < 8) return "Draft saved just now";
  if (seconds < 60) return `Draft saved ${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  return `Draft saved ${minutes} min ago`;
}

export function LessonEtchPad({ lessonSlug, trackId, title }: LessonEtchPadProps) {
  const [open, setOpen] = useState(false);
  const [savedLabel, setSavedLabel] = useState<string | null>(null);
  const preset = presetForTrack(trackId);
  const storageKey = `gofoundry-lesson-etch-${lessonSlug}`;

  useEffect(() => {
    const refresh = () => {
      const at = etchSavedAt(storageKey);
      setSavedLabel(at ? formatSavedAt(at) : null);
    };

    refresh();
    const onEtchSave = (event: Event) => {
      const detail = (event as CustomEvent<{ key?: string }>).detail;
      if (!detail?.key || detail.key === storageKey) refresh();
    };

    window.addEventListener("gofoundry-etch-save", onEtchSave);
    const interval = window.setInterval(refresh, 15000);
    return () => {
      window.removeEventListener("gofoundry-etch-save", onEtchSave);
      window.clearInterval(interval);
    };
  }, [storageKey]);

  return (
    <section className="panel lesson-etch-pad lesson-zone lesson-zone-sketch" aria-labelledby={`etch-${lessonSlug}`}>
      <div className="lesson-etch-pad-head">
        <div>
          <p className="type-label">Etch along</p>
          <h2 id={`etch-${lessonSlug}`}>Sketch {title} before the theory fades</h2>
          <p>
            Use the whiteboard to mirror the architecture — boxes for services, arrows for data
            flow, and notes for invariants. Your sketch autosaves in this browser.
          </p>
          {savedLabel ? <p className="lesson-etch-saved" aria-live="polite">{savedLabel}</p> : null}
        </div>
        <button type="button" className="secondary-btn" onClick={() => setOpen((v) => !v)}>
          {open ? "Hide sketch pad" : "Open sketch pad"}
        </button>
      </div>
      {open && (
        <EtchCanvas storageKey={storageKey} preset={preset} height={360} compact />
      )}
    </section>
  );
}
