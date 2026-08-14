"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { NavLinks } from "@/components/NavLinks";
import { loadProgress } from "@/lib/progress";

export function HeaderChrome({
  brand,
  auth,
  totalLessons,
}: {
  brand: ReactNode;
  auth: ReactNode;
  totalLessons: number;
}) {
  const [open, setOpen] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const refresh = () => {
      const completed = new Set(loadProgress().completed).size;
      setProgressPercent(
        totalLessons ? Math.min(100, Math.round((completed / totalLessons) * 100)) : 0,
      );
    };

    refresh();
    window.addEventListener("gofoundry-progress", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("gofoundry-progress", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [totalLessons]);

  return (
    <header className={`site-header${solid ? " site-header-solid" : ""}`}>
      <div className="shell site-header-inner">
        <div onClick={() => setOpen(false)}>{brand}</div>
        <NavLinks />
        <div className="header-actions">
          {auth}
          <button
            type="button"
            className="icon-btn menu-toggle"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>
      <div
        className="motion2-header-progress"
        role="progressbar"
        aria-label="Overall course progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressPercent}
      >
        <span
          className="motion2-header-progress-fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {open ? (
        <div className="mobile-nav" onClick={() => setOpen(false)}>
          <NavLinks mobile />
          <Link href="/login">Account</Link>
        </div>
      ) : null}
    </header>
  );
}
