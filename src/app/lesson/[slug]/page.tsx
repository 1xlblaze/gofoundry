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
import { ReadingProgress } from "@/components/ReadingProgress";

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
    <article
      id="lesson-article"
      className="shell"
      style={{ maxWidth: 820, padding: "2.25rem 0 3.5rem" }}
    >
      <ReadingProgress articleId="lesson-article" />
      <div className="reveal" style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem", fontSize: "0.82rem", color: "var(--muted)" }}>
        <Link href="/learn">Curriculum</Link>
        <span aria-hidden>/</span>
        <Link href={`/track/${track.id}`}>{track.short}</Link>
      </div>

      <div className="lesson-header panel reveal-delay-1" style={{ marginTop: "1.1rem" }}>
        <p className="type-label" style={{ color: track.accent, margin: 0 }}>
          {track.title}
        </p>
        <h1>{lesson.title}</h1>
        <p>{lesson.subtitle}</p>
        <div className="meta-row">
          <span className="chip">{lesson.minutes} min</span>
          <span className="chip chip-brand" style={{ textTransform: "capitalize" }}>
            {lesson.difficulty}
          </span>
          {lesson.tags.map((t) => (
            <span key={t} className="chip">
              #{t}
            </span>
          ))}
          <div style={{ marginLeft: "auto" }}>
            <CompleteButton slug={lesson.slug} />
          </div>
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

      {next ? (
        <aside style={{ marginTop: "2rem" }} aria-label="Up next">
          <p className="type-label" style={{ marginBottom: "0.65rem" }}>
            Up next
          </p>
          <Link
            href={`/lesson/${next.slug}`}
            className="card group"
            style={{ maxWidth: "34rem", marginLeft: "auto" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "1rem",
              }}
            >
              <div>
                <h3>{next.title}</h3>
                <p>{next.subtitle}</p>
              </div>
              <span className="chip" style={{ flexShrink: 0 }}>
                {next.minutes} min
              </span>
            </div>
          </Link>
        </aside>
      ) : null}
    </article>
  );
}
