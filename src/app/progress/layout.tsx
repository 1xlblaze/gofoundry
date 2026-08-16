import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/site-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Your progress",
  description: "Track completed lessons and quiz scores across the GoFoundry curriculum.",
  path: "/progress",
  noIndex: true,
});

export default function ProgressLayout({ children }: { children: React.ReactNode }) {
  return children;
}
