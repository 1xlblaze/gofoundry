"use client";

import { useEffect, useState } from "react";
import { persistTheme, readStoredTheme, resolveTheme, type Theme } from "@/lib/theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setTheme(resolveTheme(readStoredTheme()));
    setReady(true);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    persistTheme(next);
    setTheme(next);
  }

  const label = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";

  return (
    <button
      type="button"
      className="icon-btn theme-toggle"
      onClick={toggle}
      aria-label={label}
      title={label}
      disabled={!ready}
    >
      <span className="theme-toggle-icon" aria-hidden>
        {theme === "dark" ? "☀" : "☾"}
      </span>
    </button>
  );
}
