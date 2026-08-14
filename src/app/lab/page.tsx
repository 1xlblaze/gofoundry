import type { Metadata } from "next";
import Link from "next/link";
import { ConcurrencyVisualizer } from "@/components/ConcurrencyVisualizer";
import { EscapeAnalyzer } from "@/components/EscapeAnalyzer";
import { GoWorkbench } from "@/components/GoWorkbench";

export const metadata: Metadata = {
  title: "Go Lab",
  description:
    "Run Go code in the browser and step through interactive visualizations of channels, WaitGroups, and select.",
};

const CURATED_STARTER = `package main

import (
\t"fmt"
\t"sync"
)

func square(worker int, jobs <-chan int, out chan<- string, wg *sync.WaitGroup) {
\tdefer wg.Done()
\tfor n := range jobs {
\t\tout <- fmt.Sprintf("worker %d → %d", worker, n*n)
\t}
}

func main() {
\tjobs := make(chan int)
\tresults := make(chan string)
\tvar wg sync.WaitGroup

\tfor worker := 1; worker <= 3; worker++ {
\t\twg.Add(1)
\t\tgo square(worker, jobs, results, &wg)
\t}

\tgo func() {
\t\tdefer close(jobs)
\t\tfor _, n := range []int{2, 3, 4, 5} {
\t\t\tjobs <- n
\t\t}
\t}()

\tgo func() {
\t\twg.Wait()
\t\tclose(results)
\t}()

\tfor result := range results {
\t\tfmt.Println(result)
\t}
}
`;

export default function LabPage() {
  return (
    <div className="shell lab-page">
      <header className="page-hero lab-hero">
        <span className="kicker">Interactive Go runtime lab</span>
        <h1>Go Lab</h1>
        <p className="lab-hero-line">
          Run Go in the browser. Watch concurrency unfold.
        </p>
        <p className="lab-hero-copy">
          Build an intuition for scheduling and synchronization, then edit and
          execute the same patterns against the official Go Playground.
        </p>
      </header>

      <section className="lab-section" aria-labelledby="visualizer-title">
        <div className="lab-section-head">
          <div>
            <span className="type-label">01 · See the runtime</span>
            <h2 id="visualizer-title">Concurrency, one event at a time</h2>
          </div>
          <p>
            Scrub through channel handoffs, blocked goroutines, WaitGroup
            countdowns, and select decisions.
          </p>
        </div>
        <ConcurrencyVisualizer />
      </section>

      <section className="lab-section" aria-labelledby="workbench-title">
        <div className="lab-section-head">
          <div>
            <span className="type-label">02 · Change the code</span>
            <h2 id="workbench-title">Turn the model into muscle memory</h2>
          </div>
          <p>
            Start with a bounded worker pool, or switch to Measure allocs for a
            real ReadMemStats comparison in the Playground runtime.
          </p>
        </div>
        <GoWorkbench
          initialCode={CURATED_STARTER}
          title="Worker pool · fan-out and fan-in"
        />
      </section>

      <section className="lab-section" aria-labelledby="escape-title">
        <div className="lab-section-head">
          <div>
            <span className="type-label">03 · Follow the allocation</span>
            <h2 id="escape-title">See why values leave the stack</h2>
          </div>
          <p>
            Explore compiler-style traces for returned pointers, boxed values,
            closure captures, and locals too large for the stack.
          </p>
        </div>
        <EscapeAnalyzer />
      </section>

      <section className="lab-section lab-cta" aria-labelledby="sandbox-title">
        <div>
          <span className="type-label">04 · Shape and stress the solution</span>
          <h2 id="sandbox-title">Take the next problem from sketch to proof</h2>
          <p>
            Build it in the HEAT canvas, or use the Pro sandbox for race detection,
            benchmark tooling, and live compiler escape output.
          </p>
        </div>
        <div className="bench-cta-actions">
          <Link className="secondary-btn" href="/heat">
            Open HEAT canvas
          </Link>
          <Link className="ghost-btn" href="/sandbox">
            How execution works
          </Link>
          <Link className="primary-btn" href="/pricing">
            Pro sandbox waitlist →
          </Link>
        </div>
      </section>
    </div>
  );
}
