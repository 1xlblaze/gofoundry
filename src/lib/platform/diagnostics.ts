import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import {
  detectGoroutineLeaks,
  parseBenchmarkOutput,
  parseEscapeAnalysisOutput,
  parseTestResults,
} from "./escape-parser";
import type {
  DiagnosticMode,
  DiagnosticStreamEvent,
  PlatformProblem,
  RuntimeInvariants,
} from "./types";

const execFileAsync = promisify(execFile);

const GO_BIN = process.env.GO_BIN ?? "go";
const WORKER_URL = process.env.SANDBOX_WORKER_URL;

export type DiagnosticJob = {
  id: string;
  problemId: string;
  code: string;
  modes: DiagnosticMode[];
  status: "queued" | "running" | "completed" | "failed";
  events: DiagnosticStreamEvent[];
  listeners: Set<(event: DiagnosticStreamEvent) => void>;
};

const jobs = new Map<string, DiagnosticJob>();

function emit(job: DiagnosticJob, event: DiagnosticStreamEvent) {
  job.events.push(event);
  for (const listener of job.listeners) {
    listener(event);
  }
}

export function createDiagnosticJob(input: {
  problemId: string;
  code: string;
  modes: DiagnosticMode[];
}): DiagnosticJob {
  const id = crypto.randomUUID();
  const job: DiagnosticJob = {
    id,
    problemId: input.problemId,
    code: input.code,
    modes: input.modes,
    status: "queued",
    events: [],
    listeners: new Set(),
  };
  jobs.set(id, job);
  void runJob(job);
  return job;
}

export function getDiagnosticJob(id: string): DiagnosticJob | undefined {
  return jobs.get(id);
}

export function subscribeToJob(
  id: string,
  listener: (event: DiagnosticStreamEvent) => void,
): () => void {
  const job = jobs.get(id);
  if (!job) return () => {};

  for (const event of job.events) {
    listener(event);
  }

  if (job.status === "completed" || job.status === "failed") {
    return () => {};
  }

  job.listeners.add(listener);
  return () => job.listeners.delete(listener);
}

async function runJob(job: DiagnosticJob) {
  job.status = "running";

  try {
    if (WORKER_URL) {
      await runViaWorker(job);
    } else {
      await runLocally(job);
    }
    job.status = "completed";
    emit(job, { event: "COMPLETE", jobId: job.id });
  } catch (error) {
    job.status = "failed";
    emit(job, {
      event: "ERROR",
      message: error instanceof Error ? error.message : "Diagnostic run failed",
    });
    emit(job, { event: "COMPLETE", jobId: job.id });
  } finally {
    for (const listener of job.listeners) {
      job.listeners.delete(listener);
    }
  }
}

async function runViaWorker(job: DiagnosticJob) {
  const response = await fetch(`${WORKER_URL}/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      problemId: job.problemId,
      code: job.code,
      modes: job.modes,
    }),
    signal: AbortSignal.timeout(120_000),
  });

  if (!response.ok) {
    throw new Error(`Sandbox worker returned ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("Worker returned no stream");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;
      const event = JSON.parse(line) as DiagnosticStreamEvent;
      emit(job, event);
    }
  }
}

async function runGo(
  dir: string,
  args: string[],
  timeoutMs = 60_000,
): Promise<{ stdout: string; stderr: string }> {
  try {
    const { stdout, stderr } = await execFileAsync(GO_BIN, args, {
      cwd: dir,
      timeout: timeoutMs,
      maxBuffer: 10 * 1024 * 1024,
      env: { ...process.env, GO111MODULE: "on" },
    });
    return { stdout: stdout.toString(), stderr: stderr.toString() };
  } catch (error) {
    const execError = error as {
      stdout?: Buffer;
      stderr?: Buffer;
      message?: string;
    };
    return {
      stdout: execError.stdout?.toString() ?? "",
      stderr:
        execError.stderr?.toString() ??
        execError.message ??
        "go command failed",
    };
  }
}

function buildModule(
  userCode: string,
  testSuite: string,
  problem: PlatformProblem,
): { mainGo: string; testGo: string; goMod: string } {
  const packageName = problem.id.replace(/-/g, "_");

  return {
    goMod: `module gofoundry/${problem.id}

go 1.22

require go.uber.org/goleak v1.3.0
`,
    mainGo: userCode.includes("package ")
      ? userCode
      : `package ${packageName}\n\n${userCode}`,
    testGo: testSuite,
  };
}

