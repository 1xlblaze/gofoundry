"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { WorkspaceAction } from "@/components/LessonWorkspace";
import { loadProgress } from "@/lib/progress";

const GATE_STORAGE = "gofoundry-lesson-gate-dismissed";

export function LessonContentShell({
  slug,
  blockCount,
  labHref,
  children,
}: {
  slug: string;
  blockCount: number;
  labHref?: string;
  children: ReactNode;
}) {
  const shellRef = useRef<HTMLDivElement>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(GATE_STORAGE);
      setDismissed(stored === "1" || loadProgress().completed.includes(slug));
    } catch {
      setDismissed(false);
    }
  }, [slug]);

  useEffect(() => {
    if (dismissed || blockCount < 6) return;
    const shell = shellRef.current;
    if (!shell) return;

    const onScroll = () => {
      const rect = shell.getBoundingClientRect();
      const scrolled = Math.max(0, -rect.top);
      const depth = scrolled / Math.max(rect.height - window.innerHeight, 1);
      if (depth >= 0.72) setGateOpen(true);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [blockCount, dismissed]);

  function dismissGate() {
    try {
      window.sessionStorage.setItem(GATE_STORAGE, "1");
    } catch {
      // sessionStorage may be blocked
    }
    setDismissed(true);
    setGateOpen(false);
  }

  return (
    <div ref={shellRef} className="lesson-content-shell">
      {children}

      <aside className="lesson-inline-cta panel" aria-label="Practice this pattern">
        <p className="type-label">Ready to temper?</p>
        <h3>Practice this pattern in the Lab</h3>
        <p>
          Run the 4-gate diagnostic pipeline on a matching problem — tests, race detector,
          leak check, and alloc audit.
        </p>
        <div className="lesson-inline-cta-actions">
          {labHref ? (
            <WorkspaceAction
              action="lab"
              problemId={labHref.split("/").pop()}
              fullPageHref={labHref}
              className="primary-btn"
            >
              Open in Lab
            </WorkspaceAction>
          ) : (
            <WorkspaceAction action="lab" fullPageHref="/problems" className="primary-btn">
              Browse Lab problems
            </WorkspaceAction>
          )}
          <WorkspaceAction action="etch" className="ghost-btn">
            HEAT canvas
          </WorkspaceAction>
        </div>
      </aside>

      {!dismissed && gateOpen ? (
        <aside
          className="lesson-save-banner lesson-save-banner-compact"
          aria-labelledby="lesson-gate-title"
        >
          <div className="lesson-save-banner-copy">
            <p className="type-label">Optional</p>
            <p id="lesson-gate-title" className="lesson-save-banner-title">
              <span className="lesson-save-banner-lead">Sync progress across devices.</span>
              <span className="lesson-save-banner-sub">Reading stays free — sign in only if you want sync.</span>
            </p>
          </div>
          <div className="lesson-gate-actions">
            <Link href="/login" className="primary-btn lesson-save-banner-btn">
              Sign in
            </Link>
            <button type="button" className="ghost-btn lesson-save-banner-btn" onClick={dismissGate}>
              Continue as guest
            </button>
          </div>
        </aside>
      ) : null}
    </div>
  );
}
