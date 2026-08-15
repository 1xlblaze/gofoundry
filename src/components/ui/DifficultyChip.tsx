import type { Difficulty } from "@/content/types";
import type { ProblemDifficulty } from "@/content/problems";

type Level = Difficulty | ProblemDifficulty | string;

const LEVEL_CLASS: Record<string, string> = {
  beginner: "ds-diff-beginner",
  easy: "ds-diff-easy",
  intermediate: "ds-diff-intermediate",
  medium: "ds-diff-medium",
  advanced: "ds-diff-advanced",
  hard: "ds-diff-hard",
};

export function DifficultyChip({
  level,
  className = "",
}: {
  level: Level;
  className?: string;
}) {
  const key = level.toLowerCase();
  const tone = LEVEL_CLASS[key] ?? "ds-diff-neutral";

  return (
    <span className={`ds-chip ds-difficulty ${tone} ${className}`.trim()}>{level}</span>
  );
}
