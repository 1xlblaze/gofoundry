import { NextResponse } from "next/server";
import { getPlatformProblem } from "@/content/platform-problems/index";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const problem = getPlatformProblem(id);

  if (!problem) {
    return NextResponse.json({ error: "Problem not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: problem.id,
    title: problem.title,
    trackId: problem.trackId,
    difficulty: problem.difficulty,
    algorithmicSpecs: problem.algorithmicSpecs,
    runtimeInvariants: problem.runtimeInvariants,
    starterCode: problem.starterCode,
  });
}
