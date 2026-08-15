import Link from "next/link";
import { allLessons, freeLessons, getTrack, tracks } from "@/content";
import { HeroSnippet } from "@/components/HeroSnippet";
import {
  diagnosticGateNodes,
  heatFlowNodes,
  learningLoopNodes,
  MotionDiagram,
} from "@/components/MotionDiagram";
import { HeroVisual } from "@/components/HeroVisual";
import { AnimatedCard, DifficultyChip, ScrollReveal, StatusChip } from "@/components/ui";
import { pillars } from "@/content/pillars";

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
            caption="When a page gets dense, start here. Each node is a short path, not another wall of text."
            nodes={learningLoopNodes}
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
        <MotionDiagram
          kicker="The interview operating system"
          title="HEAT: Hear → Etch → Anchor → Temper"
          caption="Four moves that turn a deep-dive into a staff-level signal. Open the canvas when the problem is too big to hold in prose."
          nodes={heatFlowNodes}
        />
      </section>

      <section className="shell section">
        <MotionDiagram
          kicker="Prove it without a second playground"
          title="The 4-gate staff bar"
          caption="Unit tests, race detection, leak checks, and allocs/op — the same gates used in production interviews. Jump in when you are ready to run code."
          nodes={diagnosticGateNodes}
        />
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
