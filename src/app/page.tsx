import Link from "next/link";
import { allLessons, freeLessons, getTrack } from "@/content";
import { HeroSnippet } from "@/components/HeroSnippet";
import { HeroVisual } from "@/components/HeroVisual";
import { HomeTrackMap } from "@/components/HomeTrackMap";
import { PathPicker } from "@/components/PathPicker";
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
        <div className="shell hero-bleed-inner">
          <div className="hero-bleed-copy">
            <p className="kicker reveal" data-motion>
              Staff-Grade Go Mastery
            </p>
            <p className="brand-hero reveal" data-motion>
              GoFoundry
            </p>
            <h1 className="hero-line reveal-delay-1" data-motion>
              From Go foundations to staff-grade interviews.
            </h1>
            <p className="lede reveal-delay-2" data-motion>
              New to Go? Start Foundations. Preparing for senior or staff loops? Follow HEAT —
              hear constraints, etch a diagram, anchor a pattern, temper it in the Lab.
            </p>
            <ul
              className="hero-trust-strip reveal-delay-2"
              data-motion
              aria-label="Platform highlights"
            >
              <li>{allLessons.length} lessons</li>
              <li>Foundations on-ramp</li>
              <li>2 free staff problems</li>
              <li>HEAT method</li>
            </ul>
            <div className="hero-actions hero-actions-heat reveal-delay-3" data-motion>
              <Link href="#choose-path" className="primary-btn hero-primary-cta">
                Choose your path
              </Link>
              <nav className="hero-heat-steps" aria-label="Next HEAT steps">
                {heatSteps.map((item) => (
                  <Link key={item.step} href={item.href} className="hero-heat-step">
                    <strong>{item.step}</strong>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </div>
          <div className="hero-lab-bleed reveal-delay-3" data-motion>
            <HeroSnippet />
          </div>
        </div>
      </section>

      <div id="choose-path">
        <PathPicker />
      </div>

      <section className="shell section home-samples-section">
        <div className="section-head" data-motion>
          <div>
            <p className="kicker">Start learning</p>
            <h2>Free deep dives — read the curriculum</h2>
            <p>
              Four staff-grade samples across concepts, internals, and design. Lesson reading
              stays free — Pro unlocks the full staff problem bank.
            </p>
          </div>
        </div>

        <div className="teaser-grid home-samples-grid" data-motion>
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

      <HomeTrackMap />
    </ScrollReveal>
  );
}
