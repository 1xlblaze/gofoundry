import Link from "next/link";
import { AnimatedCard } from "@/components/ui";

const paths = [
  {
    href: "/track/foundations",
    className: "path-picker-foundations",
    label: "New to Go",
    title: "Foundations",
    description: "Plain-language on-ramp: types, control flow, structs, slices. ~2 hours to Concepts.",
    cta: "Start Foundations",
    featured: true,
    step: "1",
  },
  {
    href: "/diagnostic",
    className: "path-picker-placement",
    label: "Know Go already?",
    title: "Placement quiz",
    description: "15 questions — we recommend HEAT, internals, or Foundations based on your score.",
    cta: "Take placement",
    featured: false,
    step: "2",
  },
  {
    href: "/learn",
    className: "path-picker-staff",
    label: "Staff interview prep",
    title: "HEAT curriculum",
    description: "For engineers with 5+ years prepping senior/staff loops — concurrency, LLD, HLD.",
    cta: "Open curriculum",
    featured: false,
    step: "3",
  },
];

export function PathPicker() {
  return (
    <section className="shell path-picker-section" aria-labelledby="path-picker-title">
      <div className="path-picker-panel panel">
        <div className="path-picker-head" data-motion>
          <p className="kicker">Choose your path</p>
          <h2 id="path-picker-title">Where should you start?</h2>
          <p>
            One entry point — foundations, placement, or staff-grade HEAT. Switch tracks anytime.
          </p>
        </div>

        <div className="path-picker-grid" data-motion>
          {paths.map((path) => (
            <AnimatedCard
              key={path.href}
              href={path.href}
              className={`path-picker-card ${path.className}`}
            >
              <div className="path-picker-card-top">
                <span className="path-picker-step" aria-hidden>{path.step}</span>
                {path.featured ? <span className="path-picker-badge">Recommended</span> : null}
              </div>
              <p className="path-picker-label">{path.label}</p>
              <h3>{path.title}</h3>
              <p className="path-picker-desc">{path.description}</p>
              <span className="path-picker-cta">{path.cta} →</span>
            </AnimatedCard>
          ))}
        </div>

        <p className="path-picker-audience" data-motion>
          Built for <strong>senior and staff interview prep</strong> — with a dedicated Foundations
          on-ramp when Go is new.
        </p>
      </div>
    </section>
  );
}
