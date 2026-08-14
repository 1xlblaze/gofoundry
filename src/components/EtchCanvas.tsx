"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ETCH_PRESET_HINTS,
  emptyEtchScene,
  loadStoredEtch,
  saveStoredEtch,
  serializeEtchScene,
  type EtchPreset,
  type EtchScene,
} from "@/lib/etch-diagram";

import "@excalidraw/excalidraw/index.css";

const Excalidraw = dynamic(
  async () => {
    const mod = await import("@excalidraw/excalidraw");
    return mod.Excalidraw;
  },
  {
    ssr: false,
    loading: () => <div className="etch-canvas-loading">Loading drawing canvas…</div>,
  },
);

type EtchCanvasProps = {
  storageKey?: string;
  preset?: EtchPreset;
  value?: EtchScene | null;
  onChange?: (scene: EtchScene) => void;
  height?: number;
  compact?: boolean;
};

export function EtchCanvas({
  storageKey,
  preset = "general",
  value,
  onChange,
  height = 420,
  compact = false,
}: EtchCanvasProps) {
  const [scene, setScene] = useState<EtchScene>(() => value ?? emptyEtchScene());
  const hints = ETCH_PRESET_HINTS[preset];

  useEffect(() => {
    if (value) {
      setScene(value);
      return;
    }
    if (storageKey) {
      const stored = loadStoredEtch(storageKey);
      if (stored) setScene(stored);
    }
  }, [storageKey, value]);

  const persist = useCallback(
    (next: EtchScene) => {
      setScene(next);
      onChange?.(next);
      if (storageKey) saveStoredEtch(storageKey, next);
    },
    [onChange, storageKey],
  );

  const initialData = useMemo(
    () => ({
      elements: scene.elements as never[],
      appState: {
        viewBackgroundColor: "#faf8f5",
        currentItemStrokeColor: "#0f766e",
        currentItemBackgroundColor: "transparent",
        zenModeEnabled: compact,
        ...(scene.appState ?? {}),
      },
      scrollToContent: true,
    }),
    [scene.appState, scene.elements, compact],
  );

  return (
    <div className={`etch-canvas-root${compact ? " etch-canvas-root-compact" : ""}`}>
      <div className="etch-preset-hints" aria-label="Suggested diagram labels">
        {hints.map((hint) => (
          <span key={hint} className="etch-preset-chip">
            {hint}
          </span>
        ))}
      </div>
      <div className="etch-canvas-frame" style={{ height }}>
        <Excalidraw
          initialData={initialData}
          onChange={(elements, appState, files) => {
            persist({
              type: "excalidraw",
              version: 2,
              elements: elements as unknown[],
              appState: appState as unknown as Record<string, unknown>,
              files: files as unknown as Record<string, unknown>,
            });
          }}
          UIOptions={{
            canvasActions: {
              loadScene: false,
              export: false,
              saveAsImage: false,
            },
          }}
        />
      </div>
      {storageKey && (
        <p className="etch-save-note">
          Sketches autosave locally{scene.elements.length > 0 ? " · scene saved" : ""}.
        </p>
      )}
    </div>
  );
}
