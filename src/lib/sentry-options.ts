import type { BrowserOptions, EdgeOptions, NodeOptions } from "@sentry/nextjs";
import { sentryDefaults } from "@/lib/sentry-defaults";

export function getSentryDsn() {
  return process.env.NEXT_PUBLIC_SENTRY_DSN ?? sentryDefaults.dsn;
}

export function isSentryEnabled() {
  return Boolean(getSentryDsn());
}

export function getSentryEnvironment() {
  return process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development";
}

function baseOptions(): Pick<BrowserOptions, "dsn" | "environment" | "tracesSampleRate"> {
  return {
    dsn: getSentryDsn(),
    environment: getSentryEnvironment(),
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  };
}

export function getBrowserSentryOptions(): BrowserOptions | null {
  if (!isSentryEnabled()) return null;
  return {
    ...baseOptions(),
  };
}

export function getServerSentryOptions(): NodeOptions | null {
  if (!isSentryEnabled()) return null;
  return baseOptions();
}

export function getEdgeSentryOptions(): EdgeOptions | null {
  if (!isSentryEnabled()) return null;
  return baseOptions();
}
