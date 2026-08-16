import Link from "next/link";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/site-metadata";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = buildPageMetadata({
  title: "Privacy Policy",
  description: "How GoFoundry collects, uses, and protects your information.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <div className="shell legal-page">
      <article className="panel legal-doc">
        <p className="kicker">Legal</p>
        <h1>Privacy Policy</h1>
        <p className="legal-updated">Last updated: 16 August 2026</p>

        <p>
          GoFoundry ({siteConfig.url}) is operated as an educational platform for Go engineers.
          This policy describes what we collect and why when you use the site during our public
          beta.
        </p>

        <h2>Information we collect</h2>
        <ul>
          <li>
            <strong>Account data</strong> — If you sign in (e.g. Google OAuth), we receive your
            name, email, and profile image from the identity provider to create and maintain your
            account.
          </li>
          <li>
            <strong>Learning progress</strong> — Lesson completion, quiz scores, HEAT submissions,
            and diagnostic jobs when you are signed in or when data is stored in our database.
          </li>
          <li>
            <strong>Local browser data</strong> — Guests may store progress in your browser
            (localStorage/sessionStorage) until you sign in to sync.
          </li>
          <li>
            <strong>Waitlist &amp; forms</strong> — Email and plan preference if you join the
            pricing waitlist or contact us.
          </li>
          <li>
            <strong>Technical logs</strong> — Standard server logs (IP, user agent, timestamps) for
            security and reliability.
          </li>
        </ul>

        <h2>How we use information</h2>
        <ul>
          <li>Provide lessons, Lab, HEAT canvas, and diagnostic features</li>
          <li>Sync progress across devices when you sign in</li>
          <li>Improve curriculum and fix bugs</li>
          <li>Respond to support requests and waitlist communication</li>
          <li>Process payments when paid plans launch (we do not store full card numbers)</li>
        </ul>

        <h2>Sharing</h2>
        <p>
          We use infrastructure providers (e.g. Vercel, Supabase, Google for auth, Stripe when
          billing is enabled) to run the service. We do not sell your personal information.
        </p>

        <h2>Retention &amp; deletion</h2>
        <p>
          We retain account and progress data while your account is active. You may request
          deletion by emailing{" "}
          <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>.
        </p>

        <h2>Cookies &amp; local storage</h2>
        <p>
          We use cookies for authentication sessions and local storage for guest progress, theme
          preference, and in-browser lab state.
        </p>

        <h2>Children</h2>
        <p>GoFoundry is not directed at children under 16.</p>

        <h2>Contact</h2>
        <p>
          Questions:{" "}
          <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>
        </p>

        <p className="legal-footer-links">
          <Link href="/terms">Terms of Service</Link>
          {" · "}
          <Link href="/">Home</Link>
        </p>
      </article>
    </div>
  );
}
