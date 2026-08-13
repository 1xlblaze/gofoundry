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
    <article className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex flex-wrap items-center gap-3 text-sm text-ink-soft">
        <Link href="/learn" className="hover:text-teal-deep">
          Curriculum
        </Link>
        <span>/</span>
        <Link href={`/track/${track.id}`} className="hover:text-teal-deep">
          {track.short}
        </Link>
      </div>

      <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight">
        {lesson.title}
      </h1>
      <p className="mt-3 text-lg text-ink-soft">{lesson.subtitle}</p>

      <div className="mt-6 flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-wide text-ink-soft">
        <span>{lesson.minutes} min</span>
        <span className="capitalize">{lesson.difficulty}</span>
        {lesson.tags.map((t) => (
          <span key={t}>#{t}</span>
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
              <Link href={`/lesson/${p}`} className="text-teal-deep underline">
                {getLesson(p)?.title ?? p}
              </Link>
            </span>
          ))}
        </p>
      )}

      <div className="mt-10">
        <LessonBlocks blocks={lesson.blocks} />
      </div>

      <LessonQuiz slug={lesson.slug} questions={lesson.quiz} />

      <nav className="mt-16 flex flex-col gap-4 border-t border-[var(--line)] pt-8 sm:flex-row sm:justify-between">
        {prev ? (
          <Link href={`/lesson/${prev.slug}`} className="group max-w-xs">
            <p className="text-xs uppercase tracking-wide text-ink-soft">Previous</p>
            <p className="font-semibold group-hover:text-teal-deep">{prev.title}</p>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/lesson/${next.slug}`} className="group max-w-xs sm:text-right">
            <p className="text-xs uppercase tracking-wide text-ink-soft">Next</p>
            <p className="font-semibold group-hover:text-teal-deep">{next.title}</p>
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </article>
  );
}
