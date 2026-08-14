"use client";

import { useEffect, useMemo, useState } from "react";

type ScenarioId = "unbuffered" | "buffered" | "waitgroup" | "select";
type GoroutineStatus = "running" | "blocked" | "idle" | "done";

type Frame = {
  description: string;
  statuses: Record<string, GoroutineStatus>;
  action?: "send" | "blocked" | "receive" | "released";
  slots?: Array<string | null>;
  waitCount?: number;
  signal?: "a" | "b";
  selected?: "a" | "b";
};

type Scenario = {
  id: ScenarioId;
  title: string;
  shortTitle: string;
  summary: string;
  frames: Frame[];
};

const SCENARIOS: Record<ScenarioId, Scenario> = {
  unbuffered: {
    id: "unbuffered",
    title: "Unbuffered send and receive",
    shortTitle: "Unbuffered",
    summary:
      "A capacity-zero channel is a synchronization point: sender and receiver must meet.",
    frames: [
      {
        description:
          "G1 reaches ch <- 42. No receiver is ready yet, so the handoff cannot complete.",
        statuses: { g1: "running", g2: "idle" },
        action: "send",
      },
      {
        description:
          "G1 is parked by the runtime at the send. It stays blocked without consuming a thread.",
        statuses: { g1: "blocked", g2: "idle" },
        action: "blocked",
      },
      {
        description:
          "G2 reaches <-ch. The runtime pairs both goroutines and transfers 42 directly.",
        statuses: { g1: "blocked", g2: "running" },
        action: "receive",
      },
      {
        description:
          "The rendezvous is complete. G1 resumes after the send and G2 owns the received value.",
        statuses: { g1: "done", g2: "done" },
        action: "released",
      },
    ],
  },
  buffered: {
    id: "buffered",
    title: "Buffered channel, capacity 2",
    shortTitle: "Buffered · cap 2",
    summary:
      "Sends proceed while buffer space exists. The next send blocks once both slots are occupied.",
    frames: [
      {
        description:
          "The channel starts empty. G1 can send without waiting for G2 because capacity is available.",
        statuses: { g1: "running", g2: "idle" },
        slots: [null, null],
        action: "send",
      },
      {
        description:
          "The first value enters slot 1. G1 continues immediately; the buffer length is now 1.",
        statuses: { g1: "running", g2: "idle" },
        slots: ["1", null],
        action: "send",
      },
      {
        description:
          "The second value fills slot 2. len(ch) equals cap(ch), so no more sends can complete.",
        statuses: { g1: "running", g2: "idle" },
        slots: ["1", "2"],
        action: "send",
      },
      {
        description:
          "G1 attempts to send 3 and is parked because the capacity-2 buffer is full.",
        statuses: { g1: "blocked", g2: "idle" },
        slots: ["1", "2"],
        action: "blocked",
      },
      {
        description:
          "G2 receives 1, opening a slot. The blocked send can now proceed and G1 becomes runnable.",
        statuses: { g1: "running", g2: "running" },
        slots: ["2", "3"],
        action: "receive",
      },
    ],
  },
  waitgroup: {
    id: "waitgroup",
    title: "WaitGroup countdown latch",
    shortTitle: "WaitGroup",
    summary:
      "Wait blocks the coordinator until every worker balances its Add with a Done.",
    frames: [
      {
        description:
          "main calls Add(2) before launching workers. The WaitGroup counter starts at two.",
        statuses: { main: "running", w1: "idle", w2: "idle" },
        waitCount: 2,
      },
      {
        description:
          "main calls Wait and parks. Both workers run independently while the counter remains two.",
        statuses: { main: "blocked", w1: "running", w2: "running" },
        waitCount: 2,
      },
      {
        description:
          "Worker 1 calls Done. The counter drops to one, but main must remain blocked.",
        statuses: { main: "blocked", w1: "done", w2: "running" },
        waitCount: 1,
        action: "send",
      },
      {
        description:
          "Worker 2 calls Done. The counter reaches zero and the runtime wakes the waiter.",
        statuses: { main: "blocked", w1: "done", w2: "done" },
        waitCount: 0,
        action: "receive",
      },
      {
        description:
          "Wait returns in main. The latch is open and all coordinated work is complete.",
        statuses: { main: "done", w1: "done", w2: "done" },
        waitCount: 0,
        action: "released",
      },
    ],
  },
  select: {
    id: "select",
    title: "select channel multiplexing",
    shortTitle: "select",
    summary:
      "select parks until a case can proceed, then chooses one ready communication.",
    frames: [
      {
        description:
          "Neither channel is ready. The selecting goroutine parks across both receive cases.",
        statuses: { main: "blocked", ga: "idle", gb: "idle" },
      },
      {
        description:
          "Producer B makes channel B ready. That receive case is now eligible to run.",
        statuses: { main: "blocked", ga: "idle", gb: "running" },
        signal: "b",
      },
      {
        description:
          "select commits to channel B and resumes main. Only the chosen case body executes.",
        statuses: { main: "running", ga: "idle", gb: "done" },
        signal: "b",
        selected: "b",
        action: "receive",
      },
      {
        description:
          "The selection is complete. A later unbuffered send on A blocks until another receiver arrives.",
        statuses: { main: "done", ga: "blocked", gb: "done" },
        signal: "a",
        selected: "b",
        action: "blocked",
      },
    ],
  },
};

