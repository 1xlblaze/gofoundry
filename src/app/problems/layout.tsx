import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Practice problems",
  description: "Pattern-first practice sheet and staff-grade in-app Go problems.",
};

export default function ProblemsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
