import type { Metadata } from "next";
import { HeatCanvas } from "@/components/HeatCanvas";
import { heatFlowNodes, MotionDiagram } from "@/components/MotionDiagram";
import { ScrollReveal } from "@/components/ui";
import { buildPageMetadata } from "@/lib/site-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "HEAT Canvas",
  description:
    "Turn Go problem constraints into a diagram, pattern, complexity target, and tested implementation with the HEAT canvas.",
  path: "/heat",
});

export default function HeatPage() {
  return (
    <ScrollReveal>
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
      <MotionDiagram
        kicker="When the prompt is a wall of text"
        title="Four moves, then code"
        caption="Fill the canvas in order. Skip ahead only after the previous box is honest."
        nodes={heatFlowNodes}
        compact
      />
      <HeatCanvas />
    </div>
    </ScrollReveal>
  );
}
