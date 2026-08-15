import Link from "next/link";
import { allLessons, freeLessons, getTrack, tracks } from "@/content";
import { HeroSnippet } from "@/components/HeroSnippet";
import { learningLoopNodes, MotionDiagram } from "@/components/MotionDiagram";
import { HeroVisual } from "@/components/HeroVisual";
import { AnimatedCard, DifficultyChip, ScrollReveal, StatusChip } from "@/components/ui";
import { pillars } from "@/content/pillars";

const heat = [
  { k: "H", name: "Hear", blurb: "Clarify constraints & Go costs" },
  { k: "E", name: "Etch", blurb: "Architecture / algorithm diagram" },
  { k: "A", name: "Anchor", blurb: "Pattern + complexity target" },
  { k: "T", name: "Temper", blurb: "Idiomatic Go + proof" },
];

export default function HomePage() {
  return (
    <ScrollReveal>
      <section className="hero-bleed">
        <div className="hero-bleed-visual" aria-hidden>
          <HeroVisual />
        </div>
        <div className="shell hero-bleed-copy">
          <p className="kicker reveal" data-motion>
            Staff-Grade Go Mastery
          </p>
          <p className="brand-hero reveal" data-motion>
            GoFoundry
          </p>
          <h1 className="hero-line reveal-delay-1" data-motion>
            Master concurrency, runtime internals, and cloud-native Go.
          </h1>
          <p className="lede reveal-delay-2" data-motion>
            Hear the constraints, etch a diagram, anchor a pattern, then temper it in the Lab.
            Start a lesson today — the full curriculum is free during public beta.
          </p>
          <div className="hero-actions reveal-delay-3" data-motion>
            <Link href="/learn" className="primary-btn">
              Start curriculum
            </Link>
            <Link href="/lab" className="secondary-btn">
              Try the Lab
            </Link>
          </div>
          <MotionDiagram
            kicker="The learning loop"
            title="Read → diagram → prove → recall"
            caption="One path through the platform — not four competing front doors."
            nodes={learningLoopNodes}
            compact
          />
          <HeroSnippet />
        </div>
      </section>

      <section className="shell section teaser-section">
        <div className="section-head" data-motion>
          <div>
            <p className="kicker">Start with the real material</p>
            <h2>Open deep dives (no paywall)</h2>
            <p>
              Read complete staff-grade samples on the runtime, allocation, and compiler behavior
              that shapes production Go.
            </p>
          </div>
        </div>
        <div className="teaser-grid">
          {freeLessons.map((lesson) => {
            const track = getTrack(lesson.track);
            return (
              <AnimatedCard
                key={lesson.slug}
                href={`/lesson/${lesson.slug}`}
                className="teaser-card"
                accent={track.accent}
              >
                <div className="teaser-card-top">
                  <StatusChip status="free" />
                  <span className="teaser-chip">{track.short}</span>
                </div>
                <h3>{lesson.title}</h3>
                <p>{lesson.subtitle}</p>
                <div className="teaser-card-meta">
                  <DifficultyChip level={lesson.difficulty} />
                  <span>{lesson.minutes} min</span>
                  <strong>
                    Read lesson <span aria-hidden>→</span>
                  </strong>
                </div>
              </AnimatedCard>
            );
          })}
        </div>
      </section>

      <section className="shell section">
        <div className="section-head" data-motion>
          <div>
            <p className="kicker">The four pillars</p>
            <h2>Go depth that compounds at staff level</h2>
            <p>
              Move from runtime mechanics to production architecture, with every trade-off grounded
              in the way Go actually behaves.
            </p>
          </div>
        </div>
        <div className="grid-tracks">
          {pillars.map((pillar) => (
            <AnimatedCard
              key={pillar.id}
              href={pillar.href}
              className="track-card"
              accent={pillar.accent}
              style={{ borderTopColor: pillar.accent }}
            >
              <div className="meta-row" style={{ marginTop: 0, marginBottom: "0.55rem" }}>
                {pillar.trackIds.map((trackId) => (
                  <span
                    key={trackId}
                    className="chip"
                    style={{
                      color: pillar.accent,
                      borderColor: `${pillar.accent}33`,
                      background: `${pillar.accent}10`,
                    }}
                  >
                    {getTrack(trackId).short}
                  </span>
                ))}
              </div>
              <h3>{pillar.title}</h3>
              <p>{pillar.tagline}</p>
              <div className="meta-row">
                {pillar.focusAreas.map((area) => (
                  <span key={area} className="chip">
                    {area}
                  </span>
                ))}
              </div>
            </AnimatedCard>
          ))}
        </div>
      </section>

      <section className="shell section">
        <div className="usp-banner" data-motion>
          <div>
            <p className="kicker">The interview operating system</p>
            <h2>Foundry HEAT turns deep knowledge into a staff-level signal</h2>
            <p>
              Hear → Etch → Anchor → Temper. Clarify the system, diagram the pressure points, choose
              an invariant, then implement and prove it with idiomatic Go.
            </p>
            <Link href="/heat" className="ghost-btn" style={{ marginTop: "0.85rem" }}>
              Open HEAT canvas →
            </Link>
          </div>
          <div className="heat-grid">
            {heat.map((h) => (
              <div key={h.k} className="heat-step" data-motion>
                <strong>
                  {h.k} · {h.name}
                </strong>
                <span>{h.blurb}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="shell section staff-bar-section" data-motion>
        <div className="panel staff-bar-panel">
          <div>
            <p className="kicker">Prove it in production</p>
            <h2>The 4-gate staff bar</h2>
            <p>
              Tests, race detection, leak checks, and allocs/op — run inside staff problems when
              you are ready to temper a solution.
            </p>
          </div>
          <div className="staff-bar-chips">
            <span className="chip">Tests</span>
            <span className="chip">Race</span>
            <span className="chip">Leak</span>
            <span className="chip">Bench</span>
          </div>
          <Link href="/problems" className="primary-btn">
            Open staff problems →
          </Link>
        </div>
      </section>

      <section className="shell section" style={{ paddingBottom: "4rem" }}>
        <div className="section-head" data-motion>
          <div>
            <p className="kicker">All tracks</p>
            <h2>Eight tracks. {allLessons.length} deep lessons.</h2>
            <p>Build the foundations, then go deep on Go internals, component design, and HLD.</p>
          </div>
          <Link href="/learn" className="ghost-btn">
            Full curriculum →
          </Link>
        </div>
        <div className="grid-tracks">
          {tracks.map((t) => (
            <AnimatedCard
              key={t.id}
              href={`/track/${t.id}`}
              className="track-card"
              accent={t.accent}
            >
              <div className="meta-row" style={{ marginTop: 0, marginBottom: "0.55rem" }}>
                <span
                  className="chip chip-brand"
                  style={{ color: t.accent, borderColor: `${t.accent}33` }}
                >
                  {t.short}
                </span>
              </div>
              <h3>{t.title}</h3>
              <p>{t.description}</p>
            </AnimatedCard>
          ))}
        </div>
      </section>
    </ScrollReveal>
  );
}
