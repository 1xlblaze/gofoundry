import type { Metadata } from "next";
import { Outfit, DM_Sans, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import { AmbientBackground } from "@/components/AmbientBackground";
import { JsonLd } from "@/components/JsonLd";
import { SiteHeader } from "@/components/SiteHeader";
import { ThemeScript } from "@/components/ThemeScript";
import { siteConfig } from "@/lib/site";
import { indexableRobots, organizationJsonLd, siteKeywords, websiteJsonLd } from "@/lib/seo";
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
  metadataBase: new URL(siteConfig.url),
  applicationName: siteConfig.name,
  title: {
    default: "GoFoundry — The Staff-Grade Go Mastery Platform",
    template: "%s · GoFoundry",
  },
  description: siteConfig.tagline,
  keywords: [...siteKeywords],
  alternates: { canonical: siteConfig.url },
  robots: indexableRobots,
  category: "education",
  verification: {
    google: "QDmRVqT0KIdEDENus7RbVDyH8uD7nsntm6SQMbS70jk",
  },
  openGraph: {
    title: "GoFoundry — The Staff-Grade Go Mastery Platform",
    description: siteConfig.tagline,
    url: siteConfig.url,
    siteName: siteConfig.name,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "GoFoundry — The Staff-Grade Go Mastery Platform",
    description: siteConfig.tagline,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="ambient-host flex min-h-full flex-col">
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
        <ThemeScript />
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
              <p className="footer-beta-note" style={{ margin: "0.5rem 0 0", maxWidth: "24rem" }}>
                {siteConfig.betaNote}
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
              <li>
                <Link href="/privacy">Privacy</Link>
              </li>
              <li>
                <Link href="/terms">Terms</Link>
              </li>
              <li>
                <a href={siteConfig.githubIssues} rel="noopener noreferrer" target="_blank">
                  Feedback
                </a>
              </li>
              <li>
                <a href={`mailto:${siteConfig.contactEmail}`}>Contact</a>
              </li>
            </ul>
          </div>
        </footer>
      </body>
    </html>
  );
}
