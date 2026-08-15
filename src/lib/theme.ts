export const THEME_STORAGE_KEY = "gofoundry-theme";

export type Theme = "light" | "dark";

export function readStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // localStorage may be blocked
  }
  return null;
}

export function resolveTheme(stored: Theme | null): Theme {
  if (stored) return stored;
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

export function persistTheme(theme: Theme) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // localStorage may be blocked
  }
  applyTheme(theme);
  window.dispatchEvent(new CustomEvent("gofoundry-theme", { detail: { theme } }));
}
