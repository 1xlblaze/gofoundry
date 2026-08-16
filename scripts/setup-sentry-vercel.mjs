#!/usr/bin/env node
/**
 * Configure Sentry env vars on Vercel and optionally create the Sentry project.
 *
 * Usage:
 *   SENTRY_AUTH_TOKEN=... VERCEL_TOKEN=... node scripts/setup-sentry-vercel.mjs
 *
 * Never commit tokens. Run locally or in a trusted CI secret context.
 */

const SENTRY_TOKEN = process.env.SENTRY_AUTH_TOKEN;
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_PROJECT = process.env.VERCEL_PROJECT ?? "gofoundry";
const SENTRY_ORG = process.env.SENTRY_ORG ?? "mayank-saxena";
const SENTRY_PROJECT_SLUG = process.env.SENTRY_PROJECT ?? "gofoundry";

if (!SENTRY_TOKEN) {
  console.error("Set SENTRY_AUTH_TOKEN");
  process.exit(1);
}
if (!VERCEL_TOKEN) {
  console.error("Set VERCEL_TOKEN (Vercel → Account Settings → Tokens)");
  process.exit(1);
}

async function sentry(path, options = {}) {
  const res = await fetch(`https://sentry.io/api/0${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${SENTRY_TOKEN}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(`Sentry ${path}: ${res.status} ${text}`);
  }
  return data;
}

async function ensureSentryProject() {
  const projects = await sentry(`/organizations/${SENTRY_ORG}/projects/`);
  let project = projects.find((p) => p.slug === SENTRY_PROJECT_SLUG);
  if (!project) {
    project = await sentry(`/teams/${SENTRY_ORG}/${SENTRY_ORG}/projects/`, {
      method: "POST",
      body: JSON.stringify({
        name: SENTRY_PROJECT_SLUG,
        slug: SENTRY_PROJECT_SLUG,
        platform: "javascript-nextjs",
      }),
    });
    console.log("Created Sentry project:", project.slug);
  } else {
    console.log("Sentry project exists:", project.slug);
  }

  const keys = await sentry(`/projects/${SENTRY_ORG}/${SENTRY_PROJECT_SLUG}/keys/`);
  const dsn = keys[0]?.dsn?.public;
  if (!dsn) throw new Error("No DSN returned from Sentry");
  return { dsn };
}

async function setVercelEnv(key, value, sensitive = false) {
  const res = await fetch(
    `https://api.vercel.com/v10/projects/${VERCEL_PROJECT}/env?upsert=true`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        {
          key,
          value,
          type: sensitive ? "sensitive" : "encrypted",
          target: ["production", "preview", "development"],
        },
      ]),
    },
  );
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Vercel env ${key}: ${res.status} ${text}`);
  }
  console.log(`Vercel env set: ${key}`);
}

async function triggerDeploy() {
  const res = await fetch(`https://api.vercel.com/v13/deployments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: VERCEL_PROJECT,
      project: VERCEL_PROJECT,
      target: "production",
      gitSource: {
        type: "github",
        repo: "gofoundry",
        ref: "main",
        org: "1xlblaze",
      },
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    console.warn("Deploy trigger skipped or failed:", res.status, text.slice(0, 200));
    return;
  }
  const data = JSON.parse(text);
  console.log("Production deploy triggered:", data.url ?? data.id);
}

const { dsn } = await ensureSentryProject();

await setVercelEnv("NEXT_PUBLIC_SENTRY_DSN", dsn, false);
await setVercelEnv("SENTRY_ORG", SENTRY_ORG, false);
await setVercelEnv("SENTRY_PROJECT", SENTRY_PROJECT_SLUG, false);
await setVercelEnv("SENTRY_AUTH_TOKEN", SENTRY_TOKEN, true);

console.log("\nSentry configured:");
console.log("  org:", SENTRY_ORG);
console.log("  project:", SENTRY_PROJECT_SLUG);
console.log("  dsn:", dsn);
console.log("  dashboard: https://" + SENTRY_ORG + ".sentry.io/issues/");

await triggerDeploy();
console.log("\nDone. Redeploy may take 1–2 minutes.");
