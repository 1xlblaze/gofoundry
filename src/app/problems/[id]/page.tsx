import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProblemWorkspace } from "@/components/ProblemWorkspace";
import { getPlatformProblem } from "@/content/platform-problems/index";

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

  return (
    <div className="shell problem-workspace-page">
      <ProblemWorkspace problem={problem} />
    </div>
  );
}
