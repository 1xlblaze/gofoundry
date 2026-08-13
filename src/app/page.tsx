import Link from "next/link";
import { tracks, allLessons } from "@/content";
import { HeroVisual } from "@/components/HeroVisual";

export default function HomePage() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="mx-auto grid min-h-[calc(100vh-4.5rem)] max-w-6xl items-center gap-10 px-6 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:py-0">
          <div className="relative z-10 max-w-xl">
            <p className="brand-mark animate-rise text-4xl font-semibold tracking-tight text-teal-deep sm:text-5xl md:text-6xl">
              GoFoundry
            </p>
            <h1 className="animate-rise-delay mt-5 font-[family-name:var(--font-display)] text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
              Master Go from algorithms to distributed systems.
            </h1>
            <p className="animate-rise-delay-2 mt-5 max-w-md text-lg leading-relaxed text-ink-soft">
              Detailed DSA in Go, language concepts, runtime internals, LLD, and HLD —
              with quizzes and local progress tracking.
            </p>
            <div className="animate-rise-delay-2 mt-8 flex flex-wrap gap-3">
              <Link
                href="/learn"
                className="rounded-full bg-teal-deep px-6 py-3 text-sm font-semibold text-foam transition hover:bg-teal"
              >
                Open curriculum
              </Link>
              <Link
                href="/track/dsa"
                className="rounded-full border border-[var(--line)] bg-foam/70 px-6 py-3 text-sm font-semibold text-ink transition hover:border-teal"
              >
                Start with DSA
              </Link>
            </div>
          </div>
          <div className="relative hidden h-[min(70vh,520px)] lg:block">
            <HeroVisual />
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--line)] bg-foam/40 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
            Five tracks. One forge.
          </h2>
          <p className="mt-3 max-w-2xl text-ink-soft">
            {allLessons.length} lessons spanning interview algorithms through production
            system design — written for Go engineers.
          </p>
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {tracks.map((t) => (
              <Link
                key={t.id}
                href={`/track/${t.id}`}
                className="group block border-t-2 pt-5 transition"
                style={{ borderColor: t.accent }}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-soft">
                  {t.short}
                </p>
                <h3 className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold group-hover:text-teal-deep">
                  {t.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{t.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
