"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DiagnosticPanel } from "@/components/DiagnosticPanel";
import {
  emptyEtchScene,
  etchSceneToPayload,
  loadStoredEtch,
  presetForTrack,
  type EtchScene,
} from "@/lib/etch-diagram";
import type { PlatformProblem } from "@/lib/platform/types";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <div className="lab-editor-loading">Loading editor…</div>,
});

const EtchCanvas = dynamic(
  () => import("@/components/EtchCanvas").then((mod) => mod.EtchCanvas),
  {
    ssr: false,
    loading: () => <div className="etch-canvas-loading">Loading drawing canvas…</div>,
  },
);

type ProblemWorkspaceProps = {
  problem: PlatformProblem;
};

type HearState = {
  throughputTarget: string;
  allocationProfile: string;
  concurrencyModel: string;
};

export function ProblemWorkspace({ problem }: ProblemWorkspaceProps) {
  const storageKey = `gofoundry-etch-${problem.id}`;
  const preset = presetForTrack(problem.trackId);

  const [code, setCode] = useState(problem.starterCode);
  const [stage, setStage] = useState<1 | 2 | 3 | 4>(1);
  const [hear, setHear] = useState<HearState>({
    throughputTarget: problem.trackId === "lld" ? "50k ops/s" : "100k QPS",
    allocationProfile: "single-buffer",
    concurrencyModel: problem.trackId === "lld" ? "mutex" : "single-goroutine",
  });
  const [etchScene, setEtchScene] = useState<EtchScene>(() => emptyEtchScene());

  useEffect(() => {
    const stored = loadStoredEtch(storageKey);
    if (stored) setEtchScene(stored);
  }, [storageKey]);

  const hearComplete = Boolean(
    hear.throughputTarget && hear.allocationProfile && hear.concurrencyModel,
  );
  const etchComplete = etchScene.elements.length > 0;

  const anchorRows = useMemo(() => {
    if (problem.trackId === "lld") {
      return [
        ["Component boundary", "Client → service → storage with explicit sync"],
        ["Time target", problem.algorithmicSpecs.timeComplexity],
        ["Space target", problem.algorithmicSpecs.spaceComplexity],
        ["Concurrency", hear.concurrencyModel],
      ];
    }
    return [
      ["Data structure", "Staff-grade structure with explicit invariants"],
      ["Time target", problem.algorithmicSpecs.timeComplexity],
      ["Space target", problem.algorithmicSpecs.spaceComplexity],
      ["Sync choice", hear.concurrencyModel],
    ];
  }, [hear.concurrencyModel, problem]);

  const etchHelp =
    problem.trackId === "lld"
      ? "Draw clients, services, caches, pools, and goroutine boundaries before coding."
      : problem.trackId === "hld"
        ? "Draw regions, load balancers, queues, and failure domains."
        : "Sketch indices, buffers, and data movement before you implement.";

  return (
    <div className="problem-workspace">
      <header className="problem-workspace-hero panel">
        <div>
          <p className="kicker">
            {problem.trackId.toUpperCase()} · {problem.difficulty}
          </p>
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
            Validate operational parameters before the editor unlocks. Staff problems require
            explicit throughput, allocation, and concurrency choices.
          </p>
          <div className="problem-constraint-form">
            <label>
              Throughput target
              <input
                value={hear.throughputTarget}
                onChange={(event) =>
                  setHear((current) => ({ ...current, throughputTarget: event.target.value }))
                }
              />
            </label>
            <label>
              Allocation profile
              <select
                value={hear.allocationProfile}
                onChange={(event) =>
                  setHear((current) => ({ ...current, allocationProfile: event.target.value }))
                }
              >
                <option value="single-buffer">Single pre-sized buffer</option>
                <option value="dynamic">Dynamic resizing</option>
                <option value="zero-alloc">Zero heap allocations</option>
              </select>
            </label>
            <label>
              Concurrency model
              <select
                value={hear.concurrencyModel}
                onChange={(event) =>
                  setHear((current) => ({ ...current, concurrencyModel: event.target.value }))
                }
              >
                <option value="mutex">sync.Mutex</option>
                <option value="atomic">atomic.Pointer</option>
                <option value="channel">chan struct{}</option>
                <option value="single-goroutine">Single goroutine</option>
              </select>
            </label>
          </div>
          <button
            type="button"
            className="primary-btn"
            disabled={!hearComplete}
            onClick={() => setStage(2)}
          >
            Lock constraints & continue to Etch
          </button>
        </section>
      )}

      {stage === 2 && hearComplete && (
        <section className="panel problem-stage">
          <h2>Etch — Topology designer</h2>
          <p>{etchHelp}</p>
          <EtchCanvas
            storageKey={storageKey}
            preset={preset}
            onChange={setEtchScene}
            height={460}
          />
          <button
            type="button"
            className="primary-btn"
            disabled={etchScene.elements.length === 0}
            onClick={() => setStage(3)}
          >
            Commit topology → Anchor
          </button>
        </section>
      )}

      {stage === 3 && hearComplete && (
        <section className="panel problem-stage">
          {!etchComplete ? (
            <>
              <h2>Etch required</h2>
              <p>Add at least one shape on the Etch canvas before anchoring invariants.</p>
              <button type="button" className="primary-btn" onClick={() => setStage(2)}>
                Go to Etch
              </button>
            </>
          ) : (
            <>
              <h2>Anchor — Complexity & invariant matrix</h2>
              <div className="anchor-matrix">
                {anchorRows.map(([label, value]) => (
                  <Row key={label} label={label} value={value} />
                ))}
              </div>
              <button type="button" className="primary-btn" onClick={() => setStage(4)}>
                Unlock Temper editor
              </button>
            </>
          )}
        </section>
      )}

      {stage === 4 && hearComplete && etchComplete && (
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
          <DiagnosticPanel
            problemId={problem.id}
            code={code}
            etchDiagram={etchSceneToPayload(etchScene)}
            hearNotes={hear}
            anchorInvariants={{
              timeComplexity: problem.algorithmicSpecs.timeComplexity,
              spaceComplexity: problem.algorithmicSpecs.spaceComplexity,
              concurrencyModel: hear.concurrencyModel,
            }}
          />
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
