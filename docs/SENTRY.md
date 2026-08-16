# Sentry integration

GoFoundry uses [@sentry/nextjs](https://docs.sentry.io/platforms/javascript/guides/nextjs/) for optional error monitoring and performance traces. **Nothing runs until you set a DSN** — local dev and CI builds work without a Sentry account.

## Quick start (recommended)

### 1. Create a Sentry project

1. Sign up at [sentry.io](https://sentry.io/signup/)
2. Create an organization and a **Next.js** project
3. Copy the **DSN** (Client Keys → DSN)

### 2. Automated setup (wizard)

```bash
npx @sentry/wizard@latest -i nextjs
```

The wizard logs you in, installs packages, and may overwrite config files. If you already have the repo setup, prefer **manual env vars** below.

### 3. Manual env vars (matches this repo)

**Your Sentry org:** `mayank-saxena` · **Project:** `gofoundry`  
Dashboard: https://mayank-saxena.sentry.io/projects/gofoundry/

Add to Vercel → Project → Environment Variables (Production + Preview):

| Variable | Required | Example |
|----------|----------|---------|
| `NEXT_PUBLIC_SENTRY_DSN` | Yes | `https://abc@o123.ingest.us.sentry.io/456` |
| `SENTRY_ORG` | For source maps | `your-org-slug` |
| `SENTRY_PROJECT` | For source maps | `gofoundry` |
| `SENTRY_AUTH_TOKEN` | For source maps | Create under Sentry → Settings → Auth Tokens |
| `SENTRY_TUNNEL_ROUTE` | Optional | `/monitoring` (default) — routes events through your domain |

Local `.env.local`:

```bash
NEXT_PUBLIC_SENTRY_DSN=https://...
SENTRY_ORG=your-org
SENTRY_PROJECT=gofoundry
SENTRY_AUTH_TOKEN=your-token
```

Redeploy after adding variables.

**Automated (local or Cloud Agent with tokens):**

```bash
SENTRY_AUTH_TOKEN=... VERCEL_TOKEN=... npm run setup:sentry-vercel
```

This script creates the project if missing, sets all four Vercel env vars, and triggers a production deploy.

## What gets monitored

| Runtime | File |
|---------|------|
| Browser | `src/instrumentation-client.ts` |
| Node (API routes, RSC) | `src/sentry.server.config.ts` + `src/instrumentation.ts` |
| Edge | `src/sentry.edge.config.ts` |
| React root crashes | `src/app/global-error.tsx` |

**Sample rates** (in `src/lib/sentry-options.ts`):

- Production traces: **10%** (`tracesSampleRate: 0.1`)
- Development traces: **100%**

Adjust if your Sentry quota is tight.

## Verify

1. Deploy with `NEXT_PUBLIC_SENTRY_DSN` set
2. Add a temporary test button in dev only, or visit a page that throws:

```tsx
<button type="button" onClick={() => { throw new Error("Sentry test"); }}>
  Test Sentry
</button>
```

3. Open **Sentry → Issues** — the error should appear within ~30 seconds

Do **not** test by throwing errors from the browser DevTools console — those are sandboxed and won’t reach Sentry.

## Source maps (readable stack traces)

Without `SENTRY_AUTH_TOKEN`, errors still report but stacks may be minified.

1. Sentry → Settings → Auth Tokens → Create token with `project:releases` and `org:read`
2. Add `SENTRY_AUTH_TOKEN` to Vercel (mark sensitive)
3. Set `SENTRY_ORG` and `SENTRY_PROJECT` to match your Sentry project
4. Redeploy — build logs show source map upload when `CI=true` or non-silent mode

## Ad blockers (tunnel)

Events are tunneled through `SENTRY_TUNNEL_ROUTE` (default `/monitoring`) so browser extensions are less likely to block Sentry. This adds a small amount of traffic to your Next.js server.

## GitHub Pages builds

Static export (`GITHUB_PAGES=true`) **skips** Sentry webpack wrapping so Pages builds stay simple.

## Server Actions

Wrap sensitive actions for better context:

```ts
import * as Sentry from "@sentry/nextjs";

export async function myAction(formData: FormData) {
  return Sentry.withServerActionInstrumentation("myAction", async () => {
    // ...
  });
}
```

## Cost tips

- Start with **errors only** (default) — traces at 10% in production
- Skip Session Replay until you need it (privacy + quota)
- Set [Sentry spike protection](https://docs.sentry.io/product/accounts/quotas/) and alerts

## Troubleshooting

| Problem | Fix |
|---------|-----|
| No events in Sentry | Confirm `NEXT_PUBLIC_SENTRY_DSN` on Vercel and redeploy |
| Build fails on source maps | Omit `SENTRY_AUTH_TOKEN` until token is valid |
| Events blocked in browser | Ensure tunnel route `/monitoring` is not blocked by middleware |
| Too many spans | Lower `tracesSampleRate` in `src/lib/sentry-options.ts` |
