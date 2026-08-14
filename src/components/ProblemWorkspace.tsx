"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { DiagnosticPanel } from "@/components/DiagnosticPanel";
import type { PlatformProblem } from "@/lib/platform/types";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <div className="lab-editor-loading">Loading editor…</div>,
});

type ProblemWorkspaceProps = {
  problem: PlatformProblem;
};

export function ProblemWorkspace({ problem }: ProblemWorkspaceProps) {
  const [code, setCode] = useState(problem.starterCode);
  const [stage, setStage] = useState<1 | 2 | 3 | 4>(1);

  const hearComplete =
    Boolean(problem.algorithmicSpecs.timeComplexity) &&
    stage >= 1;
  const etchComplete = stage >= 2;
  const anchorComplete = stage >= 3;

  return (
    <div className="problem-workspace">
      <header className="problem-workspace-hero panel">
        <div>
          <p className="kicker">{problem.trackId.toUpperCase()} · {problem.difficulty}</p>
          <h1>{problem.title}</h1>
        </div>
        <div className="problem-spec-grid">
          <Spec label="Time" value={problem.algorithmicSpecs.timeComplexity} />
          <Spec label="Space" value={problem.algorithmicSpecs.spaceComplexity} />
          <Spec
            label="Max allocs/run"
            value={String(problem.runtimeInvariants.maxHeapAllocsPerRun ?? "—")}
          />
          <Spec
            label="Race tolerance"
            value={String(problem.runtimeInvariants.allowedRaceConditions ?? 0)}
          />
        </div>
      </header>

      <nav className="heat-canvas-steps panel" aria-label="HEAT stages">
        {[
          ["01", "Hear", 1],
          ["02", "Etch", 2],
          ["03", "Anchor", 3],
          ["04", "Temper", 4],
        ].map(([number, label, step]) => (
          <button
            key={label}
            type="button"
            className={stage === step ? "active" : ""}
            onClick={() => setStage(step as 1 | 2 | 3 | 4)}
          >
            <span>{number}</span>
            {label}
          </button>
        ))}
      </nav>

      {stage === 1 && (
        <section className="panel problem-stage">
          <h2>Hear — Constraint auditor</h2>
          <p>
            Validate operational parameters before the editor unlocks. Staff problems
            require explicit throughput, allocation, and concurrency choices.
          </p>
          <div className="problem-constraint-form">
            <label>
              Throughput target
              <input defaultValue="100k QPS" readOnly={false} />
            </label>
            <label>
              Allocation profile
              <select defaultValue="single-buffer">
                <option value="single-buffer">Single pre-sized buffer</option>
                <option value="dynamic">Dynamic resizing</option>
              </select>
            </label>
            <label>
              Concurrency model
              <select defaultValue="mutex">
                <option value="mutex">sync.Mutex</option>
                <option value="atomic">atomic.Pointer</option>
                <option value="channel">chan struct{}</option>
              </select>
            </label>
          </div>
          <button
            type="button"
            className="primary-btn"
            onClick={() => setStage(2)}
          >
            Lock constraints & continue to Etch
          </button>
        </section>
      )}

      {stage === 2 && hearComplete && (
        <section className="panel problem-stage">
          <h2>Etch — Topology designer</h2>
          <p>Sketch buffer sizes, backpressure points, and worker routing.</p>
          <textarea
            className="heat-canvas-field"
            rows={10}
            defaultValue={`[nums] -> [monotonic deque] -> [result slice]
     |              |
     v              v
  index i       evict i-k`}
            spellCheck={false}
          />
          <button type="button" className="primary-btn" onClick={() => setStage(3)}>
            Commit topology → Anchor
          </button>
        </section>
      )}

      {stage === 3 && etchComplete && (
        <section className="panel problem-stage">
          <h2>Anchor — Complexity & invariant matrix</h2>
          <div className="anchor-matrix">
            <Row label="Data structure" value="Monotonic deque in reused slice" />
            <Row label="Time target" value={problem.algorithmicSpecs.timeComplexity} />
            <Row label="Space target" value={problem.algorithmicSpecs.spaceComplexity} />
            <Row label="Sync choice" value="Single-goroutine (no lock)" />
          </div>
          <button type="button" className="primary-btn" onClick={() => setStage(4)}>
            Unlock Temper editor
          </button>
        </section>
      )}

      {stage === 4 && anchorComplete && (
        <section className="problem-temper">
          <div className="problem-editor panel">
            <MonacoEditor
              height="420px"
              language="go"
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value ?? "")}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                scrollBeyondLastLine: false,
              }}
            />
          </div>
          <DiagnosticPanel problemId={problem.id} code={code} />
        </section>
      )}

      <footer className="problem-workspace-footer">
        <Link href="/problems" className="ghost-btn">
          ← All problems
        </Link>
        <Link href="/heat" className="secondary-btn">
          Open HEAT canvas
        </Link>
      </footer>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="problem-spec">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="anchor-row">
      <span>{label}</span>
      <code>{value}</code>
    </div>
  );
}
