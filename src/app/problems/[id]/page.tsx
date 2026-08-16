import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { ProblemWorkspace } from "@/components/ProblemWorkspace";
import { ProProblemGate } from "@/components/ProProblemGate";
import { getPlatformProblem, platformProblems } from "@/content/platform-problems/index";
import { canAccessPlatformProblem } from "@/lib/entitlements";
import { buildPageMetadata } from "@/lib/site-metadata";
import type { UserTier } from "@/lib/stripe";

type PageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return platformProblems.map((problem) => ({ id: problem.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const problem = getPlatformProblem(id);
  if (!problem) return { title: "Problem not found" };

  return buildPageMetadata({
    title: problem.title,
    description: `Staff-grade ${problem.trackId} Go problem with dual algorithmic and runtime evaluation gates.`,
    path: `/problems/${id}`,
  });
}

export default async function PlatformProblemPage({ params }: PageProps) {
  const { id } = await params;
  const problem = getPlatformProblem(id);

  if (!problem) {
    notFound();
  }

  const session = await auth();
  const tier = (session?.user?.tier as UserTier | undefined) ?? "free";
  const locked = !canAccessPlatformProblem(tier, problem.id);

  if (locked) {
    return <ProProblemGate problem={problem} />;
  }

  return (
    <div className="shell problem-workspace-page">
      <ProblemWorkspace problem={problem} isPro={tier === "pro" || tier === "cohort"} />
    </div>
  );
}
