import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your progress",
  description: "Track completed lessons and quiz scores across the GoFoundry curriculum.",
};

export default function ProgressLayout({ children }: { children: React.ReactNode }) {
  return children;
}
