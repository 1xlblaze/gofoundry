# Launch readiness checklist

Canonical production URL: **https://gofoundry-seven.vercel.app**

Verify before announcing:

```bash
curl -s https://gofoundry-seven.vercel.app/api/health | jq .
npm run test:e2e:prod
```

## Status summary (August 2026)

| Area | Beta ready | Commercial launch |
|------|------------|-----------------|
| Core routes & lessons | ✅ | ✅ |
| HEAT / Lab / problems | ✅ | ✅ |
| Dark mode, copy, quiz UX | ✅ | ✅ |
| Auth + progress sync | ✅ (needs OAuth env) | ✅ |
| Legal pages | ✅ | ✅ |
| OpenGraph / Twitter cards | ✅ | ✅ |
| Custom domain | ⚠️ use vercel.app or buy domain | **Required** |
| Stripe billing | ❌ intentionally off | Required if paid |
| Sentry / analytics | ✅ Sentry via Vercel (+ embedded DSN) | ✅ + traffic analytics |

## Custom domain

1. Buy domain (e.g. `gofoundry.dev` if available) or use Vercel Pro free-year TLD.
2. Vercel → project → Domains → add apex + `www`.
3. Set `NEXT_PUBLIC_SITE_URL=https://yourdomain` in Vercel env.
4. Update Google OAuth redirect URIs and `AUTH_URL`.

Do **not** point users to `gofoundry.vercel.app` — it is a legacy static project.

## Environment variables (production)

See `.env.example` and [DEPLOYMENT.md](./DEPLOYMENT.md).

Minimum for signed-in sync:

- `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `DATABASE_URL`, Supabase public keys
- `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_CONTACT_EMAIL`

## Observability

- **Sentry** — live on production (Vercel integration + embedded public DSN). Dashboard: https://mayank-saxena.sentry.io/projects/gofoundry/ — see [docs/SENTRY.md](docs/SENTRY.md).
- **Source maps** — confirm `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` are set in Vercel if stacks are still minified in Issues.
- **PostHog or Plausible** — optional for lesson completion, sign-in, Lab runs (privacy-friendly).
- Keep `/api/health` on uptime monitoring.

## Feedback

Footer links to GitHub Issues for beta feedback. Add Discord when community is ready.
