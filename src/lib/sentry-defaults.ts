/**
 * Public Sentry DSN for gofoundry (mayank-saxena org).
 * Safe to commit — this is the client key, not the auth token.
 * Override with NEXT_PUBLIC_SENTRY_DSN in Vercel for multi-environment setups.
 */
export const sentryDefaults = {
  dsn: "https://bf67347680d54a01f50a3cf841783404@o4511919401074688.ingest.us.sentry.io/4511919418703872",
  org: "mayank-saxena",
  project: "gofoundry",
} as const;
