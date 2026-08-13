import type { Metadata } from "next";
import { Bricolage_Grotesque, Figtree, JetBrains_Mono } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const body = Figtree({
  variable: "--font-body",
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
      className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="site-grid" aria-hidden />
        <div className="grain" aria-hidden />
        <div className="shell flex min-h-full flex-1 flex-col">
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-[var(--line)] px-6 py-10 text-sm text-ink-soft">
            <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="brand-mark text-base text-ink">GoFoundry</p>
              <p>Forge interview-ready Go engineers — DSA to distributed design.</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