const SCENARIO_ORDER: ScenarioId[] = [
  "unbuffered",
  "buffered",
  "waitgroup",
  "select",
];

function VizNode({
  x,
  y,
  label,
  detail,
  status,
}: {
  x: number;
  y: number;
  label: string;
  detail: string;
  status: GoroutineStatus;
}) {
  return (
    <g
      className={`viz-node viz-node-${status}`}
      transform={`translate(${x} ${y})`}
    >
      <rect width="164" height="76" rx="13" />
      <circle cx="20" cy="20" r="5" />
      <text className="viz-node-label" x="34" y="25">
        {label}
      </text>
      <text className="viz-node-detail" x="18" y="53">
        {detail}
      </text>
      <text className="viz-node-state" x="146" y="21" textAnchor="end">
        {status}
      </text>
    </g>
  );
}

function VizArrow({
  x1,
  y1,
  x2,
  y2,
  tone = "active",
  label,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  tone?: "active" | "blocked";
  label?: string;
}) {
  return (
    <g className={`viz-arrow viz-arrow-${tone}`}>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        markerEnd={`url(#viz-arrow-${tone})`}
      />
      {label ? (
        <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 10} textAnchor="middle">
          {label}
        </text>
      ) : null}
    </g>
  );
}

function UnbufferedDiagram({ frame }: { frame: Frame }) {
  const tone = frame.action === "blocked" ? "blocked" : "active";

  return (
    <>
      <VizNode
        x={32}
        y={118}
        label="G1 · sender"
        detail="ch <- 42"
        status={frame.statuses.g1}
      />
      <g className="viz-channel viz-channel-zero" transform="translate(323 119)">
        <rect width="194" height="74" rx="37" />
        <text x="97" y="31" textAnchor="middle">
          channel ch
        </text>
        <text className="viz-channel-detail" x="97" y="51" textAnchor="middle">
          capacity 0 · rendezvous
        </text>
      </g>
      <VizNode
        x={644}
        y={118}
        label="G2 · receiver"
        detail="value := <-ch"
        status={frame.statuses.g2}
      />
      {frame.action !== "released" ? (
        <VizArrow
          x1={196}
          y1={155}
          x2={313}
          y2={155}
          tone={tone}
          label="send 42"
        />
      ) : null}
      {frame.action === "receive" ? (
        <VizArrow
          x1={527}
          y1={155}
          x2={634}
          y2={155}
          label="receive"
        />
      ) : null}
      <text className="viz-footnote" x="420" y="248" textAnchor="middle">
        no storage slot exists between sender and receiver
      </text>
    </>
  );
}

function BufferedDiagram({ frame }: { frame: Frame }) {
  const slots = frame.slots ?? [null, null];
  const tone = frame.action === "blocked" ? "blocked" : "active";

  return (
    <>
      <VizNode
        x={32}
        y={118}
        label="G1 · producer"
        detail="send next value"
        status={frame.statuses.g1}
      />
      <g className="viz-channel viz-buffer" transform="translate(293 100)">
        <text x="126" y="20" textAnchor="middle">
          channel ch · cap 2
        </text>
        {slots.map((slot, index) => (
          <g
            className={`viz-buffer-slot ${slot ? "viz-buffer-filled" : ""}`}
            key={index}
            transform={`translate(${index * 74 + 53} 39)`}
          >
            <rect width="64" height="64" rx="10" />
            <text x="32" y="39" textAnchor="middle">
              {slot ?? "empty"}
            </text>
          </g>
        ))}
      </g>
      <VizNode
        x={644}
        y={118}
        label="G2 · consumer"
        detail="value := <-ch"
        status={frame.statuses.g2}
      />
      <VizArrow
        x1={196}
        y1={155}
        x2={283}
        y2={155}
        tone={tone}
        label={frame.action === "blocked" ? "send 3" : "send"}
      />
      {frame.action === "receive" ? (
        <VizArrow
          x1={557}
          y1={155}
          x2={634}
          y2={155}
          label="recv 1"
        />
      ) : null}
      <text className="viz-footnote" x="420" y="248" textAnchor="middle">
        len {slots.filter(Boolean).length} / cap 2
      </text>
    </>
  );
}

