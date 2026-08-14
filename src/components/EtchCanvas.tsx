"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef } from "react";
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
  onChange?: (scene: EtchScene) => void;
  height?: number;
  compact?: boolean;
};

function buildInitialData(scene: EtchScene, compact: boolean) {
  return {
    elements: scene.elements as never[],
    appState: {
      viewBackgroundColor: "#faf8f5",
      currentItemStrokeColor: "#0f766e",
      currentItemBackgroundColor: "transparent",
      zenModeEnabled: compact,
      ...(scene.appState ?? {}),
    },
    scrollToContent: true,
  };
}

function readInitialScene(storageKey?: string): EtchScene {
  if (storageKey) {
    return loadStoredEtch(storageKey) ?? emptyEtchScene();
  }
  return emptyEtchScene();
}

export function EtchCanvas({
  storageKey,
  preset = "general",
  onChange,
  height = 420,
  compact = false,
}: EtchCanvasProps) {
  const hints = ETCH_PRESET_HINTS[preset];
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const initialDataRef = useRef<ReturnType<typeof buildInitialData> | null>(null);
  if (initialDataRef.current === null) {
    initialDataRef.current = buildInitialData(readInitialScene(storageKey), compact);
  }

  const lastSerializedRef = useRef<string>("");
  const elementCountRef = useRef(initialDataRef.current.elements.length);

  const persist = useCallback(
    (next: EtchScene) => {
      const serialized = serializeEtchScene(next);
      if (serialized === lastSerializedRef.current) return;
      lastSerializedRef.current = serialized;
      elementCountRef.current = next.elements.length;

      if (storageKey) saveStoredEtch(storageKey, next);
      onChangeRef.current?.(next);
    },
    [storageKey],
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
          initialData={initialDataRef.current}
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
        <p className="etch-save-note">Sketches autosave locally in this browser.</p>
      )}
    </div>
  );
}
