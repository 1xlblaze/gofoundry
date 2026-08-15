"use client";

export type ProgressState = {
  completed: string[];
  quizScores: Record<string, number>;
  /** ISO timestamps keyed by lesson slug */
  completedAt: Record<string, string>;
  /** Last lesson the learner opened in this browser */
  lastLessonSlug?: string;
};

const KEY = "gofoundry-progress-v1";

export function loadProgress(): ProgressState {
  if (typeof window === "undefined") {
    return { completed: [], quizScores: {}, completedAt: {} };
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { completed: [], quizScores: {}, completedAt: {} };
    const parsed = JSON.parse(raw) as ProgressState;
    return {
      completed: Array.isArray(parsed.completed) ? parsed.completed : [],
      quizScores: parsed.quizScores ?? {},
      completedAt: parsed.completedAt ?? {},
      lastLessonSlug:
        typeof parsed.lastLessonSlug === "string" ? parsed.lastLessonSlug : undefined,
    };
  } catch {
    return { completed: [], quizScores: {}, completedAt: {} };
  }
}

export function saveProgress(state: ProgressState) {
  localStorage.setItem(KEY, JSON.stringify(state));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("gofoundry-progress"));
  }
}

export function markComplete(slug: string) {
  const state = loadProgress();
  if (!state.completed.includes(slug)) {
    state.completed.push(slug);
  }
  state.completedAt[slug] = new Date().toISOString();
  saveProgress(state);
  return state;
}

export function saveQuizScore(slug: string, score: number) {
  const state = loadProgress();
  state.quizScores[slug] = score;
  if (score === 1) {
    if (!state.completed.includes(slug)) {
      state.completed.push(slug);
    }
    state.completedAt[slug] = new Date().toISOString();
  }
  saveProgress(state);
  return state;
}

/** Reset one lesson: remove completion + quiz score so it can be started fresh. */
export function resetLesson(slug: string) {
  const state = loadProgress();
  state.completed = state.completed.filter((s) => s !== slug);
  delete state.quizScores[slug];
  delete state.completedAt[slug];
  saveProgress(state);
  return state;
}

/** Record the lesson currently being read so Continue can resume it. */
export function touchLastLesson(slug: string) {
  const state = loadProgress();
  state.lastLessonSlug = slug;
  saveProgress(state);
  return state;
}

/** Wipe all progress across every lesson. */
export function resetAllProgress() {
  const empty: ProgressState = { completed: [], quizScores: {}, completedAt: {} };
  saveProgress(empty);
  return empty;
}
