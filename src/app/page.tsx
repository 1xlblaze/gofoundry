import Link from "next/link";
import { tracks, allLessons } from "@/content";
import { HeroVisual } from "@/components/HeroVisual";

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
    <div>
      <section className="shell hero">
        <div className="hero-copy reveal">
          <p className="kicker">Foundry HEAT · Interview-ready Go</p>
          <h1>GoFoundry</h1>
          <p className="lede reveal-delay-1">
            The Go portal that teaches how to think — not just what to paste.
            Diagrams, A/B trade-offs, quizzes, and a progress ledger you can reset.
          </p>
          <div className="hero-actions reveal-delay-2">
            <Link href="/learn" className="primary-btn">
              Start curriculum
            </Link>
            <Link href="/progress" className="secondary-btn">
              View progress
            </Link>
          </div>
        </div>

        <div className="panel hero-panel float-y reveal-delay-2">
          <div style={{ height: "11rem", borderRadius: "12px", overflow: "hidden", opacity: 0.9 }}>
            <HeroVisual />
          </div>
          <div className="stat-row">
            <div className="stat">
              <strong>{allLessons.length}</strong>
              <span>Lessons</span>
            </div>
            <div className="stat">
              <strong>8</strong>
              <span>Tracks</span>
            </div>
            <div className="stat">
              <strong>HEAT</strong>
              <span>Method</span>
            </div>
          </div>
        </div>
      </section>

      <section className="shell section">
        <div className="usp-banner reveal">
          <div>
            <h2>Foundry HEAT — one operating system for Go</h2>
            <p>
              Hear → Etch → Anchor → Temper. Students use it to pass interviews.
              Experienced engineers use it to design systems with explicit trade-offs.
            </p>
          </div>
          <div className="heat-grid stagger">
            {heat.map((h) => (
              <div key={h.k} className="heat-step">
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
        <div className="section-head">
          <div>
            <h2>Built for both ends of the ladder</h2>
            <p>One product. Two journeys. Same rigor.</p>
          </div>
        </div>
        <div className="grid-cards stagger">
          {audiences.map((a) => (
            <div key={a.title} className="card">
              <h3>{a.title}</h3>
              <p>{a.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="shell section" style={{ paddingBottom: "4rem" }}>
        <div className="section-head">
          <div>
            <h2>Eight forges. {allLessons.length} lessons.</h2>
            <p>DSA through HLD — pick a track and start forging.</p>
          </div>
          <Link href="/learn" className="ghost-btn">
            Full curriculum →
          </Link>
        </div>
        <div className="grid-tracks stagger">
          {tracks.map((t) => (
            <Link key={t.id} href={`/track/${t.id}`} className="track-card">
              <div className="meta-row" style={{ marginTop: 0, marginBottom: "0.55rem" }}>
                <span className="chip chip-brand" style={{ color: t.accent, borderColor: `${t.accent}33` }}>
                  {t.short}
                </span>
              </div>
              <h3>{t.title}</h3>
              <p>{t.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
