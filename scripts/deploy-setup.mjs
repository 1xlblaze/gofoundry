#!/usr/bin/env node
/**
 * Post-deploy setup for GoFoundry on Vercel + Supabase.
 *
 * Prerequisites:
 * 1. Supabase project with NEXT_PUBLIC_SUPABASE_URL + ANON_KEY in Vercel
 * 2. DATABASE_URL in Vercel (Supabase → Settings → Database → Connection string → URI)
 * 3. SETUP_SECRET in Vercel (random string for one-time migration)
 *
 * Usage:
 *   SETUP_SECRET=your-secret SITE_URL=https://gofoundry-seven.vercel.app node scripts/deploy-setup.mjs
 */

const site = process.env.SITE_URL ?? "https://gofoundry-seven.vercel.app";
const secret = process.env.SETUP_SECRET;

if (!secret) {
  console.error("Set SETUP_SECRET to match the Vercel env var");
  process.exit(1);
}

const response = await fetch(`${site}/api/admin/migrate`, {
  method: "POST",
  headers: { "x-setup-secret": secret },
});

const body = await response.json();
console.log(JSON.stringify(body, null, 2));
process.exit(response.ok ? 0 : 1);
