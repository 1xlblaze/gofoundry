import type { DiagnosticStreamEvent, HeatSubmission } from "./platform/types";

type QueryResult<T> = { rows: T[] };

export type DbClient = {
  query<T>(sql: string, params?: unknown[]): Promise<QueryResult<T>>;
};

let pool: DbClient | null = null;

function resolveDatabaseUrl(): string | undefined {
  return (
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL ??
    process.env.POSTGRES_PRISMA_URL
  );
}

export function isDatabaseConfigured(): boolean {
  return Boolean(resolveDatabaseUrl());
}

export async function getDb(): Promise<DbClient | null> {
  if (!isDatabaseConfigured()) return null;
  if (pool) return pool;

  const { Pool } = await import("pg");
  const pgPool = new Pool({
    connectionString: resolveDatabaseUrl(),
    max: 5,
    idleTimeoutMillis: 30_000,
  });

  pool = {
    query: async <T>(sql: string, params?: unknown[]) => {
      const result = await pgPool.query(sql, params);
      return { rows: result.rows as T[] };
    },
  };

  return pool;
}

export async function saveHeatSubmission(input: {
  userId?: string;
  problemId: string;
  hearNotes: Record<string, unknown>;
  etchDiagram: Record<string, unknown>;
  anchorInvariants: Record<string, unknown>;
  temperCode: string;
  status: string;
  benchNsPerOp?: number;
  benchAllocsPerOp?: number;
  benchBytesPerOp?: number;
  diagnosticEvents?: DiagnosticStreamEvent[];
}): Promise<HeatSubmission | null> {
  const db = await getDb();
  if (!db) return null;

  const { rows } = await db.query<{
    id: string;
    problem_id: string;
    hear_notes: Record<string, unknown>;
    etch_diagram_json: Record<string, unknown>;
    anchor_invariants: Record<string, unknown>;
    temper_code: string;
    status: HeatSubmission["status"];
    bench_ns_per_op: number | null;
    bench_allocs_per_op: number | null;
    bench_bytes_per_op: number | null;
    created_at: string;
  }>(
    `INSERT INTO heat_submissions
      (user_id, problem_id, hear_notes, etch_diagram_json, anchor_invariants,
       temper_code, status, bench_ns_per_op, bench_allocs_per_op, bench_bytes_per_op, diagnostic_events)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      input.userId ?? null,
      input.problemId,
      JSON.stringify(input.hearNotes),
      JSON.stringify(input.etchDiagram),
      JSON.stringify(input.anchorInvariants),
      input.temperCode,
      input.status,
      input.benchNsPerOp ?? null,
      input.benchAllocsPerOp ?? null,
      input.benchBytesPerOp ?? null,
      JSON.stringify(input.diagnosticEvents ?? []),
    ],
  );

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    problemId: row.problem_id,
    hearNotes: row.hear_notes,
    etchDiagramJson: row.etch_diagram_json,
    anchorInvariants: row.anchor_invariants,
    temperCode: row.temper_code,
    status: row.status,
    benchNsPerOp: row.bench_ns_per_op ?? undefined,
    benchAllocsPerOp: row.bench_allocs_per_op ?? undefined,
    benchBytesPerOp: row.bench_bytes_per_op ?? undefined,
    createdAt: row.created_at,
  };
}

export async function saveDiagnosticJob(input: {
  id: string;
  userId?: string;
  problemId: string;
  code: string;
  modes: string[];
}): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.query(
    `INSERT INTO diagnostic_jobs (id, user_id, problem_id, code, modes, status)
     VALUES ($1, $2, $3, $4, $5, 'queued')`,
    [input.id, input.userId ?? null, input.problemId, input.code, input.modes],
  );
}

export async function updateDiagnosticJob(
  id: string,
  status: string,
  events: DiagnosticStreamEvent[],
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.query(
    `UPDATE diagnostic_jobs
     SET status = $2, events = $3, completed_at = NOW()
     WHERE id = $1`,
    [id, status, JSON.stringify(events)],
  );
}

export async function getUserTierByEmail(email: string): Promise<string> {
  const db = await getDb();
  if (!db) return "free";

  const { rows } = await db.query<{ tier: string }>(
    `SELECT tier FROM users WHERE email = $1`,
    [email],
  );
  return rows[0]?.tier ?? "free";
}

