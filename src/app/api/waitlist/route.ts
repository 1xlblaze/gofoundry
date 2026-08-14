import { NextResponse } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type WaitlistRequest = {
  email?: unknown;
  tier?: unknown;
  source?: unknown;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as WaitlistRequest | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Enter a valid email address." },
      { status: 400 },
    );
  }

  if (
    (body?.tier !== undefined && typeof body.tier !== "string") ||
    (body?.source !== undefined && typeof body.source !== "string")
  ) {
    return NextResponse.json(
      { ok: false, error: "Invalid waitlist details." },
      { status: 400 },
    );
  }

  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) {
    return NextResponse.json(
      { ok: false, error: "Waitlist signup is not configured." },
      { status: 500 },
    );
  }

  const payload: { email: string; tier?: string; source?: string } = { email };
  const tier = typeof body?.tier === "string" ? body.tier.trim() : "";
  const source = typeof body?.source === "string" ? body.source.trim() : "";
  if (tier) payload.tier = tier;
  if (source) payload.source = source;

  try {
    const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/gofoundry_waitlist`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(payload),
    });

    if (response.ok || response.status === 201) {
      return NextResponse.json({ ok: true });
    }

    const errorBody = await response.text();
    const isDuplicate =
      response.status === 409 ||
      errorBody.includes("23505") ||
      /duplicate key|unique constraint/i.test(errorBody);

    if (isDuplicate) {
      return NextResponse.json({ ok: true, alreadyJoined: true });
    }

    console.error("waitlist insert failed", response.status, errorBody.slice(0, 500));
    return NextResponse.json(
      { ok: false, error: "We could not join the waitlist. Please try again." },
      { status: 502 },
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "We could not reach the waitlist. Please try again." },
      { status: 502 },
    );
  }
}
