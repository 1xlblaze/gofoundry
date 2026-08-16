import type { DiagnosticMode } from "@/lib/platform/types";
import type { UserTier } from "@/lib/stripe";

/** In-app staff problems free during funnel — remainder require Pro. */
export const FREE_PLATFORM_PROBLEM_IDS = new Set([
  "dsa-01-slice-headers",
  "dsa-02-ring-buffer",
]);

/** Advanced diagnostic gates (Temper depth) — free tier gets correctness + race only. */
export const PRO_DIAGNOSTIC_MODES: DiagnosticMode[] = ["bench", "escape", "leak"];

export function isPaidTier(tier: UserTier): boolean {
  return tier === "pro" || tier === "cohort";
}

export function isProPlatformProblem(id: string): boolean {
  return !FREE_PLATFORM_PROBLEM_IDS.has(id);
}

export function canAccessPlatformProblem(tier: UserTier, problemId: string): boolean {
  if (!isProPlatformProblem(problemId)) return true;
  return isPaidTier(tier);
}

export function filterDiagnosticModesForTier(
  tier: UserTier,
  modes: DiagnosticMode[],
): DiagnosticMode[] {
  if (isPaidTier(tier)) return modes;
  return modes.filter((mode) => !PRO_DIAGNOSTIC_MODES.includes(mode));
}

export const ENTITLEMENT_COPY = {
  proProblemsLabel: "Staff problem bank (20 DSA + 5 LLD workspaces)",
  freeProblemsLabel: "2 starter staff problems",
  proDiagnosticsLabel: "Full 4-gate Temper pipeline (vet, escape, race, leak, bench)",
  freeDiagnosticsLabel: "Correctness + race checks on free problems",
  lessonReading: "All curriculum lessons readable (beta grandfathering)",
} as const;
