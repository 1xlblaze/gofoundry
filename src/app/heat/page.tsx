import type { Metadata } from "next";
import { HeatCanvas } from "@/components/HeatCanvas";

export const metadata: Metadata = {
  title: "HEAT Canvas",
  description:
    "Turn Go problem constraints into a diagram, pattern, complexity target, and tested implementation.",
};

export default function HeatPage() {
  return (
    <div className="shell heat-canvas-page">
      <header className="page-hero heat-canvas-hero">
        <span className="kicker">Hear · Etch · Anchor · Temper</span>
        <h1>HEAT Canvas</h1>
        <p>
          Slow down the decision-making, not the implementation. Capture the
          constraints, sketch the data flow, choose a pattern, and temper it in
          executable Go.
        </p>
      </header>
      <HeatCanvas />
    </div>
  );
}
