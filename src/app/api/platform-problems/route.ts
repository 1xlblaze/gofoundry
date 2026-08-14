import { NextResponse } from "next/server";
import { listPlatformProblems } from "@/content/platform-problems";

export async function GET() {
  const problems = listPlatformProblems().map((p) => ({
    id: p.id,
    title: p.title,
    trackId: p.trackId,
    difficulty: p.difficulty,
    algorithmicSpecs: p.algorithmicSpecs,
    runtimeInvariants: p.runtimeInvariants,
  }));

  return NextResponse.json({ problems });
}
