"use client";

import Link from "next/link";
import { useId, type CSSProperties } from "react";

export type MotionDiagramNode = {
  id: string;
  label: string;
  sub?: string;
  href?: string;
  accent?: string;
};

type MotionDiagramProps = {
  kicker?: string;
  title: string;
  caption?: string;
  nodes: MotionDiagramNode[];
  /** Compact row for dense pages; orbit for track maps. */
  layout?: "flow" | "orbit";
  headingLevel?: "h2" | "p";
  compact?: boolean;
};

export function MotionDiagram({
  kicker,
  title,
  caption,
  nodes,
  layout = "flow",
  headingLevel = "h2",
  compact = false,
}: MotionDiagramProps) {
  const TitleTag = headingLevel;
  const uid = useId().replace(/:/g, "");
  const classes = [
    "motion-diagram",
    `motion-diagram-${layout}`,
    compact ? "motion-diagram-compact" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <figure className={classes}>
      <figcaption className="motion-diagram-cap">
        {kicker ? <p className="type-label">{kicker}</p> : null}
        <TitleTag className={headingLevel === "p" ? "type-title" : undefined}>{title}</TitleTag>
        {caption ? <p>{caption}</p> : null}
      </figcaption>
      {layout === "orbit" ? <OrbitTrack nodes={nodes} /> : <FlowTrack nodes={nodes} uid={uid} />}
    </figure>
  );
}

function FlowTrack({ nodes, uid }: { nodes: MotionDiagramNode[]; uid: string }) {
  const width = Math.max(640, nodes.length * 168);
  const y = 78;
  const startX = 72;
  const step = nodes.length > 1 ? (width - 144) / (nodes.length - 1) : 0;

  return (
    <div className="motion-diagram-canvas">
      <svg
        viewBox={`0 0 ${width} 168`}
        className="motion-diagram-svg"
        role="img"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`${uid}-flow`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0f766e" />
            <stop offset="55%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>
        </defs>
        <path
          className="motion-diagram-path"
          d={`M ${startX} ${y} H ${width - 72}`}
          fill="none"
          stroke={`url(#${uid}-flow)`}
          strokeWidth="3"
          strokeLinecap="round"
        />
        {nodes.map((node, index) => {
          const x = startX + step * index;
          return (
            <g key={node.id} className="motion-diagram-pulse" style={{ animationDelay: `${index * 0.28}s` }}>
              <circle cx={x} cy={y} r="22" fill="white" stroke={node.accent ?? "#0f766e"} strokeWidth="3" />
              <text
                x={x}
                y={y + 5}
                textAnchor="middle"
                fontSize="13"
                fontWeight="800"
                fill="#0b1220"
              >
                {String(index + 1).padStart(2, "0")}
              </text>
            </g>
          );
        })}
      </svg>
      <ol className="motion-diagram-nodes">
        {nodes.map((node) => (
          <li key={node.id}>
            <DiagramNode node={node} />
          </li>
        ))}
      </ol>
    </div>
  );
}

function OrbitTrack({ nodes }: { nodes: MotionDiagramNode[] }) {
  const cols = 4;
  const rows = Math.ceil(nodes.length / cols);
  const width = 720;
  const height = 88 + rows * 108;

  return (
    <div className="motion-diagram-canvas">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="motion-diagram-svg motion-diagram-svg-orbit"
        role="img"
        aria-hidden="true"
      >
        <path
          className="motion-diagram-path"
          d="M 70 70 C 180 20, 280 130, 390 70 S 600 20, 650 80 S 520 200, 360 190 S 80 220, 80 120"
          fill="none"
          stroke="#0f766e"
          strokeWidth="2.5"
          opacity="0.45"
        />
      </svg>
      <ol
        className="motion-diagram-orbit"
        style={{ "--orbit-cols": cols } as CSSProperties}
      >
        {nodes.map((node) => (
          <li key={node.id}>
            <DiagramNode node={node} />
          </li>
        ))}
      </ol>
    </div>
  );
}

function DiagramNode({ node }: { node: MotionDiagramNode }) {
  const style = node.accent
    ? ({ "--node-accent": node.accent } as CSSProperties)
    : undefined;
  const inner = (
    <>
      <strong>{node.label}</strong>
      {node.sub ? <span>{node.sub}</span> : null}
    </>
  );

  if (node.href) {
    return (
      <Link href={node.href} className="motion-diagram-node" style={style}>
        {inner}
      </Link>
    );
  }

  return (
    <div className="motion-diagram-node" style={style}>
      {inner}
    </div>
  );
}

export const learningLoopNodes: MotionDiagramNode[] = [
  { id: "read", label: "Read", sub: "Curriculum", href: "/learn", accent: "#0f766e" },
  { id: "diagram", label: "Diagram", sub: "HEAT canvas", href: "/heat", accent: "#2563eb" },
  { id: "prove", label: "Prove", sub: "Go Lab", href: "/lab", accent: "#d97706" },
  { id: "recall", label: "Recall", sub: "Practice", href: "/problems", accent: "#ea580c" },
];

export const heatFlowNodes: MotionDiagramNode[] = [
  { id: "h", label: "Hear", sub: "Constraints & Go costs", href: "/heat#heat-constraints", accent: "#0f766e" },
  { id: "e", label: "Etch", sub: "Architecture sketch", href: "/heat#heat-diagram", accent: "#2563eb" },
  { id: "a", label: "Anchor", sub: "Pattern + complexity", href: "/heat#heat-pattern", accent: "#d97706" },
  { id: "t", label: "Temper", sub: "Idiomatic Go + proof", href: "/heat#heat-implementation", accent: "#ea580c" },
];

export const diagnosticGateNodes: MotionDiagramNode[] = [
  { id: "tests", label: "Tests", sub: "Correctness", href: "/problems", accent: "#0f766e" },
  { id: "race", label: "Race", sub: "go test -race", href: "/lab", accent: "#2563eb" },
  { id: "leak", label: "Leak", sub: "goleak", href: "/lab", accent: "#d97706" },
  { id: "bench", label: "Bench", sub: "allocs/op bar", href: "/problems", accent: "#ea580c" },
];

export const labPathNodes: MotionDiagramNode[] = [
  { id: "see", label: "See", sub: "Concurrency timeline", href: "#visualizer-title", accent: "#0f766e" },
  { id: "change", label: "Change", sub: "Worker pool", href: "#workbench-title", accent: "#2563eb" },
  { id: "alloc", label: "Allocate", sub: "Escape traces", href: "#escape-title", accent: "#d97706" },
  { id: "prove", label: "Prove", sub: "Staff problems", href: "/problems", accent: "#ea580c" },
];
