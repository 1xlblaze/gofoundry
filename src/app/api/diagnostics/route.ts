import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { saveHeatSubmission, saveDiagnosticJob, updateDiagnosticJob } from "@/lib/db";
import {
  createDiagnosticJob,
  deriveSubmissionStatus,
  executeDiagnosticJob,
} from "@/lib/platform/diagnostics";
import { enqueueDiagnosticJob } from "@/lib/platform/queue";
import type { DiagnosticMode } from "@/lib/platform/types";

const VALID_MODES: DiagnosticMode[] = [
  "correctness",
  "race",
  "leak",
  "bench",
  "escape",
];

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const body = payload as Record<string, unknown>;
  const problemId =
    typeof body.problemId === "string" ? body.problemId : null;
  const code = typeof body.code === "string" ? body.code : null;

  if (!problemId || !code) {
    return NextResponse.json(
      { error: "problemId and code are required" },
      { status: 400 },
    );
  }

  const modes = Array.isArray(body.modes)
    ? (body.modes.filter((m) =>
        VALID_MODES.includes(m as DiagnosticMode),
      ) as DiagnosticMode[])
    : (["correctness", "race", "leak", "bench", "escape"] as DiagnosticMode[]);

  const job = createDiagnosticJob({ problemId, code, modes });

  const session = await auth();
  const hearNotes =
    typeof body.hearNotes === "object" && body.hearNotes !== null
      ? (body.hearNotes as Record<string, unknown>)
      : {};
  const etchDiagram =
    typeof body.etchDiagram === "object" && body.etchDiagram !== null
      ? (body.etchDiagram as Record<string, unknown>)
      : {};
  const anchorInvariants =
    typeof body.anchorInvariants === "object" && body.anchorInvariants !== null
      ? (body.anchorInvariants as Record<string, unknown>)
      : {};

  await saveDiagnosticJob({
    id: job.id,
    userId: session?.user?.id,
    problemId,
    code,
    modes,
  });

  void enqueueDiagnosticJob({
    jobId: job.id,
    problemId,
    code,
    modes,
  }).then(() => executeDiagnosticJob(job));

  void jobCompletionWatcher(job, {
    userId: session?.user?.id,
    problemId,
    hearNotes,
    etchDiagram,
    anchorInvariants,
    temperCode: code,
  });

  return NextResponse.json({
    jobId: job.id,
    streamUrl: `/api/diagnostics/stream?jobId=${job.id}`,
  });
}

function jobCompletionWatcher(
  job: ReturnType<typeof createDiagnosticJob>,
  submission: {
    userId?: string;
    problemId: string;
    hearNotes: Record<string, unknown>;
    etchDiagram: Record<string, unknown>;
    anchorInvariants: Record<string, unknown>;
    temperCode: string;
  },
) {
  const check = async () => {
    if (job.status === "completed" || job.status === "failed") {
      const status = deriveSubmissionStatus(job.events);
      const benchEvent = job.events.find((e) => e.event === "BENCHMARK_COMPLETE");

      await updateDiagnosticJob(job.id, job.status, job.events);
      await saveHeatSubmission({
        ...submission,
        status,
        benchNsPerOp:
          benchEvent?.event === "BENCHMARK_COMPLETE"
            ? Math.round(benchEvent.nsPerOp)
            : undefined,
        benchAllocsPerOp:
          benchEvent?.event === "BENCHMARK_COMPLETE"
            ? Math.round(benchEvent.allocsPerOp)
            : undefined,
        benchBytesPerOp:
          benchEvent?.event === "BENCHMARK_COMPLETE"
            ? Math.round(benchEvent.bytesPerOp)
            : undefined,
        diagnosticEvents: job.events,
      });
      return;
    }
    setTimeout(check, 200);
  };
  check();
}
