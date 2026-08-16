import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  adjacentLessons,
  allLessons,
  getLesson,
  getTrack,
} from "@/content";
import { LessonBlocks } from "@/components/LessonBlocks";
import { LessonQuiz } from "@/components/LessonQuiz";
import { CompleteButton } from "@/components/CompleteButton";
import { ProgressSaveCue } from "@/components/ProgressSaveCue";
import { ReadingProgress } from "@/components/ReadingProgress";
import { LessonChrome } from "@/components/LessonChrome";
import { LessonEtchPad } from "@/components/LessonEtchPad";
import { LessonTableOfContents } from "@/components/LessonTableOfContents";
import { LessonContentShell } from "@/components/LessonContentShell";
import { LessonWorkspaceProvider } from "@/components/LessonWorkspace";
import { LessonVisitTracker } from "@/components/LessonVisitTracker";
import { JsonLd } from "@/components/JsonLd";
import { sectionsFromBlocks } from "@/lib/lesson-sections";
import { resolvePrerequisiteLinks } from "@/lib/lesson-display";
import { buildPageMetadata } from "@/lib/site-metadata";
import { learningResourceJsonLd } from "@/lib/seo";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return allLessons.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const lesson = getLesson(slug);
  if (!lesson) return {};
  return buildPageMetadata({
    title: lesson.title,
    description: lesson.subtitle,
    path: `/lesson/${slug}`,
    type: "article",
    keywords: [...lesson.tags, lesson.track],
  });
}

export default async function LessonPage({ params }: Props) {
  const { slug } = await params;
  const lesson = getLesson(slug);
  if (!lesson) notFound();
  const track = getTrack(lesson.track);
  const { prev, next } = adjacentLessons(slug);
  const sections = sectionsFromBlocks(lesson.blocks);
  const labHref =
    lesson.slug === "lru-cache-lld" ? "/problems/lld-01-lru-cache" : undefined;
  const lessonStats = {
    sections: sections.length,
    diagrams: sections.filter((s) => s.tone === "visual").length,
    checkpoints: sections.filter((s) => s.tone === "think").length,
    codeBlocks: sections.filter((s) => s.tone === "action").length,
  };
  const prerequisiteLinks = resolvePrerequisiteLinks(lesson.prerequisites, (ref) =>
    getLesson(ref),
  );

  return (
    <LessonWorkspaceProvider lessonSlug={lesson.slug} trackId={track.id}>
      <JsonLd
        data={learningResourceJsonLd({
          title: lesson.title,
          description: lesson.subtitle,
          path: `/lesson/${lesson.slug}`,
          trackTitle: track.title,
        })}
      />
      <article id="lesson-article" className="shell lesson-reading">
      <LessonVisitTracker slug={lesson.slug} />
      <ReadingProgress articleId="lesson-article" />
      <div className="lesson-breadcrumb reveal">
        <Link href="/learn">Curriculum</Link>
        <span aria-hidden>/</span>
        <Link href={`/track/${track.id}`}>{track.short}</Link>
      </div>

      <div className="lesson-layout">
        <LessonTableOfContents sections={sections} />

        <div className="lesson-main">
          <LessonChrome
            lesson={lesson}
            track={track}
            stats={lessonStats}
            prerequisites={prerequisiteLinks.length > 0 ? prerequisiteLinks : undefined}
          />

          {(lesson.track === "lld" || lesson.track === "hld") && (
            <LessonEtchPad
              lessonSlug={lesson.slug}
              trackId={lesson.track}
              title={lesson.title}
            />
          )}

          <LessonContentShell slug={lesson.slug} blockCount={lesson.blocks.length} labHref={labHref}>
            <LessonBlocks blocks={lesson.blocks} labHref={labHref} />
          </LessonContentShell>

          <LessonQuiz slug={lesson.slug} questions={lesson.quiz} />

          <nav className="lesson-adjacent" aria-label="Lesson navigation">
            {prev ? (
              <Link href={`/lesson/${prev.slug}`} className="lesson-adjacent-link">
                <p className="type-label">Previous</p>
                <p className="type-title">{prev.title}</p>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link href={`/lesson/${next.slug}`} className="lesson-adjacent-link lesson-adjacent-next">
                <p className="type-label">Next</p>
                <p className="type-title">{next.title}</p>
              </Link>
            ) : (
              <span />
            )}
          </nav>

          <ProgressSaveCue className="lesson-progress-save-cue" />

          {next ? (
            <aside className="lesson-up-next" aria-label="Up next">
              <p className="type-label">Up next</p>
              <Link href={`/lesson/${next.slug}`} className="card lesson-up-next-card">
                <div className="lesson-up-next-inner">
                  <div>
                    <h3>{next.title}</h3>
                    <p>{next.subtitle}</p>
                  </div>
                  <span className="chip">{next.minutes} min</span>
                </div>
              </Link>
            </aside>
          ) : null}

          {lesson.track === "lld" || lesson.track === "hld" ? (
            <aside className="lesson-related panel" aria-label="Related track">
              <p className="type-label">Related</p>
              <h3>
                {lesson.track === "lld"
                  ? "See the distributed view in HLD"
                  : "Drill the component design in LLD"}
              </h3>
              <Link
                href={`/track/${lesson.track === "lld" ? "hld" : "lld"}`}
                className="ghost-btn"
              >
                Open {lesson.track === "lld" ? "HLD" : "LLD"} track
              </Link>
            </aside>
          ) : null}
        </div>
        <div
          id="lesson-etch-split-slot"
          className="lesson-etch-split-slot"
          aria-label="Split-screen sketch pad"
        />
      </div>
    </article>
    </LessonWorkspaceProvider>
  );
}
