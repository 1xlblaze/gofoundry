<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Cloud Agent development

- Install dependencies: `npm ci`
- Dev server: `npm run dev` (port 3000, started automatically via `terminals`)
- Lint: `npm run lint`
- Production build: `npm run build`
- Optional secrets (configure in the environment panel): `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `KEYCLOAK_*`, `NEXT_PUBLIC_SUPABASE_*`
- Supabase MCP: `.cursor/mcp.json` (read-only `database` + `docs`); authenticate in Cursor Settings → Tools & MCP. Waitlist schema: `supabase/migrations/`. See `supabase/README.md`.
- Core flows work without auth or Supabase: lessons, curriculum, Go Lab (playground proxy), local progress
- Google OAuth redirect URI for local dev: `http://localhost:3000/api/auth/callback/google`
