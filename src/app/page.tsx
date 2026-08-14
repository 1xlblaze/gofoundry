import Link from "next/link";
import { tracks, allLessons } from "@/content";
import { HeroVisual } from "@/components/HeroVisual";

const heat = [
  { k: "H", name: "Hear", blurb: "Clarify constraints & Go costs" },
  { k: "E", name: "Etch", blurb: "draw.io–style diagram first" },
  { k: "A", name: "Anchor", blurb: "Pattern + complexity target" },
  { k: "T", name: "Temper", blurb: "Idiomatic Go + proof" },
];

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
              className="brand-mark animate-rise text-[var(--text-display)]"
              style={{
                background:
                  "linear-gradient(105deg, #07151a 15%, #0b7a6e 50%, #07151a 85%)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                animation:
                  "rise 0.85s cubic-bezier(0.16, 1, 0.3, 1) both, sheen 8s ease infinite alternate",
              }}
            >
              GoFoundry
            </p>
            <h1 className="type-title animate-rise-delay mt-6 max-w-xl text-[clamp(1.55rem,3vw,2.2rem)] text-ink">
              The only Go curriculum built on HEAT — think, diagram, then code.
            </h1>
            <p className="animate-rise-delay-2 mt-5 max-w-md text-[var(--text-lead)] leading-relaxed text-ink-soft">
              DSA · concepts · internals · LLD · HLD — with how-to-think scripts,
              draw.io-style etchings, and interview answers.
            </p>
            <div className="animate-rise-delay-2 mt-9 flex flex-wrap gap-3">
              <Link href="/lesson/foundry-heat-method" className="btn-primary">
                Learn the HEAT method
              </Link>
              <Link href="/learn" className="btn-ghost">
                Open curriculum
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="relative border-t border-[var(--line)] bg-foam/55 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <p className="type-label">Unique USP</p>
          <h2 className="type-title mt-3 text-[var(--text-h2)] text-ink">
            Foundry HEAT cycle
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-soft">
            Other sites dump solutions. We forge a repeatable Go operating system:
            Hear the problem, Etch a diagram, Anchor the pattern, Temper with
            idiomatic code and proof.
          </p>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {heat.map((h) => (
              <div
                key={h.k}
                className="border border-[var(--line)] bg-foam/80 px-5 py-6"
              >
                <p className="brand-mark text-4xl text-teal-deep">{h.k}</p>
                <p className="type-title mt-3 text-lg">{h.name}</p>
                <p className="mt-2 text-sm text-ink-soft">{h.blurb}</p>
              </div>
            ))}
          </div>
          <Link
            href="/track/method"
            className="mt-8 inline-flex text-sm font-semibold text-teal-deep underline decoration-teal/30 underline-offset-4"
          >
            Enter the method track →
          </Link>
        </div>
      </section>

      <section className="relative border-t border-[var(--line)] py-24">
        <div className="mx-auto max-w-6xl px-6">
          <p className="type-label">Tracks</p>
          <h2 className="type-title mt-3 text-[var(--text-h2)] text-ink">
            Six forges. {allLessons.length} lessons.
          </h2>
          <div className="mt-14 grid gap-x-10 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
            {tracks.map((t, i) => (
              <Link
                key={t.id}
                href={`/track/${t.id}`}
                className="group block border-t pt-6 transition"
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
