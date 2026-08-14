"use client";

import type { ReactNode } from "react";
import type { DiagramKind } from "@/content/types";

type Props = {
  kind: DiagramKind;
  title?: string;
  caption?: string;
};

const ink = "#0c1a1f";
const signal = "#0f766e";
const foam = "#f4fbf9";
const soft = "#5b6b73";
const ember = "#c2410c";
const line = "#94a3a8";

function Frame({
  title,
  caption,
  children,
  viewBox = "0 0 640 320",
}: {
  title?: string;
  caption?: string;
  children: ReactNode;
  viewBox?: string;
}) {
  return (
    <figure className="diagram-frame">
      {(title || caption) && (
        <figcaption className="diagram-cap">
          {title && <span className="diagram-title">{title}</span>}
          {caption && <span className="diagram-sub">{caption}</span>}
        </figcaption>
      )}
      <div className="diagram-canvas">
        <svg viewBox={viewBox} className="h-auto w-full" role="img">
          {children}
        </svg>
      </div>
      <p className="diagram-hint">draw.io–style model · redraw from memory before coding</p>
    </figure>
  );
}

function NodeBox({
  x,
  y,
  w,
  h,
  label,
  sub,
  fill = foam,
  stroke = ink,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  sub?: string;
  fill?: string;
  stroke?: string;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx="10"
        fill={fill}
        stroke={stroke}
        strokeWidth="2"
      />
      <text
        x={x + w / 2}
        y={y + (sub ? h / 2 - 4 : h / 2 + 5)}
        textAnchor="middle"
        fontFamily="var(--font-display), sans-serif"
        fontSize="14"
        fontWeight="700"
        fill={ink}
      >
        {label}
      </text>
      {sub && (
        <text
          x={x + w / 2}
          y={y + h / 2 + 14}
          textAnchor="middle"
          fontFamily="var(--font-mono), monospace"
          fontSize="11"
          fill={soft}
        >
          {sub}
        </text>
      )}
    </g>
  );
}

function Arrow({
  x1,
  y1,
  x2,
  y2,
  color = signal,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
}) {
  const id = `arr-${x1}-${y1}-${x2}-${y2}`;
  return (
    <g>
      <defs>
        <marker
          id={id}
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L6,3 L0,6 Z" fill={color} />
        </marker>
      </defs>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth="2.5"
        markerEnd={`url(#${id})`}
      />
    </g>
  );
}

function HeatCycle() {
  const steps = [
    { t: "H", n: "Hear", d: "Clarify · constraints · Go costs" },
    { t: "E", n: "Etch", d: "Diagram state & flow" },
    { t: "A", n: "Anchor", d: "Pattern + complexity" },
    { t: "T", n: "Temper", d: "Idiomatic Go + proof" },
  ];
  return (
    <Frame title="Foundry HEAT" caption="Unique GoFoundry operating system">
      <rect width="640" height="320" fill="#ecf5f3" />
      {steps.map((s, i) => {
        const x = 36 + i * 150;
        return (
          <g key={s.t}>
            <circle cx={x + 50} cy={110} r="42" fill={ink} />
            <text
              x={x + 50}
              y={118}
              textAnchor="middle"
              fill="#f4fbf9"
              fontSize="28"
              fontFamily="var(--font-display), sans-serif"
              fontWeight="800"
            >
              {s.t}
            </text>
            <text
              x={x + 50}
              y={180}
              textAnchor="middle"
              fill={ink}
              fontSize="18"
              fontFamily="var(--font-display), sans-serif"
              fontWeight="700"
            >
              {s.n}
            </text>
            <text
              x={x + 50}
              y={204}
              textAnchor="middle"
              fill={soft}
              fontSize="11"
              fontFamily="var(--font-body), sans-serif"
            >
              {s.d}
            </text>
            {i < 3 && <Arrow x1={x + 98} y1={110} x2={x + 140} y2={110} />}
          </g>
        );
      })}
      <text
        x="320"
        y="270"
        textAnchor="middle"
        fill={signal}
        fontSize="13"
        fontFamily="var(--font-mono), monospace"
      >
        loop until edge cases die
      </text>
    </Frame>
  );
}

