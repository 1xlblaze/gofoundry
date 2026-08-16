import Link from "next/link";
import { getLesson } from "@/content";
import { HeroSnippet } from "@/components/HeroSnippet";
import { HeroVisual } from "@/components/HeroVisual";
import { HomeTrackMap } from "@/components/HomeTrackMap";
import { PathPicker } from "@/components/PathPicker";
import { AnimatedCard, DifficultyChip, ScrollReveal, StatusChip } from "@/components/ui";
import { allLessons } from "@/content";

const featuredSlugs = [
  "foundations-welcome-to-go",
  "scheduler-gpm",
  "memory-and-performance",
  "lru-cache-lld",
];

export default function HomePage() {
  const featuredLessons = featuredSlugs
    .map((slug) => getLesson(slug))
    .filter((lesson): lesson is NonNullable<typeof lesson> => lesson !== undefined);

  return (
    <ScrollReveal>
      <section className="hero-bleed">
        <div className="hero-bleed-visual" aria-hidden>
          <HeroVisual />
        </div>
        <div className="shell hero-bleed-inner">
          <div className="hero-bleed-copy">
            <p className="kicker reveal" data-motion>Staff-Grade Go Mastery</p>
            <p className="brand-hero reveal" data-motion>GoFoundry</p>
            <h1 className="hero-line reveal-delay-1" data-motion>
              From Go foundations to staff-grade interviews.
            </h1>
            <p className="lede reveal-delay-2" data-motion>
              New to Go? Start Foundations. Preparing for senior or staff loops? Follow HEAT in the
              curriculum, practice sheet, and Lab.
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
        <div className="home-section-head" data-motion>
          <p className="kicker">Start learning</p>
          <h2>Free lesson samples</h2>
          <p>
            Read any lesson in the curriculum for free. Pro unlocks the full staff problem bank
            and advanced diagnostics.
          </p>
          <Link href="/learn" className="secondary-btn home-section-cta">
            Browse full curriculum →
          </Link>
        </div>

        <div className="teaser-grid home-samples-grid" data-motion>
          {featuredLessons.map((lesson) => (
            <AnimatedCard
              key={lesson.slug}
              href={`/lesson/${lesson.slug}`}
              className="teaser-card home-sample-card"
              accent={`var(--accent-${lesson.track === "foundations" ? "foundations" : lesson.track})`}
            >
              <div className="teaser-card-top">
                <StatusChip status="free" />
                <span className="teaser-chip teaser-chip-track">{lesson.track}</span>
              </div>
              <h3>{lesson.title}</h3>
              <p>{lesson.subtitle}</p>
              <div className="teaser-card-meta">
                <div className="teaser-card-badges">
                  <DifficultyChip level={lesson.difficulty} />
                  <span className="teaser-duration">{lesson.minutes} min</span>
                </div>
                <span className="teaser-card-cta">
                  Read lesson <span aria-hidden>→</span>
                </span>
              </div>
            </AnimatedCard>
          ))}
        </div>
      </section>

      <HomeTrackMap />
    </ScrollReveal>
  );
}
