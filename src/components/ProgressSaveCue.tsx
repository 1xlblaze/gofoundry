"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadProgress } from "@/lib/progress";

const DISMISS_KEY = "gofoundry-progress-save-dismissed";

type SessionResponse = {
  user?: { name?: string | null };
};

export function ProgressSaveCue({ className = "" }: { className?: string }) {
  const [signedIn, setSignedIn] = useState(true);
  const [hasLocalProgress, setHasLocalProgress] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setDismissed(window.sessionStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }

    const refreshProgress = () => {
      const progress = loadProgress();
      setHasLocalProgress(
        progress.completed.length > 0 ||
          Boolean(progress.lastLessonSlug) ||
          Object.keys(progress.quizScores).length > 0,
      );
    };

    refreshProgress();
    window.addEventListener("gofoundry-progress", refreshProgress);

    fetch("/api/auth/session")
      .then((response) => response.json() as Promise<SessionResponse>)
      .then((session) => setSignedIn(Boolean(session?.user)))
      .catch(() => setSignedIn(false))
      .finally(() => setReady(true));

    return () => window.removeEventListener("gofoundry-progress", refreshProgress);
  }, []);

  function dismiss() {
    try {
      window.sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // sessionStorage may be blocked
    }
    setDismissed(true);
  }

  if (!ready || signedIn || !hasLocalProgress || dismissed) {
    return null;
  }

  return (
    <aside
      className={`progress-save-cue panel${className ? ` ${className}` : ""}`}
      aria-labelledby="progress-save-cue-title"
    >
      <div>
        <p className="type-label">Progress in this browser</p>
        <h2 id="progress-save-cue-title">Sign in to keep your place</h2>
        <p>
          Lessons you complete here stay on this device until you sign in. Create an account
          to sync progress across phones and laptops.
        </p>
      </div>
      <div className="progress-save-cue-actions">
        <Link href="/login" className="primary-btn">Sign in to save progress</Link>
        <button type="button" className="ghost-btn" onClick={dismiss}>
          Keep local only
        </button>
      </div>
    </aside>
  );
}
