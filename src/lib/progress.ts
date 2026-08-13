"use client";

export type ProgressState = {
  completed: string[];
  quizScores: Record<string, number>;
};

const KEY = "gofoundry-progress-v1";

export function loadProgress(): ProgressState {
  if (typeof window === "undefined") {
    return { completed: [], quizScores: {} };
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { completed: [], quizScores: {} };
    const parsed = JSON.parse(raw) as ProgressState;
    return {
      completed: Array.isArray(parsed.completed) ? parsed.completed : [],
      quizScores: parsed.quizScores ?? {},
    };
  } catch {
    return { completed: [], quizScores: {} };
  }
}

export function saveProgress(state: ProgressState) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function markComplete(slug: string) {
  const state = loadProgress();
  if (!state.completed.includes(slug)) {
    state.completed.push(slug);
    saveProgress(state);
  }
  return state;
}

export function saveQuizScore(slug: string, score: number) {
  const state = loadProgress();
  state.quizScores[slug] = score;
  if (score === 1 && !state.completed.includes(slug)) {
    state.completed.push(slug);
  }
  saveProgress(state);
  return state;
}