function WaitGroupDiagram({ frame }: { frame: Frame }) {
  const released = frame.action === "released";

  return (
    <>
      <VizNode
        x={32}
        y={118}
        label="main"
        detail={released ? "Wait returned" : "wg.Wait()"}
        status={frame.statuses.main}
      />
      <g className="viz-latch" transform="translate(329 91)">
        <rect width="182" height="130" rx="18" />
        <text x="91" y="27" textAnchor="middle">
          sync.WaitGroup
        </text>
        <circle cx="91" cy="76" r="29" />
        <text className="viz-latch-count" x="91" y="85" textAnchor="middle">
          {frame.waitCount}
        </text>
        <text className="viz-channel-detail" x="91" y="117" textAnchor="middle">
          remaining
        </text>
      </g>
      <VizNode
        x={644}
        y={48}
        label="worker 1"
        detail="defer wg.Done()"
        status={frame.statuses.w1}
      />
      <VizNode
        x={644}
        y={202}
        label="worker 2"
        detail="defer wg.Done()"
        status={frame.statuses.w2}
      />
      <VizArrow
        x1={634}
        y1={86}
        x2={521}
        y2={132}
        tone={frame.statuses.w1 === "done" ? "active" : "blocked"}
        label="Done"
      />
      <VizArrow
        x1={634}
        y1={240}
        x2={521}
        y2={185}
        tone={frame.statuses.w2 === "done" ? "active" : "blocked"}
        label="Done"
      />
      {released ? (
        <VizArrow
          x1={319}
          y1={156}
          x2={206}
          y2={156}
          label="wake"
        />
      ) : null}
    </>
  );
}

function SelectDiagram({ frame }: { frame: Frame }) {
  return (
    <>
      <VizNode
        x={32}
        y={118}
        label="main"
        detail="select { A; B }"
        status={frame.statuses.main}
      />
      <g className="viz-select-hub" transform="translate(285 105)">
        <rect width="188" height="102" rx="17" />
        <text x="94" y="29" textAnchor="middle">
          select
        </text>
        <text
          className={frame.selected === "a" ? "viz-case-selected" : ""}
          x="94"
          y="57"
          textAnchor="middle"
        >
          case &lt;-A
        </text>
        <text
          className={frame.selected === "b" ? "viz-case-selected" : ""}
          x="94"
          y="82"
          textAnchor="middle"
        >
          case &lt;-B
        </text>
      </g>
      <g
        className={`viz-mini-channel ${
          frame.signal === "a" ? "viz-mini-ready" : ""
        }`}
        transform="translate(523 71)"
      >
        <rect width="86" height="42" rx="21" />
        <text x="43" y="27" textAnchor="middle">
          ch A
        </text>
      </g>
      <g
        className={`viz-mini-channel ${
          frame.signal === "b" ? "viz-mini-ready" : ""
        }`}
        transform="translate(523 211)"
      >
        <rect width="86" height="42" rx="21" />
        <text x="43" y="27" textAnchor="middle">
          ch B
        </text>
      </g>
      <VizNode
        x={644}
        y={35}
        label="G2 · producer A"
        detail="A <- alpha"
        status={frame.statuses.ga}
      />
      <VizNode
        x={644}
        y={202}
        label="G3 · producer B"
        detail="B <- beta"
        status={frame.statuses.gb}
      />
      {frame.signal === "a" ? (
        <VizArrow
          x1={634}
          y1={73}
          x2={619}
          y2={88}
          tone={frame.action === "blocked" ? "blocked" : "active"}
        />
      ) : null}
      {frame.signal === "b" ? (
        <VizArrow x1={634} y1={240} x2={619} y2={232} label="beta" />
      ) : null}
      {frame.selected ? (
        <VizArrow x1={513} y1={156} x2={483} y2={156} label="chosen" />
      ) : null}
      <text className="viz-footnote" x="420" y="294" textAnchor="middle">
        one ready case is chosen; selection is pseudo-random if several are ready
      </text>
    </>
  );
}

function ScenarioDiagram({
  scenario,
  frame,
}: {
  scenario: Scenario;
  frame: Frame;
}) {
  return (
    <svg
      className="viz-canvas"
      viewBox="0 0 840 320"
      role="img"
      aria-label={`${scenario.title}. ${frame.description}`}
    >
      <defs>
        <marker
          id="viz-arrow-active"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" />
        </marker>
        <marker
          id="viz-arrow-blocked"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" />
        </marker>
      </defs>
      <rect className="viz-canvas-bg" width="840" height="320" rx="18" />
      {scenario.id === "unbuffered" ? (
        <UnbufferedDiagram frame={frame} />
      ) : null}
      {scenario.id === "buffered" ? <BufferedDiagram frame={frame} /> : null}
      {scenario.id === "waitgroup" ? <WaitGroupDiagram frame={frame} /> : null}
      {scenario.id === "select" ? <SelectDiagram frame={frame} /> : null}
    </svg>
  );
}

