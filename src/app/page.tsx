import Link from "next/link";
import { allLessons, freeLessons, getTrack, tracks } from "@/content";
import { HeroSnippet } from "@/components/HeroSnippet";
import { HeroVisual } from "@/components/HeroVisual";
import { AnimatedCard, DifficultyChip, ScrollReveal, StatusChip } from "@/components/ui";

const heatSteps = [
  { step: "Hear", label: "Curriculum", href: "/learn", blurb: "Clarify constraints" },
  { step: "Etch", label: "HEAT canvas", href: "/heat", blurb: "Sketch the flow" },
  { step: "Anchor", label: "Practice", href: "/problems", blurb: "Pick a pattern" },
  { step: "Temper", label: "Go Lab", href: "/lab", blurb: "Prove in running Go" },
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
            Follow HEAT: hear the constraints, etch a diagram, anchor a pattern, then temper it
            in the Lab. The full curriculum is free during public beta.
          </p>
          <div className="hero-actions hero-actions-heat reveal-delay-3" data-motion>
            <Link href="/learn" className="primary-btn hero-primary-cta">
              Hear — start curriculum
            </Link>
            <nav className="hero-heat-steps" aria-label="HEAT steps">
              {heatSteps.slice(1).map((item) => (
                <Link key={item.step} href={item.href} className="hero-heat-step">
                  <strong>{item.step}</strong>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
          <HeroSnippet />
        </div>
      </section>

      <section className="shell section home-explore-section">
        <div className="section-head" data-motion>
          <div>
            <p className="kicker">Start learning</p>
            <h2>Free deep dives + eight tracks</h2>
            <p>
              {allLessons.length} staff-grade lessons across runtime internals, DSA, LLD, and HLD.
              Open any free sample below or browse the full map.
            </p>
          </div>
          <Link href="/learn" className="ghost-btn">
            Full curriculum →
          </Link>
        </div>

        <div className="teaser-grid" data-motion>
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

        <div className="home-track-strip panel" data-motion>
          <p className="type-label">Eight tracks</p>
          <ul className="home-track-strip-list">
            {tracks.map((track) => (
              <li key={track.id}>
                <Link href={`/track/${track.id}`} className="home-track-strip-link">
                  <span className="home-track-strip-short" style={{ color: track.accent }}>
                    {track.short}
                  </span>
                  <span>{track.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </ScrollReveal>
  );
}
