#!/usr/bin/env node
/**
 * Seed platform problems into PostgreSQL.
 *
 * Usage:
 *   DATABASE_URL=postgresql://... node scripts/seed-problems.mjs
 */

if (!process.env.DATABASE_URL) {
  console.error("Set DATABASE_URL (Supabase → Settings → Database → Connection string → URI)");
  process.exit(1);
}

const { Pool } = await import("pg");
const { platformProblems } = await import("../src/content/platform-problems/index.ts");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  for (const problem of platformProblems) {
    await pool.query(
      `INSERT INTO problems (
        id, title, track_id, difficulty,
        algorithmic_specs, runtime_invariants,
        starter_code, solution_code, test_suite_code
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        track_id = EXCLUDED.track_id,
        difficulty = EXCLUDED.difficulty,
        algorithmic_specs = EXCLUDED.algorithmic_specs,
        runtime_invariants = EXCLUDED.runtime_invariants,
        starter_code = EXCLUDED.starter_code,
        solution_code = EXCLUDED.solution_code,
        test_suite_code = EXCLUDED.test_suite_code`,
      [
        problem.id,
        problem.title,
        problem.trackId,
        problem.difficulty,
        JSON.stringify(problem.algorithmicSpecs),
        JSON.stringify(problem.runtimeInvariants),
        problem.starterCode,
        problem.solutionCode,
        problem.testSuiteCode,
      ],
    );
    console.log(`✓ ${problem.id}`);
  }

  const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM problems");
  console.log(`\nSeeded ${rows[0].count} problems total.`);
} finally {
  await pool.end();
}