export function ConcurrencyVisualizer() {
  const [scenarioId, setScenarioId] = useState<ScenarioId>("unbuffered");
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const scenario = SCENARIOS[scenarioId];
  const lastStep = scenario.frames.length - 1;
  const frame = scenario.frames[step] ?? scenario.frames[lastStep];

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(media.matches);
    updatePreference();
    media.addEventListener("change", updatePreference);
    return () => media.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    if (!reducedMotion) return;
    const timer = window.setTimeout(() => {
      setIsPlaying(false);
      setStep(lastStep);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [lastStep, reducedMotion]);

  useEffect(() => {
    if (!isPlaying || reducedMotion || step >= lastStep) return;

    const timer = window.setTimeout(() => {
      const nextStep = step + 1;
      setStep(nextStep);
      if (nextStep >= lastStep) setIsPlaying(false);
    }, 1_100);

    return () => window.clearTimeout(timer);
  }, [isPlaying, lastStep, reducedMotion, step]);

  const progress = useMemo(
    () => (lastStep === 0 ? 100 : Math.round((step / lastStep) * 100)),
    [lastStep, step],
  );

  function chooseScenario(nextId: ScenarioId) {
    const next = SCENARIOS[nextId];
    setScenarioId(nextId);
    setIsPlaying(false);
    setStep(reducedMotion ? next.frames.length - 1 : 0);
  }

  function togglePlayback() {
    if (reducedMotion) return;
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    setStep((current) => (current >= lastStep ? 0 : current));
    setIsPlaying(true);
  }

  return (
    <div className="viz-root panel">
      <div className="viz-picker" aria-label="Concurrency scenario">
        {SCENARIO_ORDER.map((id) => (
          <button
            key={id}
            type="button"
            className={`viz-picker-btn ${id === scenarioId ? "active" : ""}`}
            onClick={() => chooseScenario(id)}
            aria-pressed={id === scenarioId}
          >
            {SCENARIOS[id].shortTitle}
          </button>
        ))}
      </div>

      <div className="viz-heading">
        <div>
          <span className="type-label">Runtime timeline</span>
          <h3>{scenario.title}</h3>
        </div>
        <span className="viz-step-count">
          Step {step + 1} / {scenario.frames.length}
        </span>
      </div>
      <p className="viz-summary">{scenario.summary}</p>

      <div className="viz-stage">
        <ScenarioDiagram scenario={scenario} frame={frame} />
        <div className="viz-legend" aria-label="State legend">
          <span>
            <i className="viz-legend-running" /> running
          </span>
          <span>
            <i className="viz-legend-blocked" /> blocked
          </span>
          <span>
            <i className="viz-legend-idle" /> idle / done
          </span>
        </div>
      </div>

      <div className="viz-explanation" aria-live="polite">
        <span className="viz-explanation-index">
          {String(step + 1).padStart(2, "0")}
        </span>
        <p>{frame.description}</p>
      </div>

      <div className="viz-controls">
        <button
          type="button"
          className="secondary-btn viz-control-btn"
          onClick={() => {
            setIsPlaying(false);
            setStep((current) => Math.max(0, current - 1));
          }}
          disabled={step === 0}
        >
          ← Back
        </button>
        <button
          type="button"
          className="primary-btn viz-play-btn"
          onClick={togglePlayback}
          disabled={reducedMotion}
          title={
            reducedMotion
              ? "Auto-play is disabled by your reduced-motion preference"
              : undefined
          }
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button
          type="button"
          className="secondary-btn viz-control-btn"
          onClick={() => {
            setIsPlaying(false);
            setStep((current) => Math.min(lastStep, current + 1));
          }}
          disabled={step === lastStep}
        >
          Step →
        </button>
        <label className="viz-scrubber">
          <span className="viz-scrubber-label">
            Timeline
            <small>{progress}%</small>
          </span>
          <input
            type="range"
            min={0}
            max={lastStep}
            step={1}
            value={step}
            onChange={(event) => {
              setIsPlaying(false);
              setStep(Number(event.target.value));
            }}
            aria-label={`${scenario.title} timeline`}
          />
        </label>
      </div>

      {reducedMotion ? (
        <p className="viz-motion-note">
          Reduced motion is enabled, so auto-play is off and scenarios open on
          their final frame.
        </p>
      ) : null}
    </div>
  );
}
