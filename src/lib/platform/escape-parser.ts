import type { DiagnosticMarker } from "./types";

const ESCAPE_PATTERN =
  /^(.*?):(\d+):(\d+):\s*(.*escapes to heap.*)$/i;

const NO_ESCAPE_PATTERN =
  /^(.*?):(\d+):(\d+):\s*(.*does not escape.*)$/i;

const INLINE_PATTERN =
  /^(.*?):(\d+):(\d+):\s*(.*inlining call.*)$/i;

function markerFromMatch(
  match: RegExpMatchArray,
  escaped: boolean,
  severity: DiagnosticMarker["severity"],
): DiagnosticMarker {
  return {
    line: Number.parseInt(match[2], 10),
    column: Number.parseInt(match[3], 10),
    severity,
    message: match[4].trim(),
    escaped,
  };
}

export function parseEscapeAnalysisOutput(output: string): DiagnosticMarker[] {
  const markers: DiagnosticMarker[] = [];

  for (const line of output.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const escapeMatch = trimmed.match(ESCAPE_PATTERN);
    if (escapeMatch) {
      markers.push(markerFromMatch(escapeMatch, true, "warning"));
      continue;
    }

    const noEscapeMatch = trimmed.match(NO_ESCAPE_PATTERN);
    if (noEscapeMatch) {
      markers.push(markerFromMatch(noEscapeMatch, false, "info"));
      continue;
    }

    const inlineMatch = trimmed.match(INLINE_PATTERN);
    if (inlineMatch) {
      markers.push(markerFromMatch(inlineMatch, false, "info"));
    }
  }

  return markers.sort((a, b) => a.line - b.line || a.column - b.column);
}

export function parseBenchmarkOutput(output: string): {
  nsPerOp: number;
  bytesPerOp: number;
  allocsPerOp: number;
} | null {
  const benchLine = output
    .split("\n")
    .find((line) => line.includes("ns/op") && line.includes("B/op"));

  if (!benchLine) return null;

  const nsMatch = benchLine.match(/([\d.]+)\s*ns\/op/);
  const bytesMatch = benchLine.match(/([\d.]+)\s*B\/op/);
  const allocsMatch = benchLine.match(/([\d.]+)\s*allocs\/op/);

  if (!nsMatch) return null;

  return {
    nsPerOp: Number.parseFloat(nsMatch[1]),
    bytesPerOp: bytesMatch ? Number.parseFloat(bytesMatch[1]) : 0,
    allocsPerOp: allocsMatch ? Number.parseFloat(allocsMatch[1]) : 0,
  };
}

export function parseTestResults(output: string): {
  passed: number;
  failed: number;
  raceDetected: boolean;
} {
  let passed = 0;
  let failed = 0;
  let raceDetected = false;

  if (/WARNING: DATA RACE/i.test(output) || /race detected/i.test(output)) {
    raceDetected = true;
  }

  for (const line of output.split("\n")) {
    if (line.startsWith("--- PASS:")) passed += 1;
    if (line.startsWith("--- FAIL:")) failed += 1;
  }

  if (passed === 0 && failed === 0 && /PASS/i.test(output) && !raceDetected) {
    passed = 1;
  }

  return { passed, failed, raceDetected };
}

export function detectGoroutineLeaks(output: string): boolean {
  return /goroutine.*leak/i.test(output) || /leaked goroutine/i.test(output);
}
