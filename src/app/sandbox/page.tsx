import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sandbox architecture",
  description:
    "GoFoundry's gVisor-backed diagnostic execution cluster: escape analysis, -race, goleak, and benchmark gates.",
};

const pipeline = [
  { step: "go vet", detail: "Static analysis before compile" },
  { step: "go build -gcflags=\"-m -m\"", detail: "Escape analysis → Monaco markers" },
  { step: "go test -race", detail: "Race detector under concurrency" },
  { step: "goleak.VerifyNone", detail: "Goroutine leak assertions" },
  { step: "go test -benchmem", detail: "ns/op, B/op, allocs/op telemetry" },
];

export default function SandboxPage() {
  return (
    <div className="shell" style={{ padding: "2.5rem 0 4rem", maxWidth: 900 }}>
      <div className="page-hero">
        <p className="kicker">Execution cluster</p>
        <h1>Sandboxed diagnostic execution engine</h1>
        <p>
          GoFoundry runs staff-grade diagnostics in an isolated pipeline — local Go
          execution in development, gVisor-backed workers in production.
        </p>
      </div>

      <section className="panel prose-block" style={{ marginBottom: "1rem" }}>
        <h3>Architecture</h3>
        <pre className="sandbox-arch-diagram">{`User Code Submission
       │
       ▼
[Task Queue: Redis Streams / in-memory fallback]
       │
       ▼
[Worker Node (gVisor runsc / Linux cgroups v2)]
       ├─ Step 1: go vet ./...
       ├─ Step 2: go build -gcflags="-m -m" (parse escapes)
       ├─ Step 3: go test -race -v -run TestCorrectness
       ├─ Step 4: go test -bench=. -benchmem -benchtime=500ms
       └─ Step 5: JSON telemetry → SSE stream to Next.js`}</pre>
      </section>

      <section className="panel prose-block" style={{ marginBottom: "1rem" }}>
        <h3>Diagnostic pipeline (shipped)</h3>
        <ul className="sandbox-pipeline">
          {pipeline.map((item) => (
            <li key={item.step}>
              <code>{item.step}</code>
              <span>{item.detail}</span>
            </li>
          ))}
        </ul>
        <p>
          Results stream via <code>POST /api/diagnostics</code> +{" "}
          <code>GET /api/diagnostics/stream</code> (Server-Sent Events). Escape
          analysis markers map directly to Monaco editor annotations.
        </p>
      </section>

      <section className="panel prose-block" style={{ marginBottom: "1rem" }}>
        <h3>Deployment modes</h3>
        <ul>
          <li>
            <strong>Local executor</strong> — shells out to <code>go</code> in ephemeral temp
            dirs (default when <code>SANDBOX_WORKER_URL</code> is unset)
          </li>
          <li>
            <strong>Worker cluster</strong> — run <code>worker/</code> on port 8081 with
            gVisor/cgroup isolation for production
          </li>
          <li>
            <strong>Playground fallback</strong> — <code>/api/playground</code> for free-tier
            quick runs without full diagnostics
          </li>
        </ul>
      </section>

      <section className="panel prose-block" style={{ marginBottom: "1.5rem" }}>
        <h3>Database schema</h3>
        <p>
          PostgreSQL tables <code>users</code>, <code>problems</code>,{" "}
          <code>heat_submissions</code>, and <code>diagnostic_jobs</code> are defined in{" "}
          <code>db/migrations/001_platform_schema.sql</code>. Set{" "}
          <code>DATABASE_URL</code> to persist submissions.
        </p>
      </section>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
        <Link href="/problems/dsa-sliding-window-maximum" className="primary-btn">
          Try staff problem
        </Link>
        <Link href="/lab" className="secondary-btn">
          Open the Lab
        </Link>
        <Link href="/heat" className="ghost-btn">
          HEAT canvas
        </Link>
      </div>
    </div>
  );
}
