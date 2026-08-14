import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sandbox architecture",
  description:
    "How GoFoundry runs Go today via the Playground proxy, and what the Pro Docker sandbox will unlock for -race, benchmarks, and escape analysis.",
};

export default function SandboxPage() {
  return (
    <div className="shell" style={{ padding: "2.5rem 0 4rem", maxWidth: 820 }}>
      <div className="page-hero">
        <p className="kicker">Execution model</p>
        <h1>How Go runs on GoFoundry</h1>
        <p>
          You asked whether we can embed an open-source Go IDE or host a real runtime
          sandbox. Short answer: <strong>yes — and we already do the first layer.</strong>
        </p>
      </div>

      <section className="panel prose-block" style={{ marginBottom: "1rem" }}>
        <h3>Today — Go Playground proxy (shipped)</h3>
        <p>
          The Lab editor (Monaco) sends code to our <code>/api/playground</code> route, which
          proxies the official Go Playground (<code>play.golang.org</code>). You get:
        </p>
        <ul>
          <li>Instant compile + run for algorithmic and most concurrency demos</li>
          <li>
            Real allocation measurements via a <code>runtime.ReadMemStats</code> harness (not fake
            gauges)
          </li>
          <li>Zero infra cost and strong isolation (Google hosts the runners)</li>
        </ul>
        <p>
          Limits: no <code>-race</code>, no full <code>go test -bench</code>, no live{" "}
          <code>-gcflags=-m</code> dumps. Those need a private compiler toolchain.
        </p>
      </section>

      <section className="panel prose-block" style={{ marginBottom: "1rem" }}>
        <h3>Pro path — Docker / Firecracker sandbox (roadmap)</h3>
        <p>For Staff-grade diagnostics we will run ephemeral containers that execute:</p>
        <ul>
          <li>
            <code>go test -race</code> with leak checks (e.g. goleak)
          </li>
          <li>
            <code>go test -bench=. -benchmem</code> → real ns/op, B/op, allocs/op
          </li>
          <li>
            <code>go build -gcflags=&quot;-m -m&quot;</code> → live escape analysis
          </li>
        </ul>
        <p>
          That requires paid compute, strict CPU/memory/network limits, and a queue — which is why
          it sits behind the Pro tier rather than the free Playground path.
        </p>
      </section>

      <section className="panel prose-block" style={{ marginBottom: "1.5rem" }}>
        <h3>Open-source IDE options we evaluated</h3>
        <ul>
          <li>
            <strong>Monaco + Playground</strong> (what we ship) — best UX/cost for free tier
          </li>
          <li>
            <strong>code-server / Jupyter-go</strong> — heavy; better for Team workspaces later
          </li>
          <li>
            <strong>Yaegi / TinyGo WASM</strong> — incomplete stdlib/concurrency; not staff-faithful
          </li>
        </ul>
      </section>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
        <Link href="/lab" className="primary-btn">
          Open the Lab
        </Link>
        <Link href="/pricing" className="secondary-btn">
          Pro sandbox waitlist
        </Link>
        <Link href="/heat" className="ghost-btn">
          HEAT canvas
        </Link>
      </div>
    </div>
  );
}