function TwoPointers() {
  return (
    <Frame title="Two pointers" caption="Same array · left / right converge">
      <rect width="640" height="320" fill="#ecf5f3" />
      {[10, 20, 30, 40, 50, 60].map((v, i) => (
        <g key={v}>
          <rect
            x={70 + i * 85}
            y={120}
            width="70"
            height="70"
            rx="8"
            fill={foam}
            stroke={ink}
            strokeWidth="2"
          />
          <text
            x={105 + i * 85}
            y={162}
            textAnchor="middle"
            fontSize="18"
            fontFamily="var(--font-mono), monospace"
            fill={ink}
          >
            {v}
          </text>
        </g>
      ))}
      <text x="105" y="100" textAnchor="middle" fill={signal} fontSize="13" fontWeight="700">
        L
      </text>
      <text x="530" y="100" textAnchor="middle" fill={ember} fontSize="13" fontWeight="700">
        R
      </text>
      <Arrow x1={105} y1={210} x2={190} y2={210} />
      <Arrow x1={530} y1={210} x2={445} y2={210} color={ember} />
      <text x="320" y="270" textAnchor="middle" fill={soft} fontSize="12">
        move the pointer that fixes the invariant
      </text>
    </Frame>
  );
}

function SlidingWindow() {
  return (
    <Frame title="Sliding window" caption="Expand right · shrink left while invalid">
      <rect width="640" height="320" fill="#ecf5f3" />
      {"ABCDEB".split("").map((c, i) => (
        <g key={i}>
          <rect
            x={60 + i * 90}
            y={130}
            width="70"
            height="70"
            rx="8"
            fill={i >= 1 && i <= 4 ? "#ccfbf1" : foam}
            stroke={i >= 1 && i <= 4 ? signal : ink}
            strokeWidth="2"
          />
          <text
            x={95 + i * 90}
            y={172}
            textAnchor="middle"
            fontSize="20"
            fontFamily="var(--font-mono), monospace"
            fill={ink}
          >
            {c}
          </text>
        </g>
      ))}
      <rect
        x="145"
        y="115"
        width="355"
        height="100"
        rx="12"
        fill="none"
        stroke={signal}
        strokeWidth="3"
        strokeDasharray="6 6"
      />
      <text x="320" y="90" textAnchor="middle" fill={signal} fontSize="13" fontWeight="700">
        window = valid substring
      </text>
    </Frame>
  );
}

function LinkedListReverse() {
  return (
    <Frame title="Reverse list" caption="prev · curr · next rewiring">
      <rect width="640" height="320" fill="#ecf5f3" />
      {[
        { x: 80, l: "1" },
        { x: 230, l: "2" },
        { x: 380, l: "3" },
        { x: 530, l: "∅" },
      ].map((n) => (
        <g key={n.x}>
          <rect
            x={n.x}
            y={130}
            width="90"
            height="54"
            rx="8"
            fill={foam}
            stroke={ink}
            strokeWidth="2"
          />
          <text
            x={n.x + 45}
            y={163}
            textAnchor="middle"
            fontSize="18"
            fontFamily="var(--font-mono), monospace"
            fill={ink}
          >
            {n.l}
          </text>
        </g>
      ))}
      <Arrow x1={170} y1={157} x2={225} y2={157} />
      <Arrow x1={320} y1={157} x2={375} y2={157} />
      <Arrow x1={470} y1={157} x2={525} y2={157} />
      <text x="125" y="110" textAnchor="middle" fill={ember} fontSize="12" fontWeight="700">
        prev
      </text>
      <text x="275" y="110" textAnchor="middle" fill={signal} fontSize="12" fontWeight="700">
        curr
      </text>
      <text x="425" y="110" textAnchor="middle" fill={soft} fontSize="12" fontWeight="700">
        next
      </text>
      <path
        d="M275 200 C275 250, 125 250, 125 200"
        fill="none"
        stroke={ember}
        strokeWidth="2"
        strokeDasharray="5 5"
      />
      <text x="200" y="275" textAnchor="middle" fill={soft} fontSize="12">
        curr.Next = prev · advance trio
      </text>
    </Frame>
  );
}

