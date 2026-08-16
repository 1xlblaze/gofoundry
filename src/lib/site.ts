/**
 * Canonical site configuration for metadata, legal pages, and footer links.
 * Set NEXT_PUBLIC_SITE_URL in Vercel when a custom domain is attached.
 */
export const siteConfig = {
  name: "GoFoundry",
  tagline:
    "Staff-grade Go mastery — from foundations to concurrency, runtime internals, and LLD/HLD.",
  url:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://gofoundry-seven.vercel.app",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "MAYANKIDMSAXENA@GMAIL.COM",
  githubRepo: "https://github.com/1xlblaze/gofoundry",
  githubIssues: "https://github.com/1xlblaze/gofoundry/issues/new",
  betaLabel: "Launch",
  betaNote:
    "Curriculum reading stays free. Pro unlocks the full staff problem bank and advanced Temper diagnostics. Beta users who signed in before paid launch keep lesson access.",
} as const;
