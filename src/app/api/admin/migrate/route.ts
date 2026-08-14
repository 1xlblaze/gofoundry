import { NextResponse } from "next/server";
import { getDb, isDatabaseConfigured } from "@/lib/db";
import { seedPlatformProblems } from "@/lib/platform/seed-problems";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = request.headers.get("x-setup-secret");
  if (!process.env.SETUP_SECRET || secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "DATABASE_URL is not configured on Vercel" },
      { status: 503 },
    );
  }

  const db = await getDb();
  if (!db) {
    return NextResponse.json({ error: "Database connection failed" }, { status: 503 });
  }

  const migrationPath = join(
    process.cwd(),
    "supabase/migrations/20260814190000_platform_schema.sql",
  );
  const sql = readFileSync(migrationPath, "utf8");

  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  const results: string[] = [];

  for (const statement of statements) {
    try {
      await db.query(statement);
      results.push(`OK: ${statement.slice(0, 60)}…`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "query failed";
      if (/already exists/i.test(message)) {
        results.push(`SKIP: ${statement.slice(0, 40)}…`);
      } else {
        results.push(`ERR: ${message}`);
      }
    }
  }

  const seed = await seedPlatformProblems(db);

  return NextResponse.json({ ok: true, results, seed });
}
