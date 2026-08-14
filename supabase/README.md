# Supabase (waitlist)

GoFoundry uses Supabase Postgres for pricing/diagnostic waitlist signups via `POST /api/waitlist`.

## App env vars

Set in `.env.local` or Cloud Agent secrets:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Schema

Migration: `supabase/migrations/20260814000000_gofoundry_waitlist.sql`

Creates `public.gofoundry_waitlist` with RLS allowing anonymous inserts only.

## Supabase MCP (Cursor)

This repo includes `.cursor/mcp.json` pointing at the hosted Supabase MCP server in **read-only** mode with `database` and `docs` tools enabled.

### Where to configure MCP (depends on where you work)

| Where | How to add Supabase MCP |
| --- | --- |
| **Chrome — Cloud Agents** | Open [cursor.com/agents](https://cursor.com/agents) → use the **MCP** control when starting or managing an agent (not the team dashboard). |
| **Cursor desktop app** | Sidebar **Customize → MCPs**, or **Settings → Tools & MCP**. Authenticate `supabase` via OAuth after adding the server. |
| **Team admins only** | [cursor.com/dashboard/integrations](https://cursor.com/dashboard/integrations) → **Integrations & MCP** (shared team servers). |

If you do not see **Integrations & MCP** in Chrome, that is expected on a personal account — use [cursor.com/agents](https://cursor.com/agents) instead.

Cloud Agents do **not** auto-load `.cursor/mcp.json`; configure Supabase MCP in the dashboard UI above.

### Setup steps

1. Add the server URL (from `.cursor/mcp.json` or paste manually):

   ```
   https://mcp.supabase.com/mcp?project_ref=YOUR_PROJECT_REF&read_only=true&features=database,docs
   ```

2. Complete OAuth when prompted.
3. To apply the waitlist migration, temporarily remove `read_only=true` or use the Supabase dashboard SQL editor.

Use a development Supabase project, not production. Keep manual approval enabled for MCP tool calls.
