import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { saveHeatSubmission } from "@/lib/db";
import {
  createDiagnosticJob,
  deriveSubmissionStatus,
} from "@/lib/platform/diagnostics";
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

  const waitForComplete = new Promise<void>((resolve) => {
    const check = () => {
      if (job.status === "completed" || job.status === "failed") {
        resolve();
        return;
      }
      setTimeout(check, 100);
    };
    check();
  });

  void waitForComplete.then(async () => {
    const status = deriveSubmissionStatus(job.events);
    const benchEvent = job.events.find((e) => e.event === "BENCHMARK_COMPLETE");

    await saveHeatSubmission({
      userId: session?.user?.id,
      problemId,
      hearNotes,
      etchDiagram,
      anchorInvariants,
      temperCode: code,
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
  });

  return NextResponse.json({
    jobId: job.id,
    streamUrl: `/api/diagnostics/stream?jobId=${job.id}`,
  });
}
