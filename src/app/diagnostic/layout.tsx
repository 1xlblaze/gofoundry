import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Self-assessment",
  description: "Diagnose your Go strengths and gaps before diving into the curriculum.",
};

export default function DiagnosticLayout({ children }: { children: React.ReactNode }) {
  return children;
}
