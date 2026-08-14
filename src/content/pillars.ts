import type { TrackId } from "./types";

export type Pillar = {
  id: string;
  title: string;
  tagline: string;
  focusAreas: string[];
  trackIds: TrackId[];
  accent: string;
  href: string;
};

export const pillars: Pillar[] = [
  {
    id: "concurrency",
    title: "Concurrency & Parallelism",
    tagline: "Design goroutine systems you can reason about under pressure.",
    focusAreas: ["Worker pools", "Pipelines", "Fan-in / fan-out", "Context", "Leak prevention"],
    trackIds: ["concepts", "internals"],
    accent: "#0f766e",
    href: "/lesson/concurrency-goroutines",
  },
  {
    id: "runtime",
    title: "Runtime Internals & Performance",
    tagline: "Connect runtime mechanics to latency, throughput, and allocation decisions.",
    focusAreas: ["GMP scheduler", "Garbage collection", "Slices & maps", "Escape analysis", "sync.Pool"],
    trackIds: ["internals"],
    accent: "#2563eb",
    href: "/lesson/scheduler-gpm",
  },
  {
    id: "low-level-design",
    title: "Low-Level Design",
    tagline: "Build production primitives with explicit invariants and trade-offs.",
    focusAreas: ["Caches", "Rate limiters", "Connection pools", "Circuit breakers"],
    trackIds: ["lld"],
    accent: "#d97706",
    href: "/track/lld",
  },
  {
    id: "cloud-native-hld",
    title: "Cloud-Native HLD in Go",
    tagline: "Defend distributed Go architectures from API edge to storage.",
    focusAreas: ["Chat", "Feeds", "Payments", "Streaming"],
    trackIds: ["hld"],
    accent: "#7c3aed",
    href: "/track/hld",
  },
];
