import type { NextConfig } from "next";

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
        output: "standalone",
      }),
};

export default nextConfig;
