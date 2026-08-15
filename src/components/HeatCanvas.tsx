"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { GoWorkbench } from "@/components/GoWorkbench";
import { DiagnosticPanel } from "@/components/DiagnosticPanel";
import { EtchErrorBoundary } from "@/components/EtchErrorBoundary";
import {
  emptyEtchScene,
  etchSceneToPayload,
  parseEtchScene,
  serializeEtchScene,
} from "@/lib/etch-diagram";

const EtchCanvas = dynamic(
  () => import("@/components/EtchCanvas").then((mod) => mod.EtchCanvas),
  {
    ssr: false,
    loading: () => <div className="etch-canvas-loading">Loading drawing canvas…</div>,
  },
);

const STORAGE_KEY = "gofoundry-heat-canvas-v2";

type HeatConstraints = {
  boundedInput: boolean;
  preserveOrder: boolean;
  mutationAllowed: boolean;
  duplicatesPossible: boolean;
  concurrencyRelevant: boolean;
};

type HeatOperational = {
  throughputTarget: string;
  allocationProfile: string;
  concurrencyModel: string;
  hearLocked: boolean;
};

type HeatDraft = {
  constraints: HeatConstraints;
  operational: HeatOperational;
  diagram: string;
  pattern: string;
  timeComplexity: string;
  spaceComplexity: string;
  code: string;
};

const CONSTRAINT_OPTIONS: {
  key: keyof HeatConstraints;
  label: string;
  detail: string;
}[] = [
  {
    key: "boundedInput",
    label: "Input bounds are known",
    detail: "Size and value ranges can shape the data structure.",
  },
  {
    key: "preserveOrder",
    label: "Output order matters",
    detail: "The result must preserve or define ordering.",
  },
  {
    key: "mutationAllowed",
    label: "Input may be mutated",
    detail: "An in-place solution is allowed.",
  },
  {
    key: "duplicatesPossible",
    label: "Duplicates are possible",
    detail: "Repeated values need explicit handling.",
  },
  {
    key: "concurrencyRelevant",
    label: "Concurrency is relevant",
    detail: "Work can overlap or requires synchronization.",
  },
];

const PATTERNS = [
  "Unselected",
  "Hash map / set",
  "Two pointers",
  "Sliding window",
  "Binary search",
  "DFS / BFS",
  "Dynamic programming",
  "Worker pool",
];

const COMPLEXITIES = ["Unknown", "O(1)", "O(log n)", "O(n)", "O(n log n)", "O(n²)"];

const STARTER_CODE = `package main

import "fmt"

func solve(nums []int) int {
\t// Temper the design here, then run it.
\treturn len(nums)
}

func main() {
\tfmt.Println(solve([]int{2, 7, 11, 15}))
}
`;

const DEFAULT_DRAFT: HeatDraft = {
  constraints: {
    boundedInput: false,
    preserveOrder: false,
    mutationAllowed: false,
    duplicatesPossible: false,
    concurrencyRelevant: false,
  },
  operational: {
    throughputTarget: "",
    allocationProfile: "",
    concurrencyModel: "",
    hearLocked: false,
  },
  diagram: `[input] -> [transform] -> [result]
               |
               v
          [edge cases]`,
  pattern: "Unselected",
  timeComplexity: "Unknown",
  spaceComplexity: "Unknown",
  code: STARTER_CODE,
};

function readStoredDraft(): HeatDraft {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DRAFT;

    const stored = JSON.parse(raw) as Partial<HeatDraft>;
    return {
      constraints: {
        ...DEFAULT_DRAFT.constraints,
        ...(stored.constraints ?? {}),
      },
      operational: {
        ...DEFAULT_DRAFT.operational,
        ...(stored.operational ?? {}),
      },
      diagram:
        typeof stored.diagram === "string" ? stored.diagram : DEFAULT_DRAFT.diagram,
      pattern:
        typeof stored.pattern === "string" && PATTERNS.includes(stored.pattern)
          ? stored.pattern
          : DEFAULT_DRAFT.pattern,
      timeComplexity:
        typeof stored.timeComplexity === "string" &&
        COMPLEXITIES.includes(stored.timeComplexity)
          ? stored.timeComplexity
          : DEFAULT_DRAFT.timeComplexity,
      spaceComplexity:
        typeof stored.spaceComplexity === "string" &&
        COMPLEXITIES.includes(stored.spaceComplexity)
          ? stored.spaceComplexity
          : DEFAULT_DRAFT.spaceComplexity,
      code: typeof stored.code === "string" ? stored.code : DEFAULT_DRAFT.code,
    };
  } catch {
    return DEFAULT_DRAFT;
  }
}

