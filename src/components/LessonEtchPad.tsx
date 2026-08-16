"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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
  if (seconds < 8) return "Saved just now";
  if (seconds < 60) return `Saved ${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  return `Saved ${minutes}m ago`;
}

export function LessonEtchPad({ lessonSlug, trackId, title }: LessonEtchPadProps) {
  const [mode, setMode] = useState<"closed" | "inline" | "split">("closed");
  const [savedLabel, setSavedLabel] = useState<string | null>(null);
  const [splitSlot, setSplitSlot] = useState<HTMLElement | null>(null);
  const preset = presetForTrack(trackId);
  const storageKey = `gofoundry-lesson-etch-${lessonSlug}`;

  useEffect(() => {
    setSplitSlot(document.getElementById("lesson-etch-split-slot"));
  }, []);

  useEffect(() => {
    document.body.classList.toggle("lesson-etch-split-active", mode === "split");
    return () => document.body.classList.remove("lesson-etch-split-active");
  }, [mode]);

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

  const canvas =
    mode !== "closed" ? (
      <EtchCanvas
        storageKey={storageKey}
        preset={preset}
        height={mode === "split" ? 480 : 320}
        compact
      />
    ) : null;

  return (
    <>
      <div className="lesson-etch-strip lesson-zone lesson-zone-sketch">
        <div className="lesson-etch-strip-copy">
          <p className="type-label">Etch along</p>
          <p className="lesson-etch-strip-text">
            Sketch <strong>{title}</strong> — autosaves locally
            {savedLabel ? (
              <span className="lesson-etch-saved-inline"> · {savedLabel}</span>
            ) : null}
          </p>
        </div>
        <div className="lesson-etch-strip-actions">
          <button
            type="button"
            className={`ghost-btn lesson-etch-strip-btn${mode === "inline" ? " is-active" : ""}`}
            onClick={() => setMode((m) => (m === "inline" ? "closed" : "inline"))}
          >
            Inline
          </button>
          <button
            type="button"
            className={`secondary-btn lesson-etch-strip-btn${mode === "split" ? " is-active" : ""}`}
            onClick={() => setMode((m) => (m === "split" ? "closed" : "split"))}
          >
            Split view
          </button>
        </div>
      </div>
      {mode === "inline" ? <div className="lesson-etch-inline">{canvas}</div> : null}
      {mode === "split" && splitSlot && canvas
        ? createPortal(canvas, splitSlot)
        : null}
    </>
  );
}
