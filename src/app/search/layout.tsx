import type { Metadata } from "next";
import { Suspense } from "react";
import { buildPageMetadata } from "@/lib/site-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Search lessons",
  description: "Search the GoFoundry curriculum by topic, pattern, runtime concept, or interview keyword.",
  path: "/search",
});

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}
