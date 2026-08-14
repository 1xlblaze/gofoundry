"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { NavLinks } from "@/components/NavLinks";

export function HeaderChrome({
  brand,
  auth,
}: {
  brand: ReactNode;
  auth: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
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

      {open ? (
        <div className="mobile-nav" onClick={() => setOpen(false)}>
          <NavLinks mobile />
          <Link href="/login">Account</Link>
        </div>
      ) : null}
    </header>
  );
}
