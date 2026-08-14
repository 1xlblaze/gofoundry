import type { PlatformProblem } from "@/lib/platform/types";
import { dsaPlatformProblems } from "./dsa-definitions";
import { lldPlatformProblems } from "./lld-definitions";

export const platformProblems: PlatformProblem[] = [
  ...dsaPlatformProblems,
  ...lldPlatformProblems,
];

const byId = new Map(platformProblems.map((p) => [p.id, p]));

export function getPlatformProblem(id: string): PlatformProblem | undefined {
  return byId.get(id);
}

export function listPlatformProblems(trackId?: string): PlatformProblem[] {
  if (!trackId) return platformProblems;
  return platformProblems.filter((p) => p.trackId === trackId);
}

export function listDsaProblems(): PlatformProblem[] {
  return listPlatformProblems("dsa");
}

/** All in-app problems are free during the public beta. */
export function isProProblem(_id: string): boolean {
  return false;
}

export function exportProblemsManifest() {
  return platformProblems.map((p) => ({
    id: p.id,
    title: p.title,
    trackId: p.trackId,
    difficulty: p.difficulty,
    maxHeapAllocs: p.runtimeInvariants.maxHeapAllocsPerRun ?? -1,
    testSuite: p.testSuiteCode,
  }));
}
