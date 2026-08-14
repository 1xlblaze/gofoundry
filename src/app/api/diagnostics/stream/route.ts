import {
  getDiagnosticJob,
  subscribeToJob,
} from "@/lib/platform/diagnostics";
import type { DiagnosticStreamEvent } from "@/lib/platform/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatSse(event: DiagnosticStreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");

  if (!jobId) {
    return new Response("jobId query parameter is required", { status: 400 });
  }

  const job = getDiagnosticJob(jobId);
  if (!job) {
    return new Response("Job not found", { status: 404 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const send = (event: DiagnosticStreamEvent) => {
        controller.enqueue(encoder.encode(formatSse(event)));
        if (event.event === "COMPLETE") {
          controller.close();
        }
      };

      const unsubscribe = subscribeToJob(jobId, send);

      request.signal.addEventListener("abort", () => {
        unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