function BfsLevels() {
  return (
    <Frame title="BFS layers" caption="Queue owns the frontier">
      <rect width="640" height="320" fill="#ecf5f3" />
      <NodeBox x={270} y={30} w={100} h={48} label="A" sub="level 0" />
      <NodeBox x={140} y={120} w={100} h={48} label="B" sub="level 1" />
      <NodeBox x={400} y={120} w={100} h={48} label="C" sub="level 1" />
      <NodeBox x={70} y={220} w={90} h={44} label="D" />
      <NodeBox x={190} y={220} w={90} h={44} label="E" />
      <NodeBox x={400} y={220} w={90} h={44} label="F" />
      <Arrow x1={300} y1={78} x2={210} y2={120} />
      <Arrow x1={340} y1={78} x2={430} y2={120} />
      <Arrow x1={170} y1={168} x2={130} y2={220} />
      <Arrow x1={210} y1={168} x2={230} y2={220} />
      <Arrow x1={450} y1={168} x2={440} y2={220} />
    </Frame>
  );
}

function TreeDfs() {
  return (
    <Frame title="DFS recursion tree" caption="Pre / in / post = when you visit">
      <rect width="640" height="320" fill="#ecf5f3" />
      <NodeBox x={270} y={24} w={100} h={44} label="root" />
      <NodeBox x={120} y={120} w={100} h={44} label="left" />
      <NodeBox x={420} y={120} w={100} h={44} label="right" />
      <NodeBox x={60} y={220} w={90} h={40} label="L" />
      <NodeBox x={190} y={220} w={90} h={40} label="R" />
      <Arrow x1={300} y1={68} x2={190} y2={120} />
      <Arrow x1={340} y1={68} x2={450} y2={120} />
      <Arrow x1={150} y1={164} x2={120} y2={220} />
      <Arrow x1={190} y1={164} x2={220} y2={220} />
      <text x="520" y={60} fill={soft} fontSize="12" fontFamily="var(--font-mono), monospace">
        pre: N L R
      </text>
      <text x="520" y={82} fill={soft} fontSize="12" fontFamily="var(--font-mono), monospace">
        in: L N R
      </text>
      <text x="520" y={104} fill={soft} fontSize="12" fontFamily="var(--font-mono), monospace">
        post: L R N
      </text>
    </Frame>
  );
}

function HeapShape() {
  return (
    <Frame title="Binary heap" caption="Array layout · parent i → 2i+1, 2i+2">
      <rect width="640" height="320" fill="#ecf5f3" />
      <NodeBox x={280} y={20} w={80} h={40} label="0" fill="#ccfbf1" />
      <NodeBox x={160} y={100} w={80} h={40} label="1" />
      <NodeBox x={400} y={100} w={80} h={40} label="2" />
      <NodeBox x={90} y={190} w={70} h={36} label="3" />
      <NodeBox x={200} y={190} w={70} h={36} label="4" />
      <NodeBox x={370} y={190} w={70} h={36} label="5" />
      <NodeBox x={480} y={190} w={70} h={36} label="6" />
      <Arrow x1={310} y1={60} x2={220} y2={100} />
      <Arrow x1={330} y1={60} x2={420} y2={100} />
      <Arrow x1={180} y1={140} x2={140} y2={190} />
      <Arrow x1={220} y1={140} x2={230} y2={190} />
      <Arrow x1={420} y1={140} x2={400} y2={190} />
      <Arrow x1={460} y1={140} x2={500} y2={190} />
      <text x="320" y="280" textAnchor="middle" fill={soft} fontSize="12">
        index array: [0,1,2,3,4,5,6]
      </text>
    </Frame>
  );
}

