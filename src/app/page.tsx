import Link from "next/link";
import { tracks, allLessons } from "@/content";
import { HeroVisual } from "@/components/HeroVisual";

export default function HomePage() {
  return (
    <div>
      <section className="relative min-h-[calc(100vh-3.75rem)] overflow-hidden">
        <div className="hero-plane" aria-hidden>
          <HeroVisual />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-3.75rem)] max-w-6xl items-end px-6 pb-16 pt-20 sm:items-center sm:pb-20 sm:pt-10">
          <div className="max-w-2xl">
            <p
              className="brand-mark animate-rise text-[var(--text-display)] text-ink"
              style={{
                background:
                  "linear-gradient(105deg, #0b1220 20%, #005a54 55%, #0b1220 90%)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                animation: "rise 0.85s cubic-bezier(0.16, 1, 0.3, 1) both, sheen 8s ease infinite alternate",
              }}
            >
              GoFoundry
            </p>
            <h1 className="type-title animate-rise-delay mt-6 max-w-xl text-[clamp(1.65rem,3.2vw,2.35rem)] text-ink">
              From algorithms to distributed systems — in Go.
            </h1>
            <p className="animate-rise-delay-2 mt-5 max-w-md text-[var(--text-lead)] leading-relaxed text-ink-soft">
              DSA, language concepts, runtime internals, LLD, and HLD with quizzes and
              progress tracking.
            </p>
            <div className="animate-rise-delay-2 mt-9 flex flex-wrap gap-3">
              <Link href="/learn" className="btn-primary">
                Open curriculum
              </Link>
              <Link href="/track/dsa" className="btn-ghost">
                Start with DSA
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="relative border-t border-[var(--line)] bg-foam/50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <p className="type-label">Tracks</p>
          <h2 className="type-title mt-3 text-[var(--text-h2)] text-ink">
            Five disciplines. One forge.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
            {allLessons.length} lessons from interview algorithms to production system
            design — written for Go engineers.
          </p>

          <div className="mt-14 grid gap-x-10 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
            {tracks.map((t, i) => (
              <Link
                key={t.id}
                href={`/track/${t.id}`}
                className="group block border-t border-[var(--line-strong)] pt-6 transition"
                style={{ borderTopColor: t.accent }}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="type-label" style={{ color: t.accent }}>
                    {t.short}
                  </p>
                  <span className="font-mono text-xs text-ink-faint">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="type-title mt-3 text-[1.35rem] text-ink transition-colors group-hover:text-teal-deep">
                  {t.title}
                </h3>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
                  {t.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
