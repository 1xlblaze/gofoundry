import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Curriculum",
  description: "Browse all GoFoundry tracks and lessons — HEAT method, DSA, LLD, HLD, and more.",
};

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return children;
}
