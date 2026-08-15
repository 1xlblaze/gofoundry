"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { NavLinks, moreLinks, primaryLinks } from "@/components/NavLinks";
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
  const [moreOpen, setMoreOpen] = useState(false);
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

  useEffect(() => {
    if (!moreOpen) return;
    const onPointer = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest(".header-more")) setMoreOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMoreOpen(false);
    };
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [moreOpen]);

  return (
    <header className={`site-header${solid ? " site-header-solid" : ""}`}>
      <div className="shell site-header-inner">
        <div onClick={() => setOpen(false)}>{brand}</div>
        <NavLinks />
        <div className="header-actions">
          <Link href="/search" className="icon-btn header-search" aria-label="Search lessons">
            <SearchIcon />
          </Link>
          <div className="header-more">
            <button
              type="button"
              className="ghost-btn header-more-trigger"
              aria-expanded={moreOpen}
              aria-haspopup="true"
              onClick={() => setMoreOpen((value) => !value)}
            >
              More
            </button>
            {moreOpen ? (
              <div className="header-more-menu" role="menu">
                {moreLinks.map((link) => (
                  <Link key={link.href} href={link.href} role="menuitem" onClick={() => setMoreOpen(false)}>
                    {link.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
          {auth}
          <button
            type="button"
            className="icon-btn menu-toggle"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? (
              <span aria-hidden="true">✕</span>
            ) : (
              <span aria-hidden="true">☰</span>
            )}
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
          {[...primaryLinks, ...moreLinks, { href: "/search", label: "Search" }].map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
          <Link href="/login">Account</Link>
        </div>
      ) : null}
    </header>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
      <path d="M16 16.5 L20.5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
