import type { Metadata } from "next";
import { Outfit, DM_Sans, JetBrains_Mono } from "next/font/google";
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
        <AmbientBackground />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <footer className="footer">
          <div
            className="shell"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "1rem",
              justifyContent: "space-between",
              alignItems: "end",
            }}
          >
            <div>
              <p className="type-display" style={{ fontSize: "1.35rem", margin: 0 }}>
                GoFoundry
              </p>
              <p style={{ margin: "0.4rem 0 0", maxWidth: "22rem" }}>
                Think · diagram · trade off · ship — interview-ready Go.
              </p>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              HEAT method · 8 tracks
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
