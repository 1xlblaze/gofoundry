"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const DISMISS_KEY = "gofoundry-first-complete-dismissed";

type SessionResponse = {
  user?: { name?: string | null };
};

export function FirstCompletionPrompt() {
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(DISMISS_KEY) === "1") {
        setReady(true);
        return;
      }
    } catch {
      // sessionStorage may be blocked
    }

    fetch("/api/auth/session")
      .then((response) => response.json() as Promise<SessionResponse>)
      .then((session) => {
        if (!session?.user) {
          setVisible(true);
        }
      })
      .catch(() => setVisible(true))
      .finally(() => setReady(true));

    return undefined;
  }, []);

  function dismiss() {
    try {
      window.sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // sessionStorage may be blocked
    }
    setVisible(false);
  }

  if (!ready || !visible) return null;

  return (
    <aside
      className="first-complete-prompt panel"
      role="dialog"
      aria-labelledby="first-complete-title"
    >
      <div>
        <p className="type-label">First lesson complete</p>
        <h2 id="first-complete-title">Save your progress?</h2>
        <p>
          Nice work. Sign in to sync completions across devices — lesson reading stays free,
          including for early beta members.
        </p>
      </div>
      <div className="first-complete-actions">
        <Link href="/login" className="primary-btn">Sign in to save</Link>
        <button type="button" className="ghost-btn" onClick={dismiss}>
          Continue locally
        </button>
      </div>
    </aside>
  );
}
