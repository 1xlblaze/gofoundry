import type { Metadata } from "next";
import { Suspense } from "react";
import { buildPageMetadata } from "@/lib/site-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Curriculum",
  description:
    "Browse all GoFoundry tracks and lessons — HEAT method, DSA, LLD, HLD, concurrency, and Go runtime internals.",
  path: "/learn",
});

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}