function TokenBucket() {
  return (
    <Frame title="Token bucket" caption="Refill rate · capacity · Allow()">
      <rect width="640" height="320" fill="#ecf5f3" />
      <NodeBox x={60} y={100} w={140} h={70} label="Refill" sub="r tokens/sec" />
      <NodeBox x={250} y={80} w={160} h={110} label="Bucket" sub="tokens ≤ capacity" fill="#ccfbf1" />
      <NodeBox x={460} y={100} w={140} h={70} label="Request" sub="costs 1 token" />
      <Arrow x1={200} y1={135} x2={245} y2={135} />
      <Arrow x1={410} y1={135} x2={455} y2={135} />
      <text x="320" y="250" textAnchor="middle" fill={soft} fontSize="12">
        burst ≤ capacity · reject when tokens &lt; 1
      </text>
    </Frame>
  );
}

function Outbox() {
  return (
    <Frame title="Transactional outbox" caption="DB txn then async publish">
      <rect width="640" height="320" fill="#ecf5f3" />
      <NodeBox x={40} y={110} w={120} h={60} label="API" />
      <NodeBox x={200} y={80} w={160} h={120} label="DB txn" sub="row + outbox" fill="#ccfbf1" />
      <NodeBox x={400} y={40} w={180} h={60} label="Publisher" sub="relay worker" />
      <NodeBox x={400} y={160} w={180} h={60} label="Broker" sub="Kafka / SQS" />
      <Arrow x1={160} y1={140} x2={195} y2={140} />
      <Arrow x1={360} y1={110} x2={395} y2={80} />
      <Arrow x1={490} y1={100} x2={490} y2={155} />
    </Frame>
  );
}

function GpmScheduler() {
  return (
    <Frame title="G · M · P" caption="Go scheduler triad">
      <rect width="640" height="320" fill="#ecf5f3" />
      <NodeBox x={40} y={120} w={100} h={70} label="G" sub="goroutine" />
      <NodeBox x={200} y={120} w={100} h={70} label="P" sub="logical proc" fill="#ccfbf1" />
      <NodeBox x={360} y={120} w={100} h={70} label="M" sub="OS thread" />
      <NodeBox x={500} y={120} w={110} h={70} label="CPU" sub="hardware" />
      <Arrow x1={140} y1={155} x2={195} y2={155} />
      <Arrow x1={300} y1={155} x2={355} y2={155} />
      <Arrow x1={460} y1={155} x2={495} y2={155} />
      <text x="320" y="250" textAnchor="middle" fill={soft} fontSize="12">
        M must hold a P to run Go code
      </text>
    </Frame>
  );
}

function HashMapBuckets() {
  return (
    <Frame title="Map buckets" caption="hash → bucket · overflow chain">
      <rect width="640" height="320" fill="#ecf5f3" />
      <NodeBox x={40} y={120} w={110} h={60} label="key" sub="hash()" />
      <NodeBox x={200} y={40} w={120} h={50} label="bkt 0" />
      <NodeBox x={200} y={120} w={120} h={50} label="bkt 1" fill="#ccfbf1" />
      <NodeBox x={200} y={200} w={120} h={50} label="bkt 2" />
      <NodeBox x={380} y={120} w={120} h={50} label="overflow" sub="chain" />
      <NodeBox x={540} y={120} w={70} h={50} label="…" />
      <Arrow x1={150} y1={150} x2={195} y2={145} />
      <Arrow x1={320} y1={145} x2={375} y2={145} />
      <Arrow x1={500} y1={145} x2={535} y2={145} />
    </Frame>
  );
}

export function Diagram({ kind, title, caption }: Props) {
  switch (kind) {
    case "heat-cycle":
      return <HeatCycle />;
    case "two-pointers":
      return <TwoPointers />;
    case "sliding-window":
      return <SlidingWindow />;
    case "linked-list-reverse":
      return <LinkedListReverse />;
    case "bfs-levels":
      return <BfsLevels />;
    case "tree-dfs":
      return <TreeDfs />;
    case "heap-shape":
      return <HeapShape />;
    case "token-bucket":
      return <TokenBucket />;
    case "outbox":
      return <Outbox />;
    case "gpm-scheduler":
      return <GpmScheduler />;
    case "hash-map-buckets":
      return <HashMapBuckets />;
    default:
      return null;
  }
}
