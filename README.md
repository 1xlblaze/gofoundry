# GoFoundry

Interactive Go learning platform with a unique **Foundry HEAT** method:

**Hear → Etch → Anchor → Temper**

- How to think + how to answer interview scripts
- draw.io–style diagrams in lessons
- DSA, concepts, internals, LLD, HLD in idiomatic Go
- Quizzes + local progress
- Google Sign-In (Auth.js) + optional Keycloak OIDC

## Develop

```bash
npm install
cp .env.example .env.local   # fill Google / Keycloak / AUTH_SECRET
npm run dev
```

## Auth env

```
AUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
# optional Keycloak
KEYCLOAK_CLIENT_ID=
KEYCLOAK_CLIENT_SECRET=
KEYCLOAK_ISSUER=https://your-keycloak/realms/your-realm
```

Google redirect URI: `http://localhost:3000/api/auth/callback/google`

## Platform upgrade (staff diagnostics)

GoFoundry now ships a dual-engine platform combining Go-centric DSA with the HEAT method and a 4-gate diagnostic pipeline:

1. **Unit tests** — functional correctness
2. **Race detector** — `go test -race`
3. **Leak assertion** — `goleak.VerifyNone`
4. **Alloc audit** — benchmark allocs/op + escape analysis (`-gcflags=-m`)

### API

- `POST /api/diagnostics` — start a diagnostic job
- `GET /api/diagnostics/stream?jobId=` — SSE event stream
- `GET /api/platform-problems` — list in-app staff problems

### Sandbox worker

```bash
make worker-run   # listens on :8081
```

Set `SANDBOX_WORKER_URL=http://localhost:8081` to route diagnostics through the worker cluster instead of the local `go` executor.

### Database

```bash
psql $DATABASE_URL -f db/migrations/001_platform_schema.sql
psql $DATABASE_URL -f db/migrations/002_seed_problems.sql
```

Set `DATABASE_URL` to persist HEAT submissions.

### Full stack (Docker)

```bash
docker-compose up --build
```

Services: `app` (:3000), `worker` (:8081), `postgres`, `redis`.

### Stripe

Configure `STRIPE_SECRET_KEY`, webhook secret, and price IDs in `.env.local`. Checkout at `/pricing`.

## Deploy

Vercel (Node runtime — not static export). Connect the GitHub repo and set the env vars above.

**Full production setup** (Supabase `DATABASE_URL`, free Redis, free sandbox worker): see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
