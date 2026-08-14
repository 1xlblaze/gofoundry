import { NextResponse } from "next/server";
import { getDb, isDatabaseConfigured } from "@/lib/db";
import { getSupabaseConfig } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { url, anonKey } = getSupabaseConfig();
  const supabaseConfigured = Boolean(url && anonKey);

  let supabaseRest: "ok" | "error" | "not_configured" = "not_configured";
  let supabaseHost: string | null = null;

  if (supabaseConfigured) {
    try {
      supabaseHost = new URL(url).hostname;
      const response = await fetch(
        `${url.replace(/\/$/, "")}/rest/v1/gofoundry_waitlist?select=id&limit=1`,
        {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
          },
          cache: "no-store",
        },
      );
      supabaseRest = response.ok ? "ok" : "error";
    } catch {
      supabaseRest = "error";
    }
  }

  let database: "ok" | "error" | "not_configured" = "not_configured";
  const tables: Record<string, boolean> = {};

  if (isDatabaseConfigured()) {
    const db = await getDb();
    if (db) {
      try {
        for (const table of [
          "gofoundry_waitlist",
          "users",
          "problems",
          "heat_submissions",
          "diagnostic_jobs",
        ]) {
          const { rows } = await db.query<{ exists: boolean }>(
            `SELECT EXISTS (
              SELECT FROM information_schema.tables
              WHERE table_schema = 'public' AND table_name = $1
            ) AS exists`,
            [table],
          );
          tables[table] = rows[0]?.exists ?? false;
        }
        database = "ok";
      } catch {
        database = "error";
      }
    } else {
      database = "error";
    }
  }

  const platformReady =
    database === "ok" &&
    tables.users &&
    tables.problems &&
    tables.heat_submissions &&
    tables.diagnostic_jobs;

  return NextResponse.json({
    supabase: {
      configured: supabaseConfigured,
      host: supabaseHost,
      rest: supabaseRest,
    },
    database: {
      configured: isDatabaseConfigured(),
      status: database,
      tables,
      platformReady,
    },
    overall:
      supabaseRest === "ok" && platformReady
        ? "fully_connected"
        : supabaseRest === "ok"
          ? "rest_only"
          : "not_connected",
  });
}
