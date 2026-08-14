"use client";

export type ProblemProgressState = {
  done: string[];
  starred: string[];
  notes: Record<string, string>;
};

const KEY = "gofoundry-problems-v1";
const EVENT_NAME = "gofoundry-problem-progress";

const emptyProgress = (): ProblemProgressState => ({
  done: [],
  starred: [],
  notes: {},
});

function parseNotes(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => {
      return typeof entry[1] === "string";
    }),
  );
}

export function loadProblemProgress(): ProblemProgressState {
  if (typeof window === "undefined") return emptyProgress();

  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyProgress();

    const parsed = JSON.parse(raw) as Partial<ProblemProgressState>;
    return {
      done: Array.isArray(parsed.done)
        ? parsed.done.filter((id): id is string => typeof id === "string")
        : [],
      starred: Array.isArray(parsed.starred)
        ? parsed.starred.filter((id): id is string => typeof id === "string")
        : [],
      notes: parseNotes(parsed.notes),
    };
  } catch {
    return emptyProgress();
  }
}

export function saveProblemProgress(state: ProblemProgressState) {
  localStorage.setItem(KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function toggleDone(id: string) {
  const state = loadProblemProgress();
  state.done = state.done.includes(id)
    ? state.done.filter((problemId) => problemId !== id)
    : [...state.done, id];
  saveProblemProgress(state);
  return state;
}

export function toggleStar(id: string) {
  const state = loadProblemProgress();
  state.starred = state.starred.includes(id)
    ? state.starred.filter((problemId) => problemId !== id)
    : [...state.starred, id];
  saveProblemProgress(state);
  return state;
}

export function resetAllProblems() {
  const state = emptyProgress();
  saveProblemProgress(state);
  return state;
}
