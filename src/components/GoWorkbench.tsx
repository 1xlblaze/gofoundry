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

const ALLOCATIONS = 1000;

const STRING_CONCAT_ALLOCS = `package main

import (
\t"fmt"
\t"runtime"
)

const operations = ${ALLOCATIONS}

var sink string

//go:noinline
func target(parts []string) string {
\tresult := ""
\tfor _, part := range parts {
\t\tresult += part
\t}
\treturn result
}

func heapDelta(after, before uint64) int64 {
\tif after >= before {
\t\treturn int64(after - before)
\t}
\treturn -int64(before - after)
}

func main() {
\tparts := []string{"escape", "-", "analysis", "-", "makes", "-", "allocations", "-", "visible"}

\truntime.GC()
\tvar before, after runtime.MemStats
\truntime.ReadMemStats(&before)

\tfor i := 0; i < operations; i++ {
\t\tsink = target(parts)
\t}

\truntime.ReadMemStats(&after)
\truntime.KeepAlive(sink)

\tallocDelta := heapDelta(after.Alloc, before.Alloc)
\ttotalDelta := after.TotalAlloc - before.TotalAlloc
\tmallocsDelta := after.Mallocs - before.Mallocs
\tnumGC := after.NumGC - before.NumGC
\tbytesPerOp := float64(totalDelta) / float64(operations)
\tallocsPerOp := float64(mallocsDelta) / float64(operations)

\tfmt.Printf("AllocDelta: %d bytes\\n", allocDelta)
\tfmt.Printf("TotalAlloc delta: %d bytes\\n", totalDelta)
\tfmt.Printf("Mallocs delta: %d\\n", mallocsDelta)
\tfmt.Printf("NumGC: %d\\n", numGC)
\tfmt.Printf("Per-op estimate: %.2f B/op, %.3f allocs/op\\n", bytesPerOp, allocsPerOp)
\tfmt.Printf("GF_METRIC AllocDelta=%d TotalAllocDelta=%d MallocsDelta=%d NumGC=%d BytesPerOp=%.2f AllocsPerOp=%.3f\\n",
\t\tallocDelta, totalDelta, mallocsDelta, numGC, bytesPerOp, allocsPerOp)
}
`;

const STRINGS_BUILDER_ALLOCS = `package main

import (
\t"fmt"
\t"runtime"
\t"strings"
)

const operations = ${ALLOCATIONS}

var sink string

//go:noinline
func target(parts []string) string {
\tsize := 0
\tfor _, part := range parts {
\t\tsize += len(part)
\t}

\tvar builder strings.Builder
\tbuilder.Grow(size)
\tfor _, part := range parts {
\t\tbuilder.WriteString(part)
\t}
\treturn builder.String()
}

func heapDelta(after, before uint64) int64 {
\tif after >= before {
\t\treturn int64(after - before)
\t}
\treturn -int64(before - after)
}

func main() {
\tparts := []string{"escape", "-", "analysis", "-", "makes", "-", "allocations", "-", "visible"}

\truntime.GC()
\tvar before, after runtime.MemStats
\truntime.ReadMemStats(&before)

\tfor i := 0; i < operations; i++ {
\t\tsink = target(parts)
\t}

\truntime.ReadMemStats(&after)
\truntime.KeepAlive(sink)

\tallocDelta := heapDelta(after.Alloc, before.Alloc)
\ttotalDelta := after.TotalAlloc - before.TotalAlloc
\tmallocsDelta := after.Mallocs - before.Mallocs
\tnumGC := after.NumGC - before.NumGC
\tbytesPerOp := float64(totalDelta) / float64(operations)
\tallocsPerOp := float64(mallocsDelta) / float64(operations)

\tfmt.Printf("AllocDelta: %d bytes\\n", allocDelta)
\tfmt.Printf("TotalAlloc delta: %d bytes\\n", totalDelta)
\tfmt.Printf("Mallocs delta: %d\\n", mallocsDelta)
\tfmt.Printf("NumGC: %d\\n", numGC)
\tfmt.Printf("Per-op estimate: %.2f B/op, %.3f allocs/op\\n", bytesPerOp, allocsPerOp)
\tfmt.Printf("GF_METRIC AllocDelta=%d TotalAllocDelta=%d MallocsDelta=%d NumGC=%d BytesPerOp=%.2f AllocsPerOp=%.3f\\n",
\t\tallocDelta, totalDelta, mallocsDelta, numGC, bytesPerOp, allocsPerOp)
}
`;

export const ALLOCATION_SNIPPETS = {
  concat: {
    label: "string += loop",
    code: STRING_CONCAT_ALLOCS,
  },
  builder: {
    label: "strings.Builder",
    code: STRINGS_BUILDER_ALLOCS,
  },
} as const;

type WorkbenchMode = "run" | "measure";
type AllocationSnippetKey = keyof typeof ALLOCATION_SNIPPETS;

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

