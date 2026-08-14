import type { Metadata } from "next";
import { Syne, Literata, JetBrains_Mono, Manrope } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const display = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const body = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const serif = Literata({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "GoFoundry — Go DSA, Internals, LLD & HLD",
    template: "%s · GoFoundry",
  },
  description:
    "Complete Golang curriculum: data structures & algorithms, language concepts, runtime internals, low-level design, and high-level system design — with quizzes and progress tracking.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${serif.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <div className="site-grid" aria-hidden />
        <div className="grain" aria-hidden />
        <div className="shell flex min-h-full flex-1 flex-col">
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-[var(--line)] px-6 py-12">
            <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <p className="brand-mark text-2xl text-ink">GoFoundry</p>
              <p className="max-w-sm text-sm leading-relaxed text-ink-soft">
                Interview-ready Go — algorithms through distributed design.
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
