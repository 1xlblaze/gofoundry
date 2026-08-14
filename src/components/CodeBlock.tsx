"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export function CodeBlock({
  title,
  language,
  code,
  labHref,
}: {
  title?: string;
  language: string;
  code: string;
  labHref?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const lines = useMemo(() => code.split("\n"), [code]);
  const collapsible = lines.length > 22;

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="code-wrap" role="region" aria-label={title ?? "Code example"}>
      <div className="code-toolbar">
        <span>
          {title ?? "Example"} · {language}
        </span>
        <div className="code-toolbar-actions">
          {labHref ? (
            <Link href={labHref} className="code-run-btn">
              Run in Lab
            </Link>
          ) : null}
          {collapsible ? (
            <button
              type="button"
              className="copy-btn"
              onClick={() => setExpanded((value) => !value)}
              aria-expanded={expanded}
            >
              {expanded ? "Collapse" : "Expand"}
            </button>
          ) : null}
          <button
            type="button"
            className="copy-btn"
            onClick={onCopy}
            aria-label={copied ? "Copied to clipboard" : "Copy code to clipboard"}
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
      <pre className={expanded ? "" : "code-collapsed"} tabIndex={0}>
        <code>
          {lines.map((line, index) => (
            <span key={index} className="code-line">
              <span className="code-ln" aria-hidden="true">
                {index + 1}
              </span>
              <span className="code-text">{line || " "}</span>
              {"\n"}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
