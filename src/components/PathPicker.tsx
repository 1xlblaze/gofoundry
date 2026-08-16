import Link from "next/link";
import { AnimatedCard } from "@/components/ui";

export function PathPicker() {
  return (
    <section className="shell path-picker-section" aria-labelledby="path-picker-title">
      <div className="path-picker-head" data-motion>
        <p className="kicker">Choose your path</p>
        <h2 id="path-picker-title">Where should you start?</h2>
        <p>
          GoFoundry ladders from foundations to staff-grade interviews. Pick one entry — you can
          switch anytime.
        </p>
      </div>
      <div className="path-picker-grid" data-motion>
        <AnimatedCard href="/track/foundations" className="path-picker-card path-picker-foundations">
          <p className="path-picker-label">New to Go</p>
          <h3>Foundations</h3>
          <p>Plain-language on-ramp: types, control flow, structs, slices. ~2 hours to Concepts.</p>
          <span className="path-picker-cta">Start Foundations →</span>
        </AnimatedCard>
        <AnimatedCard href="/diagnostic" className="path-picker-card path-picker-placement">
          <p className="path-picker-label">Know Go already?</p>
          <h3>Placement quiz</h3>
          <p>15 questions — we recommend HEAT, internals, or Foundations based on your score.</p>
          <span className="path-picker-cta">Take placement →</span>
        </AnimatedCard>
        <AnimatedCard href="/learn" className="path-picker-card path-picker-staff">
          <p className="path-picker-label">Staff interview prep</p>
          <h3>HEAT curriculum</h3>
          <p>For engineers with 5+ years prepping senior/staff loops — concurrency, LLD, HLD.</p>
          <span className="path-picker-cta">Open curriculum →</span>
        </AnimatedCard>
      </div>
      <p className="path-picker-audience" data-motion>
        Built for <strong>engineers with 5+ years experience</strong> aiming at senior and staff
        interviews — with a dedicated Foundations on-ramp if Go is new.
      </p>
    </section>
  );
}
