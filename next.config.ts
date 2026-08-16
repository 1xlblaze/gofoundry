import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const repo = "gofoundry";
const isGhPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  // Vercel uses the Node server (needed for Auth.js).
  // GitHub Pages builds still opt into static export via GITHUB_PAGES=true.
  ...(isGhPages
    ? {
        output: "export" as const,
        images: { unoptimized: true },
        trailingSlash: true,
        basePath: `/${repo}`,
        assetPrefix: `/${repo}/`,
      }
    : {
        images: { unoptimized: true },
      }),
};

const sentryEnabled = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN) && !isGhPages;

export default sentryEnabled
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: !process.env.CI,
      tunnelRoute: process.env.SENTRY_TUNNEL_ROUTE ?? "/monitoring",
      widenClientFileUpload: true,
    })
  : nextConfig;
