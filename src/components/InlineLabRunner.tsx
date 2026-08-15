"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getPlatformProblem } from "@/content/platform-problems";
import { readStoredTheme, type Theme } from "@/lib/theme";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <div className="lab-editor-loading">Loading editor…</div>,
});

type PlaygroundResult = {
  stdout?: string;
  stderr?: string;
  error?: string;
};

function formatOutput(result: PlaygroundResult) {
  if (result.error) return result.error;
  const chunks = [result.stdout, result.stderr].filter(Boolean);
  return chunks.join("\n").trim();
}

export function InlineLabRunner({
  problemId,
  initialCode,
  fullPageHref,
}: {
  problemId?: string;
  initialCode?: string;
  fullPageHref?: string;
}) {
  const problem = problemId ? getPlatformProblem(problemId) : undefined;
  const [code, setCode] = useState(problem?.starterCode ?? initialCode ?? "package main\n\nfunc main() {\n}\n");
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [editorTheme, setEditorTheme] = useState<"vs-dark" | "light">("vs-dark");

  useEffect(() => {
    const syncTheme = () => {
      const theme = readStoredTheme();
      const resolved =
        theme ??
        (document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");
      setEditorTheme(resolved === "dark" ? "vs-dark" : "light");
    };
    syncTheme();
    window.addEventListener("gofoundry-theme", syncTheme);
    return () => window.removeEventListener("gofoundry-theme", syncTheme);
  }, []);

  useEffect(() => {
    if (problem?.starterCode) setCode(problem.starterCode);
    else if (initialCode) setCode(initialCode);
  }, [problem?.starterCode, initialCode, problemId]);

  async function runCode() {
    setRunning(true);
    setOutput("");
    try {
      const response = await fetch("/api/playground", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const result = (await response.json()) as PlaygroundResult;
      setOutput(
        formatOutput(result) ||
          (response.ok ? "Program completed with no output." : "Run failed without details."),
      );
    } catch {
      setOutput("Could not reach the playground. Inline runner failed — try the full Lab page.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="inline-lab-runner">
      {problem ? (
        <div className="inline-lab-runner-head">
          <p className="type-label">Staff problem</p>
          <h3>{problem.title}</h3>
        </div>
      ) : null}

      <div className="inline-lab-editor">
        <MonacoEditor
          height="min(42vh, 360px)"
          language="go"
          theme={editorTheme}
          value={code}
          onChange={(value) => setCode(value ?? "")}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </div>

      <div className="inline-lab-runner-actions">
        <button type="button" className="primary-btn" onClick={runCode} disabled={running}>
          {running ? "Running…" : "Run Go"}
        </button>
        {fullPageHref ? (
          <Link href={fullPageHref} className="secondary-btn">
            Open full workspace
          </Link>
        ) : (
          <Link href="/lab" className="secondary-btn">
            Open full Lab
          </Link>
        )}
      </div>

      <div className="inline-lab-output" aria-live="polite">
        <p className="type-label">Output</p>
        <pre>{output || "Run code to see stdout, stderr, or compile errors."}</pre>
      </div>
    </div>
  );
}