async function runLocally(job: DiagnosticJob) {
  const { getPlatformProblem } = await import("@/content/platform-problems");
  const problem = getPlatformProblem(job.problemId);
  if (!problem) {
    throw new Error(`Unknown problem: ${job.problemId}`);
  }

  const dir = await mkdtemp(join(tmpdir(), "gofoundry-diag-"));

  try {
    const module = buildModule(job.code, problem.testSuiteCode, problem);
    await writeFile(join(dir, "go.mod"), module.goMod);
    await writeFile(join(dir, "solution.go"), module.mainGo);
    await writeFile(join(dir, "solution_test.go"), module.testGo);

    emit(job, {
      event: "PROGRESS",
      step: "vet",
      message: "Running go vet…",
    });

    if (job.modes.includes("escape") || job.modes.includes("correctness")) {
      const vet = await runGo(dir, ["vet", "./..."]);
      if (vet.stderr && /vet:/i.test(vet.stderr)) {
        emit(job, {
          event: "ERROR",
          message: vet.stderr.trim(),
        });
      }
    }

    if (job.modes.includes("escape")) {
      emit(job, {
        event: "PROGRESS",
        step: "escape",
        message: "Running escape analysis (-gcflags=-m)…",
      });

      const build = await runGo(dir, [
        "build",
        "-gcflags=-m -m",
        "-o",
        "/dev/null",
        ".",
      ]);
      const markers = parseEscapeAnalysisOutput(
        `${build.stdout}\n${build.stderr}`,
      );
      emit(job, { event: "ESCAPE_ANALYSIS_READY", markers });
    }

    if (
      job.modes.includes("correctness") ||
      job.modes.includes("race") ||
      job.modes.includes("leak")
    ) {
      emit(job, {
        event: "PROGRESS",
        step: "test",
        message: "Running correctness and safety checks…",
      });

      await runGo(dir, ["mod", "tidy"], 30_000).catch(() => {});

      const raceArgs = job.modes.includes("race")
        ? ["test", "-race", "-count=1", "-v", "./..."]
        : ["test", "-count=1", "-v", "./..."];

      const test = await runGo(dir, raceArgs, 90_000);
      const combined = `${test.stdout}\n${test.stderr}`;
      const results = parseTestResults(combined);
      const leaksDetected =
        job.modes.includes("leak") && detectGoroutineLeaks(combined);

      emit(job, {
        event: "SAFETY_CHECK_RESULT",
        raceDetected: results.raceDetected,
        leaksDetected,
        testsPassed: results.passed,
        testsFailed: results.failed,
        output: combined.slice(-4000),
      });
    }

    if (job.modes.includes("bench")) {
      emit(job, {
        event: "PROGRESS",
        step: "bench",
        message: "Running benchmarks…",
      });

      const bench = await runGo(
        dir,
        ["test", "-bench=.", "-benchmem", "-benchtime=500ms", "-run=^$", "./..."],
        90_000,
      );
      const benchResult = parseBenchmarkOutput(
        `${bench.stdout}\n${bench.stderr}`,
      );

      if (benchResult) {
        const passedStaffBar = evaluateStaffBar(
          benchResult.allocsPerOp,
          problem.runtimeInvariants,
        );
        emit(job, {
          event: "BENCHMARK_COMPLETE",
          ...benchResult,
          passedStaffBar,
        });
      } else {
        emit(job, {
          event: "ERROR",
          message: "No benchmark output found. Ensure Benchmark* functions exist.",
        });
      }
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function evaluateStaffBar(
  allocsPerOp: number,
  invariants: RuntimeInvariants,
): boolean {
  const maxAllocs = invariants.maxHeapAllocsPerRun;
  if (maxAllocs === undefined) return true;
  return allocsPerOp <= maxAllocs;
}

export function deriveSubmissionStatus(
  events: DiagnosticStreamEvent[],
): string {
  for (const event of events) {
    if (event.event === "SAFETY_CHECK_RESULT") {
      if (event.raceDetected) return "race_detected";
      if (event.leaksDetected) return "leak_detected";
      if (event.testsFailed > 0) return "failed";
    }
    if (event.event === "BENCHMARK_COMPLETE" && !event.passedStaffBar) {
      return "alloc_violation";
    }
  }

  const hasFailure = events.some((e) => e.event === "ERROR");
  if (hasFailure) return "failed";

  return "passed";
}
