import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/site-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Practice problems",
  description:
    "Pattern-first Go practice sheet and staff-grade in-app problems with algorithmic and runtime evaluation.",
  path: "/problems",
});

export default function ProblemsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
