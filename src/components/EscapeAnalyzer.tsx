"use client";

import { useId, useState } from "react";

type EscapeScenario = {
  id: string;
  label: string;
  title: string;
  summary: string;
  code: string;
  trace: string[];
  notes: string[];
  runnableCode: string;
};

const SCENARIOS: EscapeScenario[] = [
  {
    id: "returned-pointer",
    label: "Returned pointer",
    title: "Returning an address extends its lifetime",
    summary:
      "The local value must remain valid after counter returns, so the compiler moves its storage to the heap.",
    code: `func counter() *int {
\tn := 0
\treturn &n
}`,
    trace: [
      "./main.go:3:2: moved to heap: n",
      "./main.go:4:9: &n escapes to heap",
    ],
    notes: [
      "Returning &n lets the pointer outlive this stack frame.",
      "Go keeps the pointer safe by allocating n on the heap; returning a pointer to a local is valid.",
    ],
    runnableCode: `package main

import "fmt"

func counter() *int {
\tn := 0
\treturn &n
}

func main() {
\tn := counter()
\t*n++
\tfmt.Println(*n)
}
`,
  },
  {
    id: "interface-box",
    label: "Interface conversion",
    title: "A boxed value stored globally escapes",
    summary:
      "Converting the integer to any and storing it in a package variable makes the boxed value reachable beyond the call.",
    code: `var sink any

func box(n int) {
\tsink = n
}`,
    trace: ["./main.go:4:9: n escapes to heap"],
    notes: [
      "The interface value is assigned to a package-level variable, so its dynamic value outlives box.",
      "Interface conversion alone is not always a heap allocation; the escaping destination is what matters here.",
    ],
    runnableCode: `package main

import "fmt"

var sink any

func box(n int) {
\tsink = n
}

func main() {
\tbox(42)
\tfmt.Println(sink)
}
`,
  },
  {
    id: "closure-capture",
    label: "Closure capture",
    title: "A returned closure carries captured state",
    summary:
      "The function value escapes its creator, so the closure object stores the captured base value beyond makeAdder's frame.",
    code: `func makeAdder(base int) func(int) int {
\treturn func(n int) int {
\t\treturn base + n
\t}
}`,
    trace: [
      "./main.go:2:9: func literal escapes to heap",
      "./main.go:1:16: makeAdder capturing by value: base",
    ],
    notes: [
      "The returned function value is used after makeAdder returns.",
      "base is captured by value inside the escaping closure object; the compiler does not need to retain the original stack frame.",
    ],
    runnableCode: `package main

import "fmt"

func makeAdder(base int) func(int) int {
\treturn func(n int) int {
\t\treturn base + n
\t}
}

func main() {
\taddTen := makeAdder(10)
\tfmt.Println(addTen(5))
}
`,
  },
  {
    id: "large-stack-value",
    label: "Large local",
    title: "Oversized values are unsuitable for the stack",
    summary:
      "Even without a returned pointer, an exceptionally large local can be moved to the heap to stay within stack-allocation limits.",
    code: `var firstByte byte

func inspect() {
\tvar buffer [10 << 20]byte
\tbuffer[0] = 7
\tfirstByte = buffer[0]
}`,
    trace: [
      "./main.go:4:6: buffer escapes to heap: too large for stack",
      "./main.go:4:6: moved to heap: buffer",
    ],
    notes: [
      "buffer is 10 MiB, far larger than the compiler permits as a single stack object.",
      "This escape is size-driven, not caused by a pointer being returned or stored elsewhere.",
    ],
    runnableCode: `package main

import "fmt"

var firstByte byte

func inspect() {
\tvar buffer [10 << 20]byte
\tbuffer[0] = 7
\tfirstByte = buffer[0]
}

func main() {
\tinspect()
\tfmt.Println(firstByte)
}
`,
  },
];

export function EscapeAnalyzer({
  onRunEquivalent,
}: {
  onRunEquivalent?: (code: string) => void;
}) {
  const titleId = useId();
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id);
  const scenario =
    SCENARIOS.find((candidate) => candidate.id === scenarioId) ?? SCENARIOS[0];

  return (
    <div className="escape-root panel" aria-labelledby={titleId}>
      <div className="escape-header">
        <div>
          <span className="type-label">Curated compiler traces</span>
          <h3 id={titleId}>Why did this value escape?</h3>
        </div>
        {onRunEquivalent && (
          <button
            type="button"
            className="secondary-btn escape-run-btn"
            onClick={() => onRunEquivalent(scenario.runnableCode)}
          >
            Run equivalent →
          </button>
        )}
      </div>

      <div className="escape-picker" aria-label="Escape analysis scenario">
        {SCENARIOS.map((candidate) => (
          <button
            type="button"
            key={candidate.id}
            className={candidate.id === scenario.id ? "active" : ""}
            onClick={() => setScenarioId(candidate.id)}
            aria-pressed={candidate.id === scenario.id}
          >
            {candidate.label}
          </button>
        ))}
      </div>

      <div className="escape-intro">
        <h4>{scenario.title}</h4>
        <p>{scenario.summary}</p>
      </div>

      <div className="escape-columns">
        <section className="escape-code" aria-label="Go source">
          <div className="escape-column-label">main.go</div>
          <pre>
            <code>{scenario.code}</code>
          </pre>
        </section>

        <section className="escape-notes" aria-label="Escape analysis notes">
          <div className="escape-column-label">go build -gcflags=&quot;-m&quot;</div>
          <pre>
            {scenario.trace.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </pre>
          <ul>
            {scenario.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>
      </div>

      <p className="escape-honesty-note">
        Live <code>-gcflags=-m</code> requires the Pro compiler sandbox. These are
        curated compiler traces matching real Go escape rules.
      </p>
    </div>
  );
}
