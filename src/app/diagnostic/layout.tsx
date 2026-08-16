import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/site-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Self-assessment",
  description: "Diagnose your Go strengths and gaps before diving into the GoFoundry curriculum.",
  path: "/diagnostic",
});

export default function DiagnosticLayout({ children }: { children: React.ReactNode }) {
  return children;
}
