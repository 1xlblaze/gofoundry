"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  BenchmarkEvent,
  DiagnosticMarker,
  DiagnosticMode,
  DiagnosticStreamEvent,
  EscapeAnalysisEvent,
  SafetyCheckEvent,
} from "@/lib/platform/types";

type DiagnosticPanelProps = {
  problemId: string;
  code: string;
  modes?: DiagnosticMode[];
  etchDiagram?: Record<string, unknown>;
  hearNotes?: Record<string, unknown>;
  anchorInvariants?: Record<string, unknown>;
  onMarkers?: (markers: DiagnosticMarker[]) => void;
  onComplete?: (events: DiagnosticStreamEvent[]) => void;
};

type PanelState = {
  running: boolean;
  events: DiagnosticStreamEvent[];
  markers: DiagnosticMarker[];
  safety: SafetyCheckEvent | null;
  benchmark: BenchmarkEvent | null;
  error: string | null;
  currentStep: string | null;
};

export function DiagnosticPanel({
  problemId,
  code,
  modes = ["correctness", "race", "leak", "bench", "escape"],
  etchDiagram,
  hearNotes,
  anchorInvariants,
  onMarkers,
  onComplete,
}: DiagnosticPanelProps) {
  const [state, setState] = useState<PanelState>({
    running: false,
    events: [],
    markers: [],
    safety: null,
    benchmark: null,
    error: null,
    currentStep: null,
  });

  const eventSourceRef = useRef<EventSource | null>(null);

  const handleEvent = useCallback(
    (event: DiagnosticStreamEvent) => {
      setState((current) => {
        const next = { ...current, events: [...current.events, event] };

        if (event.event === "PROGRESS") {
          next.currentStep = event.message;
        }
        if (event.event === "ESCAPE_ANALYSIS_READY") {
          next.markers = (event as EscapeAnalysisEvent).markers;
          onMarkers?.(next.markers);
        }
        if (event.event === "SAFETY_CHECK_RESULT") {
          next.safety = event as SafetyCheckEvent;
        }
        if (event.event === "BENCHMARK_COMPLETE") {
          next.benchmark = event as BenchmarkEvent;
        }
        if (event.event === "ERROR") {
          next.error = event.message;
        }
        if (event.event === "COMPLETE") {
          next.running = false;
          next.currentStep = null;
          onComplete?.(next.events);
        }

        return next;
      });
    },
    [onMarkers, onComplete],
  );

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  async function runDiagnostics() {
    eventSourceRef.current?.close();

    setState({
      running: true,
      events: [],
      markers: [],
      safety: null,
      benchmark: null,
      error: null,
      currentStep: "Starting diagnostic pipeline…",
    });

    try {
      const response = await fetch("/api/diagnostics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId,
          code,
          modes,
          etchDiagram,
          hearNotes,
          anchorInvariants,
        }),
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to start diagnostics");
      }

      const { streamUrl } = (await response.json()) as { streamUrl: string };
      const source = new EventSource(streamUrl);
      eventSourceRef.current = source;

      source.onmessage = (message) => {
        const event = JSON.parse(message.data) as DiagnosticStreamEvent;
        handleEvent(event);
        if (event.event === "COMPLETE") {
          source.close();
        }
      };

      source.onerror = () => {
        source.close();
        setState((current) => ({
          ...current,
          running: false,
          error: current.error ?? "Diagnostic stream disconnected",
          currentStep: null,
        }));
      };
    } catch (error) {
      setState((current) => ({
        ...current,
        running: false,
        error: error instanceof Error ? error.message : "Diagnostic run failed",
        currentStep: null,
      }));
    }
  }

  return (
    <div className="diagnostic-panel">
      <div className="diagnostic-panel-head">
        <div>
          <p className="type-label">4-Gate Verification</p>
          <h3>Staff diagnostic pipeline</h3>
        </div>
        <button
          type="button"
          className="primary-btn"
          onClick={runDiagnostics}
          disabled={state.running}
        >
          {state.running ? "Running…" : "Run diagnostics"}
        </button>
      </div>

      {state.currentStep && (
        <p className="diagnostic-progress" role="status">
          {state.currentStep}
        </p>
      )}

      <div className="diagnostic-gates">
        <GateCard
          title="Unit tests"
          status={gateStatus(state.safety, state.benchmark, "tests")}
          detail={
            state.safety
              ? `${state.safety.testsPassed} passed · ${state.safety.testsFailed} failed`
              : "Functional correctness assertions"
          }
        />
        <GateCard
          title="Race detector"
          status={gateStatus(state.safety, state.benchmark, "race")}
          detail={
            state.safety
              ? state.safety.raceDetected
                ? "DATA RACE detected"
                : "Clean under -race"
              : "go test -race"
          }
        />
        <GateCard
          title="Leak assertion"
          status={gateStatus(state.safety, state.benchmark, "leak")}
          detail={
            state.safety
              ? state.safety.leaksDetected
                ? "Goroutine leak detected"
                : "goleak.VerifyNone passed"
              : "Zero lingering goroutines"
          }
        />
        <GateCard
          title="Alloc audit"
          status={gateStatus(state.safety, state.benchmark, "bench")}
          detail={
            state.benchmark
              ? `${state.benchmark.allocsPerOp} allocs/op · ${state.benchmark.nsPerOp.toFixed(1)} ns/op`
              : "Benchmark + escape analysis"
          }
        />
      </div>

      {state.markers.length > 0 && (
        <div className="diagnostic-escape panel">
          <h4>Escape analysis markers</h4>
          <ul className="diagnostic-markers">
            {state.markers.map((marker, index) => (
              <li
                key={`${marker.line}-${marker.column}-${index}`}
                data-escaped={marker.escaped}
              >
                <span className="diagnostic-marker-loc">
                  L{marker.line}:{marker.column}
                </span>
                <span className={`diagnostic-marker-sev diagnostic-marker-${marker.severity}`}>
                  {marker.severity}
                </span>
                {marker.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {state.error && (
        <div className="diagnostic-error panel" role="alert">
          {state.error}
        </div>
      )}
    </div>
  );
}

function gateStatus(
  safety: SafetyCheckEvent | null,
  bench: BenchmarkEvent | null,
  gate: "tests" | "race" | "leak" | "bench",
): "idle" | "pass" | "fail" | "pending" {
  if (gate === "bench") {
    if (!bench) return "idle";
    return bench.passedStaffBar ? "pass" : "fail";
  }
  if (!safety) return "idle";
  if (gate === "tests") {
    if (safety.testsFailed > 0) return "fail";
    if (safety.testsPassed > 0) return "pass";
    return "pending";
  }
  if (gate === "race") return safety.raceDetected ? "fail" : "pass";
  if (gate === "leak") return safety.leaksDetected ? "fail" : "pass";
  return "idle";
}

function GateCard({
  title,
  status,
  detail,
}: {
  title: string;
  status: "idle" | "pass" | "fail" | "pending";
  detail: string;
}) {
  return (
    <div className={`diagnostic-gate diagnostic-gate-${status}`}>
      <strong>{title}</strong>
      <span>{detail}</span>
    </div>
  );
}
