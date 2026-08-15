"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { WorkspaceAction } from "@/components/LessonWorkspace";

export function CodeBlock({
  title,
  language,
  code,
  labHref,
  problemId,
}: {
  title?: string;
  language: string;
  code: string;
  labHref?: string;
  problemId?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
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

  function openInLabPage() {
    try {
      window.sessionStorage.setItem("gofoundry-playground-code", code);
    } catch {
      // sessionStorage may be blocked
    }
  }

  return (
    <div className="code-wrap" role="region" aria-label={title ?? "Code example"}>
      <div className="code-toolbar">
        <span>
          {title ?? "Example"} · {language}
        </span>
        <div className="code-toolbar-actions">
          {labHref || problemId ? (
            <WorkspaceAction
              action="lab"
              problemId={problemId}
              code={code}
              fullPageHref={labHref}
              className="code-run-btn"
            >
              Run in Lab
            </WorkspaceAction>
          ) : (
            <WorkspaceAction action="playground" code={code} className="code-run-btn">
              Run snippet
            </WorkspaceAction>
          )}
          <Link
            href="/lab"
            className="copy-btn"
            onClick={openInLabPage}
            title="Open in full Lab editor"
          >
            Open in Lab
          </Link>
          <button
            type="button"
            className="copy-btn"
            onClick={() => setShowLineNumbers((value) => !value)}
            aria-pressed={showLineNumbers}
          >
            {showLineNumbers ? "Hide lines" : "Show lines"}
          </button>
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
            {copied ? "Copied ✓" : "Copy"}
          </button>
        </div>
      </div>
      <pre
        className={`${expanded ? "" : "code-collapsed"}${showLineNumbers ? "" : " code-no-lines"}`}
        tabIndex={0}
      >
        <code>
          {lines.map((line, index) => (
            <span key={index} className="code-line">
              {showLineNumbers ? (
                <span className="code-ln" aria-hidden="true">
                  {index + 1}
                </span>
              ) : null}
              <span className="code-text">{line || " "}</span>
              {"\n"}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
