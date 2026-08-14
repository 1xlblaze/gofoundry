# GoFoundry deployment guide

Production stack: **Vercel** (Next.js) + **Supabase** (PostgreSQL + waitlist) + optional **sandbox worker** + optional **Redis**.

Everything except live Stripe billing is free-tier friendly.

## 1. Supabase database (`DATABASE_URL`)

Your project: `kqolyvmwcsqilnakuewt` (ap-south-1).

### Get the connection string

1. Open [Supabase Dashboard](https://supabase.com/dashboard/project/kqolyvmwcsqilnakuewt/settings/database)
2. **Settings → Database → Connection string**
3. Choose **URI** mode
4. For Vercel serverless, use the **Transaction pooler** (port **6543**), not the direct connection (5432)

Example format:

```
postgresql://postgres.kqolyvmwcsqilnakuewt:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

Replace `[YOUR-PASSWORD]` with the database password from the same page (reset it if you do not have it).

### Add to Vercel

1. [Vercel project env vars](https://vercel.com/mayankidmsaxena-6404s-projects/gofoundry/settings/environment-variables)
2. Add `DATABASE_URL` for **Production**, **Preview**, and **Development**
3. Redeploy (or push to `main`)

### Verify

```bash
curl https://gofoundry-seven.vercel.app/api/health
```

Expect `"overall": "fully_connected"` and `"database": { "configured": true, "status": "ok" }`.

### Run migrations + seed problems

After `DATABASE_URL` is set and redeployed:

```bash
SETUP_SECRET=<your-vercel-setup-secret> \
SITE_URL=https://gofoundry-seven.vercel.app \
node scripts/deploy-setup.mjs
```

This applies the platform schema and seeds all 25 in-app problems.

Or seed locally:

```bash
DATABASE_URL='postgresql://...' npx tsx scripts/seed-problems.mjs
```

---

## 2. Free Redis (Upstash)

Vercel cannot run Redis locally. Use **Upstash Redis** (free tier: 10k commands/day).

1. Create an account at [upstash.com](https://upstash.com)
2. **Create Redis database** → region close to your Vercel deployment
3. Copy **REST URL** and **REST TOKEN** from the database details page
4. Add to Vercel:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

Alternatively, use the TCP URL as `REDIS_URL` (`rediss://...`) for Docker/local worker clusters.

Without Redis env vars, diagnostics still work — the app falls back to an in-memory queue (fine for low traffic; not durable across serverless instances).

---

## 3. Free sandbox worker (Go diagnostics)

Vercel serverless cannot run `go test`, `-race`, or escape analysis. Deploy the `worker/` service separately.

### Option A — Render (simplest free tier)

1. Fork/push this repo to GitHub
2. [render.com](https://render.com) → **New → Web Service**
3. Connect `gofoundry`, set:
   - **Root directory**: `.`
   - **Dockerfile path**: `deploy/Dockerfile.worker`
   - **Instance type**: Free (spins down after idle; cold starts ~30s)
4. Copy the public URL (e.g. `https://gofoundry-worker.onrender.com`)
5. Add to Vercel: `SANDBOX_WORKER_URL=https://gofoundry-worker.onrender.com`

Or use the included `render.yaml` blueprint:

```bash
# In Render dashboard: New → Blueprint → point at this repo
```

### Option B — Fly.io

```bash
fly launch --dockerfile deploy/Dockerfile.worker --name gofoundry-worker
fly secrets set SANDBOX_WORKER_PORT=8081
fly deploy
```

Set `SANDBOX_WORKER_URL=https://gofoundry-worker.fly.dev` on Vercel.

### Option C — Railway

1. New project → deploy from GitHub
2. Service: Docker, `deploy/Dockerfile.worker`
3. Expose port 8081
4. Set `SANDBOX_WORKER_URL` on Vercel

### Local development

```bash
make worker-run          # or: cd worker && go run .
docker-compose up worker   # full stack with postgres + redis
```

Set `SANDBOX_WORKER_URL=http://localhost:8081` in `.env.local`.

---

## 4. Environment variable checklist

| Variable | Required | Where to get it |
|----------|----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase → Settings → API |
| `DATABASE_URL` | Yes (persistence) | Supabase → Database → URI (pooler) |
| `AUTH_SECRET` | Yes | `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` / `SECRET` | For login | Google Cloud Console |
| `SETUP_SECRET` | For migrate | Random string on Vercel |
| `SANDBOX_WORKER_URL` | Recommended | Render/Fly/Railway worker URL |
| `REDIS_URL` | Optional | Local/docker TCP Redis |
| `UPSTASH_REDIS_REST_URL` | Recommended | Upstash REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Recommended | Upstash REST token |
| `STRIPE_*` | Not live yet | Skip until paid plans launch |

---

## 5. Health endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/health` | Supabase REST + PostgreSQL table checks |
| `POST /api/admin/migrate` | Schema + problem seed (needs `x-setup-secret` header) |

---

## 6. What is free for all users (public beta)

- All 20 DSA + 5 LLD in-app problems
- Go Lab (Playground + visualizers)
- HEAT canvas
- Diagnostic pipeline (when worker is deployed)
- Full lesson curriculum

Pro/Team Stripe checkout is **not enabled** until you add `STRIPE_SECRET_KEY` and price IDs.

---

## 7. Security notes

- Never commit `DATABASE_URL`, `SETUP_SECRET`, or API keys to git
- Use the Supabase **pooler** URL on Vercel (connection limits)
- Rotate any tokens that were pasted in chat or logs
- Worker should not be open to arbitrary code execution from the public internet without rate limits — put it behind Vercel-only traffic or add an auth header in production
