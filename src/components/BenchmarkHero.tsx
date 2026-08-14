"use client";

import Link from "next/link";
import { useState } from "react";
import type { BenchmarkEvent, DiagnosticStreamEvent } from "@/lib/platform/types";

const STARTER_CODE = `package dsa

func SlidingWindowMax(nums []int, k int) []int {
\tif len(nums) == 0 || k <= 0 {
\t\treturn nil
\t}
\tresult := make([]int, 0, len(nums)-k+1)
\t_ = result
\treturn nil
}
`;

type GateSummary = {
  tests: string;
  race: string;
  leak: string;
  bench: string;
};

export function BenchmarkHero() {
  const [code, setCode] = useState(STARTER_CODE);
  const [running, setRunning] = useState(false);
  const [benchmark, setBenchmark] = useState<BenchmarkEvent | null>(null);
  const [gates, setGates] = useState<GateSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runStaffDiagnostics() {
    setRunning(true);
    setError(null);
    setBenchmark(null);
    setGates(null);

    try {
      const response = await fetch("/api/diagnostics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId: "dsa-sliding-window-maximum",
          code,
          modes: ["correctness", "race", "leak", "bench"],
        }),
      });

      if (!response.ok) {
        throw new Error("Could not start diagnostic run");
      }

      const { streamUrl } = (await response.json()) as { streamUrl: string };
      const events = await collectStreamEvents(streamUrl);

      const safety = events.find((e) => e.event === "SAFETY_CHECK_RESULT");
      const bench = events.find((e) => e.event === "BENCHMARK_COMPLETE");
      const err = events.find((e) => e.event === "ERROR");

      if (safety?.event === "SAFETY_CHECK_RESULT") {
        setGates({
          tests:
            safety.testsFailed > 0
              ? `${safety.testsFailed} failed`
              : `${safety.testsPassed} passed`,
          race: safety.raceDetected ? "RACE" : "clean",
          leak: safety.leaksDetected ? "LEAK" : "clean",
          bench: bench?.event === "BENCHMARK_COMPLETE" ? "ready" : "—",
        });
      }

      if (bench?.event === "BENCHMARK_COMPLETE") {
        setBenchmark(bench);
        setGates((current) =>
          current
            ? {
                ...current,
                bench: bench.passedStaffBar
                  ? `${bench.allocsPerOp} allocs/op ✓`
                  : `${bench.allocsPerOp} allocs/op ✗`,
              }
            : null,
        );
      }

      if (err?.event === "ERROR") {
        setError(err.message);
      }
    } catch (runError) {
      setError(
        runError instanceof Error
          ? runError.message
          : "Diagnostic pipeline unavailable",
      );
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="benchmark-hero" data-motion>
      <div className="benchmark-hero-head">
        <div>
          <p className="hero-lab-kicker">Staff-grade playground</p>
          <h2>Prove zero-allocation invariants live</h2>
          <p>
            Run the 4-gate pipeline: unit tests, <code>-race</code>, goleak, and
            benchmark allocs/op — the same gates used in production interviews.
          </p>
        </div>
        <Link href="/problems/dsa-sliding-window-maximum" className="hero-lab-link">
          Full problem workspace <span aria-hidden>→</span>
        </Link>
      </div>

      <div className="benchmark-hero-grid">
        <textarea
          className="hero-lab-editor benchmark-hero-editor"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          spellCheck={false}
          rows={14}
          aria-label="Sliding window maximum Go implementation"
        />

        <div className="benchmark-hero-results">
          <button
            type="button"
            className="hero-lab-run"
            onClick={runStaffDiagnostics}
            disabled={running}
          >
            {running ? "Running 4 gates…" : "Run staff diagnostics"}
          </button>

          <div className="benchmark-hero-metrics">
            {gates ? (
              <>
                <Metric label="Tests" value={gates.tests} />
                <Metric label="Race" value={gates.race} />
                <Metric label="Leak" value={gates.leak} />
                <Metric label="Allocs" value={gates.bench} />
              </>
            ) : (
              <p className="benchmark-hero-placeholder">
                {running
                  ? "Executing go vet → test -race → benchmem…"
                  : "Submit to see ns/op, B/op, and allocs/op against the staff bar."}
              </p>
            )}
          </div>

          {benchmark && (
            <div
              className={`benchmark-hero-verdict ${benchmark.passedStaffBar ? "pass" : "fail"}`}
            >
              {benchmark.passedStaffBar
                ? `Staff bar passed: ${benchmark.allocsPerOp} allocs/op at ${benchmark.nsPerOp.toFixed(1)} ns/op`
                : `Staff violation: ${benchmark.allocsPerOp} allocs/op exceeds limit`}
            </div>
          )}

          {error && (
            <div className="benchmark-hero-error" role="alert">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="benchmark-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function collectStreamEvents(streamUrl: string): Promise<DiagnosticStreamEvent[]> {
  return new Promise((resolve, reject) => {
    const events: DiagnosticStreamEvent[] = [];
    const source = new EventSource(streamUrl);

    source.onmessage = (message) => {
      const event = JSON.parse(message.data) as DiagnosticStreamEvent;
      events.push(event);
      if (event.event === "COMPLETE") {
        source.close();
        resolve(events);
      }
    };

    source.onerror = () => {
      source.close();
      if (events.length > 0) {
        resolve(events);
      } else {
        reject(new Error("Stream disconnected"));
      }
    };
  });
}
