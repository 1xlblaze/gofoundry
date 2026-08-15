export type EtchPreset = "general" | "dsa" | "lld" | "hld";

export type EtchScene = {
  type: "excalidraw";
  version: 2;
  elements: unknown[];
  appState?: Record<string, unknown>;
  files?: Record<string, unknown>;
};

export function emptyEtchScene(): EtchScene {
  return { type: "excalidraw", version: 2, elements: [], appState: { viewBackgroundColor: "#faf8f5" } };
}

export function parseEtchScene(raw: string | undefined | null): EtchScene | null {
  if (!raw?.trim()) return null;
  if (!raw.trimStart().startsWith("{")) return null;
  try {
    const parsed = JSON.parse(raw) as EtchScene;
    if (parsed?.type === "excalidraw" && Array.isArray(parsed.elements)) return parsed;
  } catch {
    return null;
  }
  return null;
}

export function serializeEtchScene(scene: EtchScene): string {
  return JSON.stringify(scene);
}

export function etchSceneToPayload(scene: EtchScene | null): Record<string, unknown> {
  if (!scene) return {};
  return scene as unknown as Record<string, unknown>;
}

export function loadStoredEtch(key: string): EtchScene | null {
  if (typeof window === "undefined") return null;
  return parseEtchScene(window.localStorage.getItem(key));
}

export function saveStoredEtch(key: string, scene: EtchScene) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, serializeEtchScene(scene));
  try {
    window.localStorage.setItem(`${key}-saved-at`, String(Date.now()));
  } catch {
    // localStorage may be blocked
  }
}

export function etchSavedAt(key: string): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`${key}-saved-at`);
    if (!raw) return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

export const ETCH_PRESET_HINTS: Record<EtchPreset, string[]> = {
  general: ["Input", "Transform", "Output", "Edge cases"],
  dsa: ["Pointers / indices", "Window bounds", "State structure", "Result write path"],
  lld: ["Client", "API layer", "Domain service", "Storage / cache", "Concurrency boundary"],
  hld: ["Load balancer", "App tier", "Cache", "Primary DB", "Queue / stream", "CDN"],
};

export function presetForTrack(trackId?: string): EtchPreset {
  if (trackId === "lld") return "lld";
  if (trackId === "hld") return "hld";
  if (trackId === "dsa") return "dsa";
  return "general";
}
