import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { ProblemWorkspace } from "@/components/ProblemWorkspace";
import { getPlatformProblem, isProProblem } from "@/content/platform-problems/index";
import { requirePro } from "@/lib/tier";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const problem = getPlatformProblem(id);
  if (!problem) return { title: "Problem not found" };

  return {
    title: problem.title,
    description: `Staff-grade ${problem.trackId} problem with dual algorithmic + runtime evaluation.`,
  };
}

export default async function PlatformProblemPage({ params }: PageProps) {
  const { id } = await params;
  const problem = getPlatformProblem(id);

  if (!problem) {
    notFound();
  }

  if (isProProblem(id)) {
    const access = await requirePro();
    if (!access.ok) {
      redirect(`/pricing?upgrade=pro&problem=${id}`);
    }
  }

  return (
    <div className="shell problem-workspace-page">
      <ProblemWorkspace problem={problem} />
    </div>
  );
}
