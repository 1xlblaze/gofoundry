import Link from "next/link";
import { lessonsForTrack, tracks } from "@/content";
import { AnimatedCard } from "@/components/ui";

const trackFocus: Record<string, string> = {
  method: "Interview OS",
  dsa: "Patterns + proofs",
  concepts: "Language depth",
  stdlib: "Production APIs",
  web: "HTTP & services",
  internals: "Runtime truth",
  lld: "Components",
  hld: "Distributed scale",
};

export function HomeTrackMap() {
  return (
    <section className="shell section home-tracks-section" aria-labelledby="home-tracks-title">
      <div className="home-tracks-panel panel" data-motion>
        <div className="home-tracks-head">
          <div>
            <p className="kicker">Full curriculum map</p>
            <h2 id="home-tracks-title">Eight tracks — pick your depth</h2>
            <p>
              Each track is a guided path through staff-grade material. Start anywhere, but HEAT
              teaches how to think before you code.
            </p>
          </div>
          <Link href="/learn" className="secondary-btn home-tracks-cta">
            Open curriculum
          </Link>
        </div>

        <ol className="home-tracks-grid">
          {tracks.map((track, index) => {
            const lessonCount = lessonsForTrack(track.id).length;
            const focus = trackFocus[track.id] ?? "Deep dive";

            return (
              <li key={track.id}>
                <AnimatedCard
                  href={`/track/${track.id}`}
                  className="home-track-card"
                  accent={track.accent}
                  ariaLabel={`${track.title} — ${lessonCount} lessons`}
                >
                  <div className="home-track-card-glow" aria-hidden />
                  <div className="home-track-card-head">
                    <span className="home-track-badge">{track.short}</span>
                    <span className="home-track-index">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3>{track.title}</h3>
                  <p>{track.description}</p>
                  <div className="home-track-card-foot">
                    <span className="home-track-focus">{focus}</span>
                    <span className="home-track-meta">
                      {lessonCount} lessons <span aria-hidden>→</span>
                    </span>
                  </div>
                </AnimatedCard>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
