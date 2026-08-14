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

1. Open **Cursor Settings → Tools & MCP** and authenticate the `supabase` server (OAuth).
2. Replace `YOUR_PROJECT_REF` in `.cursor/mcp.json` to scope the server to one project:

   ```
   https://mcp.supabase.com/mcp?project_ref=YOUR_PROJECT_REF&read_only=true&features=database,docs
   ```

3. To apply the waitlist migration, temporarily remove `read_only=true` or use the Supabase dashboard SQL editor, then run the migration SQL.

**Cloud Agents:** enable the Supabase HTTP MCP under [Dashboard → Integrations & MCP](https://cursor.com/dashboard/integrations) (team) or the MCP menu at [cursor.com/agents](https://cursor.com/agents) (personal). HTTP MCP is recommended over stdio for cloud runs.

Use a development Supabase project, not production. Keep manual approval enabled for MCP tool calls.
