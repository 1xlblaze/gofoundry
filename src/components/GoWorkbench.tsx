"use client";

import dynamic from "next/dynamic";
import { useId, useState } from "react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <div className="lab-editor-loading">Loading Go editor…</div>,
});

const DEFAULT_CODE = `package main

import (
\t"fmt"
\t"sync"
)

func worker(id int, jobs <-chan int, results chan<- int, wg *sync.WaitGroup) {
\tdefer wg.Done()
\tfor job := range jobs {
\t\tresult := job * job
\t\tfmt.Printf("worker %d: %d² = %d\\n", id, job, result)
\t\tresults <- result
\t}
}

func main() {
\tjobs := make(chan int)
\tresults := make(chan int)
\tvar wg sync.WaitGroup

\tfor id := 1; id <= 2; id++ {
\t\twg.Add(1)
\t\tgo worker(id, jobs, results, &wg)
\t}

\tgo func() {
\t\tfor job := 1; job <= 4; job++ {
\t\t\tjobs <- job
\t\t}
\t\tclose(jobs)
\t\twg.Wait()
\t\tclose(results)
\t}()

\ttotal := 0
\tfor result := range results {
\t\ttotal += result
\t}
\tfmt.Println("total:", total)
}
`;

type PlaygroundEvent = {
  Message?: unknown;
  Kind?: unknown;
};

type PlaygroundResult = {
  Errors?: unknown;
  Events?: unknown;
};

type OutputLine = {
  kind: "stdout" | "stderr";
  message: string;
};

function parseOutput(result: PlaygroundResult): OutputLine[] {
  const lines: OutputLine[] = [];

  if (typeof result.Errors === "string" && result.Errors.trim()) {
    lines.push({ kind: "stderr", message: result.Errors });
  }

  if (Array.isArray(result.Events)) {
    for (const event of result.Events as PlaygroundEvent[]) {
      if (typeof event.Message !== "string") continue;
      lines.push({
        kind: event.Kind === "stderr" ? "stderr" : "stdout",
        message: event.Message,
      });
    }
  }

  return lines;
}

export function GoWorkbench({
  initialCode = DEFAULT_CODE,
  title = "Worker pool playground",
}: {
  initialCode?: string;
  title?: string;
}) {
  const titleId = useId();
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState<OutputLine[]>([]);
  const [hasRun, setHasRun] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  async function runCode() {
    setIsRunning(true);
    setHasRun(true);
    setOutput([]);

    try {
      const response = await fetch("/api/playground", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const result = (await response.json()) as PlaygroundResult;
      const lines = parseOutput(result);

      setOutput(
        lines.length > 0
          ? lines
          : [
              {
                kind: response.ok ? "stdout" : "stderr",
                message: response.ok
                  ? "Program completed with no output."
                  : "The run failed without an error message.",
              },
            ],
      );
    } catch {
      setOutput([
        {
          kind: "stderr",
          message: "Could not reach the playground. Check your connection and retry.",
        },
      ]);
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="lab-workbench panel" aria-labelledby={titleId}>
      <div className="lab-workbench-head">
        <div>
          <span className="type-label">Interactive Go</span>
          <h3 id={titleId}>{title}</h3>
        </div>
        <button
          type="button"
          className="primary-btn lab-run-btn"
          onClick={runCode}
          disabled={isRunning}
        >
          <span aria-hidden="true">{isRunning ? "◌" : "▶"}</span>
          {isRunning ? "Running…" : "Run code"}
        </button>
      </div>

      <div className="lab-editor-shell">
        <MonacoEditor
          height="280px"
          language="go"
          theme="vs-dark"
          value={code}
          onChange={(value) => setCode(value ?? "")}
          options={{
            ariaLabel: "Go code editor",
            automaticLayout: true,
            fontSize: 14,
            lineHeight: 22,
            minimap: { enabled: false },
            padding: { top: 14, bottom: 14 },
            scrollBeyondLastLine: false,
            tabSize: 4,
          }}
        />
      </div>

      <section className="lab-terminal" aria-label="Program output">
        <div className="lab-terminal-head">
          <span className="lab-terminal-lights" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>OUTPUT</span>
          <span className="lab-terminal-status">
            {isRunning ? "executing" : "play.golang.org"}
          </span>
        </div>
        <pre aria-live="polite" aria-busy={isRunning}>
          {isRunning ? (
            <span className="lab-output-muted">$ go run main.go…</span>
          ) : hasRun ? (
            output.map((line, index) => (
              <span
                className={`lab-output-line lab-output-${line.kind}`}
                key={`${line.kind}-${index}`}
              >
                {line.message}
              </span>
            ))
          ) : (
            <span className="lab-output-muted">
              $ Ready. Run the program to see stdout and compiler errors.
            </span>
          )}
        </pre>
      </section>

      <aside className="bench-panel" aria-label="Allocation gauge preview">
        <div className="bench-copy">
          <div className="bench-title-row">
            <span className="type-label">Allocation gauge</span>
            <span className="bench-pro-badge">Pro</span>
          </div>
          <p>
            Full allocs/op + escape analysis requires the Pro sandbox
            (Docker/--race). Playground runs validate correctness instantly.
          </p>
        </div>
        <div className="bench-gauges" aria-label="Benchmark metrics pending">
          <span className="bench-gauge">ns/op · pending</span>
          <span className="bench-gauge">B/op · pending</span>
          <span className="bench-gauge">allocs/op · pending</span>
        </div>
      </aside>
    </div>
  );
}
