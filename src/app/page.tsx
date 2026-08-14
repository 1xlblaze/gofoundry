import Link from "next/link";
import { tracks, allLessons } from "@/content";
import { HeroVisual } from "@/components/HeroVisual";
import { MotionRoot } from "@/components/MotionRoot";

const heat = [
  { k: "H", name: "Hear", blurb: "Clarify constraints & Go costs" },
  { k: "E", name: "Etch", blurb: "Architecture / algorithm diagram" },
  { k: "A", name: "Anchor", blurb: "Pattern + complexity target" },
  { k: "T", name: "Temper", blurb: "Idiomatic Go + proof" },
];

const audiences = [
  {
    title: "Students & new grads",
    body: "Learn patterns with diagrams, interview scripts, and a problem bank — not random LeetCode grinding.",
  },
  {
    title: "Working engineers",
    body: "Go beyond syntax: runtime internals, LLD, and HLD case studies with explicit A/B trade-offs.",
  },
  {
    title: "Interviewers & mentors",
    body: "A shared vocabulary (HEAT) so feedback is about thinking quality, not just “did it pass tests”.",
  },
];

export default function HomePage() {
  return (
    <MotionRoot>
      <section className="hero-bleed">
        <div className="hero-bleed-visual" aria-hidden>
          <HeroVisual />
        </div>
        <div className="shell hero-bleed-copy">
          <p className="brand-hero reveal" data-motion>
            GoFoundry
          </p>
          <h1 className="hero-line reveal-delay-1" data-motion>
            Think in Go. Diagram the trade-off. Ship the proof.
          </h1>
          <p className="lede reveal-delay-2" data-motion>
            {allLessons.length} lessons across DSA, internals, LLD, and HLD — taught with the
            Foundry HEAT method.
          </p>
          <div className="hero-actions reveal-delay-3" data-motion>
            <Link href="/learn" className="primary-btn">
              Start curriculum
            </Link>
            <Link href="/progress" className="secondary-btn">
              View progress
            </Link>
          </div>
        </div>
      </section>

      <section className="shell section">
        <div className="usp-banner" data-motion>
          <div>
            <h2>Foundry HEAT — one operating system for Go</h2>
            <p>
              Hear → Etch → Anchor → Temper. Students use it to pass interviews.
              Experienced engineers use it to design systems with explicit trade-offs.
            </p>
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

      <section className="shell section">
        <div className="section-head" data-motion>
          <div>
            <h2>Built for both ends of the ladder</h2>
            <p>One product. Two journeys. Same rigor.</p>
          </div>
        </div>
        <div className="grid-cards">
          {audiences.map((a) => (
            <div key={a.title} className="card" data-motion>
              <h3>{a.title}</h3>
              <p>{a.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="shell section" style={{ paddingBottom: "4rem" }}>
        <div className="section-head" data-motion>
          <div>
            <h2>Eight forges. {allLessons.length} lessons.</h2>
            <p>DSA through HLD — pick a track and start forging.</p>
          </div>
          <Link href="/learn" className="ghost-btn">
            Full curriculum →
          </Link>
        </div>
        <div className="grid-tracks">
          {tracks.map((t) => (
            <Link key={t.id} href={`/track/${t.id}`} className="track-card" data-motion>
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
            </Link>
          ))}
        </div>
      </section>
    </MotionRoot>
  );
}