export function HeatCanvas() {
  const [draft, setDraft] = useState<HeatDraft>(DEFAULT_DRAFT);
  const [hydrated, setHydrated] = useState(false);
  const [workbenchKey, setWorkbenchKey] = useState(0);

  const editorUnlocked = draft.operational.hearLocked;
  const anchorComplete =
    draft.pattern !== "Unselected" &&
    draft.timeComplexity !== "Unknown" &&
    draft.spaceComplexity !== "Unknown";

  useEffect(() => {
    try {
      const stored = readStoredDraft();
      setDraft(stored);
    } catch {
      setDraft(DEFAULT_DRAFT);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // The canvas remains usable when storage is blocked or full.
    }
  }, [draft, hydrated]);

  if (!hydrated) {
    return (
      <div className="heat-canvas-loading panel" role="status">
        Restoring your HEAT canvas…
      </div>
    );
  }

  return (
    <div className="heat-canvas-root">
      <nav className="heat-canvas-steps panel" aria-label="HEAT canvas steps">
        {[
          ["01", "Hear", "constraints"],
          ["02", "Etch", "diagram"],
          ["03", "Anchor", "pattern"],
          ["04", "Temper", "implementation"],
        ].map(([number, label, anchor]) => (
          <a key={label} href={`#heat-${anchor}`}>
            <span>{number}</span>
            {label}
          </a>
        ))}
      </nav>

      <div className="heat-canvas-save-row">
        <span>Draft saved in this browser</span>
        <button
          type="button"
          onClick={() => {
            setDraft(DEFAULT_DRAFT);
            setWorkbenchKey((current) => current + 1);
          }}
          className="heat-canvas-reset"
        >
          Reset canvas
        </button>
      </div>

      <section
        id="heat-constraints"
        className="heat-canvas-section panel"
        aria-labelledby="heat-hear-title"
      >
        <div className="heat-canvas-section-head">
          <span className="heat-canvas-number">01</span>
          <div>
            <span className="type-label">Hear</span>
            <h2 id="heat-hear-title">Make the constraints audible</h2>
            <p>Check what the problem statement makes true before choosing a pattern.</p>
          </div>
        </div>
        <div className="heat-canvas-checklist">
          {CONSTRAINT_OPTIONS.map((option) => (
            <label key={option.key}>
              <input
                type="checkbox"
                checked={draft.constraints[option.key]}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    constraints: {
                      ...current.constraints,
                      [option.key]: event.target.checked,
                    },
                  }))
                }
              />
              <span>
                <strong>{option.label}</strong>
                <small>{option.detail}</small>
              </span>
            </label>
          ))}
        </div>
        <div className="heat-hear-operational">
          <label className="heat-canvas-field">
            <span>Throughput target</span>
            <input
              value={draft.operational.throughputTarget}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  operational: {
                    ...current.operational,
                    throughputTarget: event.target.value,
                  },
                }))
              }
              placeholder="e.g. 100k QPS"
            />
          </label>
          <label className="heat-canvas-field">
            <span>Allocation profile</span>
            <select
              value={draft.operational.allocationProfile}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  operational: {
                    ...current.operational,
                    allocationProfile: event.target.value,
                  },
                }))
              }
            >
              <option value="">Select…</option>
              <option value="single-buffer">Single pre-sized buffer</option>
              <option value="dynamic">Dynamic resizing</option>
              <option value="zero-alloc">Zero heap allocations</option>
            </select>
          </label>
          <label className="heat-canvas-field">
            <span>Concurrency model</span>
            <select
              value={draft.operational.concurrencyModel}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  operational: {
                    ...current.operational,
                    concurrencyModel: event.target.value,
                  },
                }))
              }
            >
              <option value="">Select…</option>
              <option value="mutex">sync.Mutex</option>
              <option value="atomic">atomic.Pointer</option>
              <option value="channel">chan struct{}</option>
              <option value="single-goroutine">Single goroutine</option>
            </select>
          </label>
          <button
            type="button"
            className="primary-btn"
            disabled={
              !draft.operational.throughputTarget ||
              !draft.operational.allocationProfile ||
              !draft.operational.concurrencyModel
            }
            onClick={() =>
              setDraft((current) => ({
                ...current,
                operational: { ...current.operational, hearLocked: true },
              }))
            }
          >
            {draft.operational.hearLocked
              ? "Constraints locked ✓"
              : "Lock constraints & unlock Temper"}
          </button>
        </div>
      </section>

      <section
        id="heat-diagram"
        className="heat-canvas-section panel"
        aria-labelledby="heat-etch-title"
      >
        <div className="heat-canvas-section-head">
          <span className="heat-canvas-number">02</span>
          <div>
            <span className="type-label">Etch</span>
            <h2 id="heat-etch-title">Draw the movement before the code</h2>
            <p>Use boxes, arrows, indices, queues, or goroutines. Rough is useful.</p>
          </div>
        </div>
        <EtchErrorBoundary label="HEAT drawing canvas failed to load">
          <EtchCanvas
            storageKey="gofoundry-heat-canvas-etch"
            preset="general"
            onChange={(scene) => {
              if (scene.elements.length === 0) return;
              setDraft((current) => ({
                ...current,
                diagram: serializeEtchScene(scene),
              }));
            }}
            height={420}
          />
        </EtchErrorBoundary>
      </section>

      <section
        id="heat-pattern"
        className="heat-canvas-section panel"
        aria-labelledby="heat-anchor-title"
      >
        <div className="heat-canvas-section-head">
          <span className="heat-canvas-number">03</span>
          <div>
            <span className="type-label">Anchor</span>
            <h2 id="heat-anchor-title">Commit to a pattern and its cost</h2>
            <p>Name the invariant, then state the expected time and space bounds.</p>
          </div>
        </div>
        <div className="heat-canvas-select-grid">
          <label className="heat-canvas-field">
            <span>Pattern</span>
            <select
              value={draft.pattern}
              onChange={(event) =>
                setDraft((current) => ({ ...current, pattern: event.target.value }))
              }
            >
              {PATTERNS.map((pattern) => (
                <option key={pattern}>{pattern}</option>
              ))}
            </select>
          </label>
          <label className="heat-canvas-field">
            <span>Time</span>
            <select
              value={draft.timeComplexity}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  timeComplexity: event.target.value,
                }))
              }
            >
              {COMPLEXITIES.map((complexity) => (
                <option key={complexity}>{complexity}</option>
              ))}
            </select>
          </label>
          <label className="heat-canvas-field">
            <span>Space</span>
            <select
              value={draft.spaceComplexity}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  spaceComplexity: event.target.value,
                }))
              }
            >
              {COMPLEXITIES.map((complexity) => (
                <option key={complexity}>{complexity}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section
        id="heat-implementation"
        className={`heat-canvas-section heat-canvas-temper ${!editorUnlocked || !anchorComplete ? "heat-stage-locked" : ""}`}
        aria-labelledby="heat-temper-title"
      >
        <div className="heat-canvas-section-head">
          <span className="heat-canvas-number">04</span>
          <div>
            <span className="type-label">Temper</span>
            <h2 id="heat-temper-title">Stress the idea in running Go</h2>
            <p>
              Implement the invariant, then run the 4-gate diagnostic pipeline:
              tests, -race, goleak, and alloc audit.
            </p>
          </div>
        </div>
        {!editorUnlocked && (
          <p className="heat-stage-hint">Complete Hear and lock constraints to unlock Temper.</p>
        )}
        {editorUnlocked && !anchorComplete && (
          <p className="heat-stage-hint">Select pattern and complexity in Anchor to unlock the editor.</p>
        )}
        {editorUnlocked && anchorComplete ? (
          <GoWorkbench
            key={workbenchKey}
            initialCode={draft.code}
            title="HEAT implementation"
            onCodeChange={(code) =>
              setDraft((current) => ({ ...current, code }))
            }
          />
        ) : null}
        {editorUnlocked && anchorComplete && (
          <DiagnosticPanel
            problemId="dsa-sliding-window-maximum"
            code={draft.code}
            modes={["correctness", "race", "leak", "bench", "escape"]}
            etchDiagram={etchSceneToPayload(
              parseEtchScene(draft.diagram) ?? emptyEtchScene(),
            )}
            hearNotes={{
              constraints: draft.constraints,
              operational: draft.operational,
            }}
            anchorInvariants={{
              pattern: draft.pattern,
              timeComplexity: draft.timeComplexity,
              spaceComplexity: draft.spaceComplexity,
            }}
          />
        )}
      </section>
    </div>
  );
}
