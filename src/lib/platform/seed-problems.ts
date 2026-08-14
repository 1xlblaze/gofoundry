import { platformProblems } from "@/content/platform-problems/index";
import type { DbClient } from "@/lib/db";

export async function seedPlatformProblems(db: DbClient): Promise<{ seeded: number }> {
  for (const problem of platformProblems) {
    await db.query(
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
  }

  const { rows } = await db.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM problems`,
  );

  return { seeded: Number(rows[0]?.count ?? platformProblems.length) };
}
