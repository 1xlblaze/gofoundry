-- Waitlist table used by POST /api/waitlist (pricing, diagnostic, sandbox pages).
-- Apply with Supabase MCP `apply_migration` or the Supabase SQL editor.

create table if not exists public.gofoundry_waitlist (
  id bigint generated always as identity primary key,
  email text not null,
  tier text,
  source text,
  created_at timestamptz not null default now(),
  constraint gofoundry_waitlist_email_unique unique (email)
);

alter table public.gofoundry_waitlist enable row level security;

create policy "anon can insert waitlist signups"
  on public.gofoundry_waitlist
  for insert
  to anon
  with check (true);
