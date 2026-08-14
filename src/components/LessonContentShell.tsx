"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
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
      if (depth >= 0.38) setGateOpen(true);
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
            <Link href={labHref} className="primary-btn">
              Open in Lab
            </Link>
          ) : (
            <Link href="/problems" className="primary-btn">
              Browse Lab problems
            </Link>
          )}
          <Link href="/heat" className="ghost-btn">
            HEAT canvas
          </Link>
        </div>
      </aside>

      {!dismissed && gateOpen ? (
        <div className="lesson-gate" role="dialog" aria-labelledby="lesson-gate-title">
          <div className="lesson-gate-card panel">
            <p className="type-label">Keep your place</p>
            <h2 id="lesson-gate-title">Finish this lesson + 100 more — sign up free</h2>
            <p>
              Create a free account to save progress across tracks, sync quiz scores, and pick up
              where you left off on any device.
            </p>
            <div className="lesson-gate-actions">
              <Link href="/login" className="primary-btn">
                Create free account
              </Link>
              <button type="button" className="ghost-btn" onClick={dismissGate}>
                Keep reading as guest
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
