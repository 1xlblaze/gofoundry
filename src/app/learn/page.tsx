import { Suspense } from "react";
import { ProgressSaveCue } from "@/components/ProgressSaveCue";
import { LearnCurriculum } from "@/components/LearnCurriculum";
import { LearnFilters } from "@/components/LearnFilters";
import { LearnProgressPanel } from "@/components/LearnProgressPanel";
import { ScrollReveal } from "@/components/ui";
import {
  countFilteredLessons,
  filteredLearnTracks,
  learnLessonTotal,
  parseLearnFilters,
  type LearnFilterParams,
} from "@/lib/learn-filters";

export const revalidate = 3600;

type PageProps = {
  searchParams: Promise<LearnFilterParams>;
};

export default async function LearnPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters = parseLearnFilters(params);
  const entries = filteredLearnTracks(filters);
  const filteredCount = countFilteredLessons(filters);

  return (
    <ScrollReveal>
      <div className="shell" style={{ padding: "2.5rem 0 3.5rem" }}>
        <div className="page-hero reveal" data-motion>
          <h1>Curriculum</h1>
          <p>Hear the material in any order — filter by track, level, or topic.</p>
        </div>

        <ProgressSaveCue className="learn-progress-save-cue" />

        <Suspense fallback={null}>
          <LearnFilters filteredCount={filteredCount} totalCount={learnLessonTotal} />
        </Suspense>

        <div className="learn-layout-grid">
          <LearnProgressPanel total={learnLessonTotal} />
          <div className="learn-main">
            <LearnCurriculum entries={entries} />
          </div>
        </div>
      </div>
    </ScrollReveal>
  );
}
