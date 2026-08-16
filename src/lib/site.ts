/**
 * Canonical site configuration for metadata, legal pages, and footer links.
 * Set NEXT_PUBLIC_SITE_URL in Vercel when a custom domain is attached.
 */
export const siteConfig = {
  name: "GoFoundry",
  tagline: "Staff-grade Go mastery — concurrency, runtime internals, LLD/HLD.",
  url:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://gofoundry-seven.vercel.app",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "MAYANKIDMSAXENA@GMAIL.COM",
  githubRepo: "https://github.com/1xlblaze/gofoundry",
  githubIssues: "https://github.com/1xlblaze/gofoundry/issues/new",
  betaLabel: "Public beta",
  betaNote:
    "All curriculum, Lab, HEAT canvas, and diagnostics are free during public beta. Pro billing is not live yet.",
} as const;
