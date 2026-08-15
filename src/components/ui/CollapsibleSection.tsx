"use client";

import { useState, type ReactNode } from "react";

export function CollapsibleSection({
  title,
  summary,
  children,
  defaultOpen = true,
}: {
  title: string;
  summary?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="ds-collapsible panel">
      <button
        type="button"
        className="ds-collapsible-trigger"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="ds-collapsible-copy">
          <strong>{title}</strong>
          {summary ? <small>{summary}</small> : null}
        </span>
        <span className="ds-collapsible-icon" aria-hidden>
          {open ? "−" : "+"}
        </span>
      </button>
      {open ? <div className="ds-collapsible-body">{children}</div> : null}
    </section>
  );
}
