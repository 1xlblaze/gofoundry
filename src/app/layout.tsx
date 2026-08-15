import type { Metadata } from "next";
import { Outfit, DM_Sans, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import { AmbientBackground } from "@/components/AmbientBackground";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const display = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const body = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "GoFoundry — The Staff-Grade Go Mastery Platform",
    template: "%s · GoFoundry",
  },
  description:
    "Master Go concurrency, runtime internals, zero-allocation performance, and cloud-native design with the HEAT method, interactive Lab, and focused practice.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="ambient-host flex min-h-full flex-col">
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <AmbientBackground />
        <SiteHeader />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <footer className="footer">
          <div
            className="shell"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "1.25rem",
              justifyContent: "space-between",
              alignItems: "end",
            }}
          >
            <div>
              <p className="type-display" style={{ fontSize: "1.35rem", margin: 0 }}>
                GoFoundry
              </p>
              <p style={{ margin: "0.4rem 0 0", maxWidth: "22rem" }}>
                Hear → Etch → Anchor → Temper — staff-grade Go.
              </p>
            </div>
            <ul className="footer-links">
              <li>
                <Link href="/learn">Hear</Link>
              </li>
              <li>
                <Link href="/heat">Etch</Link>
              </li>
              <li>
                <Link href="/problems">Anchor</Link>
              </li>
              <li>
                <Link href="/lab">Temper</Link>
              </li>
              <li>
                <Link href="/pricing">Pricing</Link>
              </li>
              <li>
                <Link href="/login">Sign in</Link>
              </li>
            </ul>
          </div>
        </footer>
      </body>
    </html>
  );
}
