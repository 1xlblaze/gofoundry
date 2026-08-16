import Link from "next/link";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/site-metadata";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = buildPageMetadata({
  title: "Terms of Service",
  description: "Terms for using GoFoundry during public beta.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <div className="shell legal-page">
      <article className="panel legal-doc">
        <p className="kicker">Legal</p>
        <h1>Terms of Service</h1>
        <p className="legal-updated">Last updated: 16 August 2026</p>

        <p>
          By using GoFoundry at {siteConfig.url}, you agree to these terms. If you do not agree,
          do not use the service.
        </p>

        <h2>Public beta</h2>
        <p>
          GoFoundry is offered as a <strong>public beta</strong>. Features, pricing, and availability
          may change. {siteConfig.betaNote}
        </p>

        <h2>Educational use</h2>
        <p>
          Content is for learning and interview preparation. It is not professional engineering,
          legal, or security advice. You are responsible for how you apply examples in production
          systems.
        </p>

        <h2>Accounts</h2>
        <p>
          You must provide accurate sign-in information and keep credentials secure. You are
          responsible for activity under your account.
        </p>

        <h2>Acceptable use</h2>
        <ul>
          <li>Do not abuse Lab, diagnostics, or APIs (spam, crypto mining, attacking others).</li>
          <li>Do not scrape or redistribute curriculum at scale without permission.</li>
          <li>Do not upload malicious code through sandbox or submission features.</li>
        </ul>

        <h2>User content</h2>
        <p>
          Sketches, code submissions, and feedback you submit remain yours. You grant us a license
          to store, display, and process them solely to operate and improve the platform.
        </p>

        <h2>Availability</h2>
        <p>
          We strive for reliability but do not guarantee uninterrupted access. Beta services may
          be modified or discontinued without notice.
        </p>

        <h2>Disclaimer</h2>
        <p>
          THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; WITHOUT WARRANTIES OF ANY KIND. TO THE MAXIMUM
          EXTENT PERMITTED BY LAW, WE DISCLAIM LIABILITY FOR INDIRECT OR CONSEQUENTIAL DAMAGES
          ARISING FROM USE OF THE SERVICE.
        </p>

        <h2>Contact</h2>
        <p>
          <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>
        </p>

        <p className="legal-footer-links">
          <Link href="/privacy">Privacy Policy</Link>
          {" · "}
          <Link href="/">Home</Link>
        </p>
      </article>
    </div>
  );
}
