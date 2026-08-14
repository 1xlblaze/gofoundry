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

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return allLessons.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const lesson = getLesson(slug);
  if (!lesson) return {};
  return { title: lesson.title, description: lesson.subtitle };
}

export default async function LessonPage({ params }: Props) {
  const { slug } = await params;
  const lesson = getLesson(slug);
  if (!lesson) notFound();
  const track = getTrack(lesson.track);
  const { prev, next } = adjacentLessons(slug);

  return (
    <article className="reading-rail mx-auto px-6 py-14 sm:py-16">
      <div className="flex flex-wrap items-center gap-2 text-[0.8rem] text-ink-faint">
        <Link href="/learn" className="font-medium transition-colors hover:text-ink">
          Curriculum
        </Link>
        <span aria-hidden>/</span>
        <Link
          href={`/track/${track.id}`}
          className="font-medium transition-colors hover:text-ink"
        >
          {track.short}
        </Link>
      </div>

      <p className="type-label mt-8" style={{ color: track.accent }}>
        {track.title}
      </p>
      <h1 className="type-title mt-3 text-[var(--text-h1)] text-ink">{lesson.title}</h1>
      <p className="mt-4 max-w-xl text-[var(--text-lead)] leading-relaxed text-ink-soft">
        {lesson.subtitle}
      </p>

      <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-[var(--line)] py-4">
        <span className="font-mono text-xs text-ink-faint">{lesson.minutes} min</span>
        <span className="type-label !normal-case !tracking-normal capitalize">
          {lesson.difficulty}
        </span>
        {lesson.tags.map((t) => (
          <span key={t} className="font-mono text-xs text-ink-faint">
            #{t}
          </span>
        ))}
        <div className="ml-auto">
          <CompleteButton slug={lesson.slug} />
        </div>
      </div>

      {lesson.prerequisites && lesson.prerequisites.length > 0 && (
        <p className="mt-6 text-sm text-ink-soft">
          Prerequisites:{" "}
          {lesson.prerequisites.map((p, i) => (
            <span key={p}>
              {i > 0 && ", "}
              <Link
                href={`/lesson/${p}`}
                className="font-semibold text-teal-deep underline decoration-teal/30 underline-offset-4"
              >
                {getLesson(p)?.title ?? p}
              </Link>
            </span>
          ))}
        </p>
      )}

      <div className="mt-12">
        <LessonBlocks blocks={lesson.blocks} />
      </div>

      <LessonQuiz slug={lesson.slug} questions={lesson.quiz} />

      <nav className="mt-16 flex flex-col gap-6 border-t border-[var(--line)] pt-10 sm:flex-row sm:justify-between">
        {prev ? (
          <Link href={`/lesson/${prev.slug}`} className="group max-w-xs">
            <p className="type-label">Previous</p>
            <p className="type-title mt-2 text-lg text-ink transition-colors group-hover:text-teal-deep">
              {prev.title}
            </p>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/lesson/${next.slug}`}
            className="group max-w-xs sm:text-right"
          >
            <p className="type-label">Next</p>
            <p className="type-title mt-2 text-lg text-ink transition-colors group-hover:text-teal-deep">
              {next.title}
            </p>
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </article>
  );
}