type AllocationMetrics = {
  allocDelta: number;
  totalAllocDelta: number;
  mallocsDelta: number;
  numGC: number;
  bytesPerOp: number;
  allocsPerOp: number;
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

function parseAllocationMetrics(lines: OutputLine[]): AllocationMetrics | null {
  const stdout = lines
    .filter((line) => line.kind === "stdout")
    .map((line) => line.message)
    .join("\n");
  const match = stdout.match(
    /GF_METRIC\s+AllocDelta=(-?\d+)\s+TotalAllocDelta=(\d+)\s+MallocsDelta=(\d+)\s+NumGC=(\d+)\s+BytesPerOp=([\d.]+)\s+AllocsPerOp=([\d.]+)/,
  );

  if (!match) return null;

  const values = match.slice(1).map(Number);
  if (!values.every(Number.isFinite)) return null;

  return {
    allocDelta: values[0],
    totalAllocDelta: values[1],
    mallocsDelta: values[2],
    numGC: values[3],
    bytesPerOp: values[4],
    allocsPerOp: values[5],
  };
}

function formatInteger(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function GoWorkbench({
  initialCode = DEFAULT_CODE,
  title = "Worker pool playground",
  initialMode = "run",
  onCodeChange,
}: {
  initialCode?: string;
  title?: string;
  initialMode?: WorkbenchMode;
  onCodeChange?: (code: string) => void;
}) {
  const titleId = useId();
  const [mode, setMode] = useState<WorkbenchMode>(initialMode);
  const [runSource, setRunSource] = useState(initialCode);
  const [measureCode, setMeasureCode] = useState(STRING_CONCAT_ALLOCS);
  const [activeSnippet, setActiveSnippet] =
    useState<AllocationSnippetKey>("concat");
  const [output, setOutput] = useState<OutputLine[]>([]);
  const [metrics, setMetrics] = useState<AllocationMetrics | null>(null);
  const [hasRun, setHasRun] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const code = mode === "run" ? runSource : measureCode;

  function resetResult() {
    setOutput([]);
    setMetrics(null);
    setHasRun(false);
  }

  function selectMode(nextMode: WorkbenchMode) {
    if (nextMode === mode) return;
    setMode(nextMode);
    resetResult();
    onCodeChange?.(nextMode === "run" ? runSource : measureCode);
  }

  function updateCode(value: string) {
    if (mode === "run") {
      setRunSource(value);
    } else {
      setMeasureCode(value);
    }
    setMetrics(null);
    onCodeChange?.(value);
  }

  function selectSnippet(key: AllocationSnippetKey) {
    const nextCode = ALLOCATION_SNIPPETS[key].code;
    setActiveSnippet(key);
    setMeasureCode(nextCode);
    resetResult();
    onCodeChange?.(nextCode);
  }

  async function runCode() {
    setIsRunning(true);
    setHasRun(true);
    setOutput([]);
    setMetrics(null);

    try {
      const response = await fetch("/api/playground", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const result = (await response.json()) as PlaygroundResult;
      const lines = parseOutput(result);

      if (mode === "measure" && response.ok) {
        setMetrics(parseAllocationMetrics(lines));
      }
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
        <div className="bench-workbench-actions">
          <div className="bench-mode-toggle" aria-label="Workbench mode">
            <button
              type="button"
              className={mode === "run" ? "active" : ""}
              onClick={() => selectMode("run")}
              aria-pressed={mode === "run"}
              disabled={isRunning}
            >
              Run
            </button>
            <button
              type="button"
              className={mode === "measure" ? "active" : ""}
              onClick={() => selectMode("measure")}
              aria-pressed={mode === "measure"}
              disabled={isRunning}
            >
              Measure allocs
            </button>
          </div>
          <button
            type="button"
            className="primary-btn lab-run-btn"
            onClick={runCode}
            disabled={isRunning}
          >
            <span aria-hidden="true">{isRunning ? "◌" : "▶"}</span>
            {isRunning
              ? mode === "measure"
                ? "Measuring…"
                : "Running…"
              : mode === "measure"
                ? "Measure allocations"
                : "Run code"}
          </button>
        </div>
      </div>

      {mode === "measure" && (
        <div className="bench-snippet-bar">
          <span>Starter harness:</span>
          {(Object.keys(ALLOCATION_SNIPPETS) as AllocationSnippetKey[]).map(
            (key) => (
              <button
                type="button"
                key={key}
                className={activeSnippet === key ? "active" : ""}
                onClick={() => selectSnippet(key)}
                aria-pressed={activeSnippet === key}
                disabled={isRunning}
              >
                {ALLOCATION_SNIPPETS[key].label}
              </button>
            ),
          )}
        </div>
      )}

      <div className="lab-editor-shell">
        <MonacoEditor
          height="280px"
          language="go"
          theme="vs-dark"
          value={code}
          onChange={(value) => updateCode(value ?? "")}
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
            <span className="type-label">Allocation measurements</span>
            {mode === "measure" && metrics && (
              <span className="bench-live-badge">Live</span>
            )}
          </div>
          <p>
            <code>go test -bench</code> + <code>-race</code> need Pro sandbox
            (Docker). This harness measures allocations in the Playground runtime
            via <code>ReadMemStats</code> — real numbers, not marketing.
          </p>
        </div>
        {mode === "measure" && metrics ? (
          <div className="bench-gauges" aria-label="Live allocation metrics">
            <span className="bench-gauge bench-gauge-live">
              Alloc Δ {formatInteger(metrics.allocDelta)} B
            </span>
            <span className="bench-gauge bench-gauge-live">
              Total {formatInteger(metrics.totalAllocDelta)} B
            </span>
            <span className="bench-gauge bench-gauge-live">
              {metrics.bytesPerOp.toFixed(2)} B/op
            </span>
            <span className="bench-gauge bench-gauge-live">
              {metrics.allocsPerOp.toFixed(3)} allocs/op
            </span>
            <span className="bench-gauge bench-gauge-live">
              {formatInteger(metrics.mallocsDelta)} mallocs
            </span>
            <span className="bench-gauge bench-gauge-live">
              {formatInteger(metrics.numGC)} GC
            </span>
          </div>
        ) : (
          <p className="bench-metric-empty">
            {mode === "run"
              ? "Switch to Measure allocs to run a ReadMemStats harness."
              : hasRun && !isRunning
                ? "No metrics parsed. Fix any compiler error, then run the harness again."
                : "Run the harness to populate live allocation metrics."}
          </p>
        )}
      </aside>
    </div>
  );
}
