import { NextResponse } from "next/server";

const PLAYGROUND_URL = "https://play.golang.org/compile";
const MAX_CODE_BYTES = 64 * 1024;
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;

type RateWindow = {
  count: number;
  startedAt: number;
};

// Soft per-IP limit only: this in-memory Map is intentionally best-effort and
// is not shared across serverless instances. A distributed limiter can replace
// it when the lab needs a hard 20 requests/minute guarantee.
const requestWindows = new Map<string, RateWindow>();

function clientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || "unknown";
}

function isRateLimited(ip: string) {
  const now = Date.now();
  const current = requestWindows.get(ip);

  if (!current || now - current.startedAt >= RATE_WINDOW_MS) {
    requestWindows.set(ip, { count: 1, startedAt: now });
    return false;
  }

  current.count += 1;
  return current.count > RATE_LIMIT;
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ Errors: message }, { status });
}

export async function POST(request: Request) {
  if (isRateLimited(clientIp(request))) {
    return errorResponse(
      "Too many runs. Please wait a minute before trying again.",
      429,
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return errorResponse("Request body must be valid JSON.", 400);
  }

  const code =
    typeof payload === "object" &&
    payload !== null &&
    "code" in payload &&
    typeof payload.code === "string"
      ? payload.code
      : null;

  if (code === null) {
    return errorResponse('Expected JSON with a string field named "code".', 400);
  }

  if (new TextEncoder().encode(code).byteLength > MAX_CODE_BYTES) {
    return errorResponse("Code is limited to 64KB per run.", 413);
  }

  try {
    const body = new URLSearchParams({
      body: code,
      version: "2",
      withVet: "true",
    });
    const response = await fetch(PLAYGROUND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      return errorResponse(
        `Go Playground returned ${response.status} ${response.statusText}.`,
        502,
      );
    }

    const result: unknown = await response.json();
    return NextResponse.json(result);
  } catch {
    return errorResponse(
      "The Go Playground is unavailable right now. Please try again.",
      502,
    );
  }
}
