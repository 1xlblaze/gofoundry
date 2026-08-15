"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";

const snippets = {
  leaky: {
    label: "Leaky anti-pattern",
    caption:
      "The jobs channel stays open, so both workers block forever. The function returns without cancellation or waiting for the WaitGroup.",
    code: `package main

import (
	"fmt"
	"runtime"
	"sync"
	"time"
)

func runLeakyPool(jobs <-chan int) {
	var wg sync.WaitGroup
	for id := 1; id <= 2; id++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for job := range jobs {
				fmt.Printf("worker %d: %d\\n", id, job*job)
			}
		}()
	}

	// No close, cancellation, or wg.Wait(): workers leak.
}

func main() {
	jobs := make(chan int, 2)
	jobs <- 3
	jobs <- 4
	runLeakyPool(jobs)

	time.Sleep(10 * time.Millisecond)
	fmt.Printf("workers still running: %d\\n", runtime.NumGoroutine()-1)
}`,
  },
  fixed: {
    label: "Staff-grade fix",
    caption:
      "Cancellation gives every worker an exit path. Waiting for the group proves shutdown completed before the function returns.",
    code: `package main

import (
	"context"
	"fmt"
	"sync"
)

func worker(ctx context.Context, id int, jobs <-chan int, wg *sync.WaitGroup) {
	defer wg.Done()
	for {
		select {
		case <-ctx.Done():
			fmt.Printf("worker %d stopped\\n", id)
			return
		case job := <-jobs:
			fmt.Printf("worker %d: %d\\n", id, job*job)
		}
	}
}

func main() {
	ctx, cancel := context.WithCancel(context.Background())
	jobs := make(chan int)

	var wg sync.WaitGroup
	for id := 1; id <= 2; id++ {
		wg.Add(1)
		go worker(ctx, id, jobs, &wg)
	}

	for _, job := range []int{3, 4} {
		jobs <- job
	}
	cancel()

	wg.Wait()
	fmt.Println("all workers drained")
}`,
  },
} as const;

type SnippetKey = keyof typeof snippets;

type PlaygroundEvent = {
  Message?: unknown;
};

type PlaygroundResult = {
  Errors?: unknown;
  Events?: unknown;
};

function formatOutput(result: PlaygroundResult) {
  const output: string[] = [];

  if (typeof result.Errors === "string" && result.Errors.trim()) {
    output.push(result.Errors);
  }

  if (Array.isArray(result.Events)) {
    for (const event of result.Events as PlaygroundEvent[]) {
      if (typeof event.Message === "string") output.push(event.Message);
    }
  }

  return output.join("").trimEnd();
}

export function HeroSnippet() {
  const panelId = useId();
  const [active, setActive] = useState<SnippetKey>("leaky");
  const [codes, setCodes] = useState<Record<SnippetKey, string>>({
    leaky: snippets.leaky.code,
    fixed: snippets.fixed.code,
  });
  const [output, setOutput] = useState("");
  const [hasRun, setHasRun] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    const compact = window.matchMedia("(max-width: 719px)");
    const sync = () => setExpanded(!compact.matches);
    sync();
    compact.addEventListener("change", sync);
    return () => compact.removeEventListener("change", sync);
  }, []);

  function selectSnippet(next: SnippetKey) {
    setActive(next);
    setHasRun(false);
    setOutput("");
  }

  async function runCode() {
    setIsRunning(true);
    setHasRun(true);
    setOutput("");

    try {
      const response = await fetch("/api/playground", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codes[active] }),
      });
      const result = (await response.json()) as PlaygroundResult;
      const formatted = formatOutput(result);

      setOutput(
        formatted ||
          (response.ok
            ? "Program completed with no output."
            : "The run failed without an error message."),
      );
    } catch {
      setOutput("Could not reach the playground. Check your connection and retry.");
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className={`hero-lab-card${expanded ? "" : " hero-lab-collapsed"}`} data-motion>
      <div className="hero-lab-heading">
        <div>
          <p className="hero-lab-kicker">Run the proof</p>
          <h2>Can you spot the goroutine leak?</h2>
        </div>
        <Link href="/lab" className="hero-lab-link">
          Open full Lab <span aria-hidden>→</span>
        </Link>
      </div>

      {!expanded ? (
        <LeakMotionPreview />
      ) : null}

      <button
        type="button"
        className="ghost-btn hero-lab-toggle"
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
      >
        {expanded ? "Hide interactive lab" : "Open interactive lab"}
      </button>

      <div className="hero-lab-tabs" role="tablist" aria-label="Code example">
        {(Object.keys(snippets) as SnippetKey[]).map((key) => (
          <button
            key={key}
            id={`${panelId}-${key}-tab`}
            className="hero-lab-tab"
            type="button"
            role="tab"
            aria-selected={active === key}
            aria-controls={`${panelId}-panel`}
            onClick={() => selectSnippet(key)}
          >
            {snippets[key].label}
          </button>
        ))}
      </div>

      <div
        id={`${panelId}-panel`}
        className="hero-lab-panel"
        role="tabpanel"
        aria-labelledby={`${panelId}-${active}-tab`}
      >
        <p className="hero-lab-caption">{snippets[active].caption}</p>
        <textarea
          className="hero-lab-editor"
          aria-label={`${snippets[active].label} Go code`}
          value={codes[active]}
          onChange={(event) =>
            setCodes((current) => ({ ...current, [active]: event.target.value }))
          }
          spellCheck={false}
          rows={8}
        />
        <div className="hero-lab-controls">
          <button
            className="hero-lab-run"
            type="button"
            onClick={runCode}
            disabled={isRunning}
          >
            {isRunning ? "Running…" : "Run Go"}
          </button>
          <span>Editable · Go Playground</span>
        </div>
        <div className="hero-lab-output" aria-live="polite" aria-busy={isRunning}>
          <span>Output</span>
          <pre>
            {isRunning
              ? "Compiling…"
              : hasRun
                ? output
                : "Run either version to inspect its shutdown behavior."}
          </pre>
        </div>
      </div>
    </div>
  );
}

function LeakMotionPreview() {
  return (
    <svg
      className="motion-diagram-svg"
      viewBox="0 0 640 150"
      role="img"
      aria-label="Leaky workers stay blocked; cancelled workers shut down."
    >
      <defs>
        <linearGradient id="leak-preview-stroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#0f766e" />
        </linearGradient>
      </defs>
      <path
        className="motion-diagram-path"
        d="M 40 75 H 600"
        fill="none"
        stroke="url(#leak-preview-stroke)"
        strokeWidth="3"
      />
      <g>
        <rect x="36" y="28" width="200" height="94" rx="14" fill="white" stroke="#dc2626" strokeWidth="2.5" />
        <text x="136" y="68" textAnchor="middle" fontWeight="800" fontSize="16" fill="#0b1220">
          Leak
        </text>
        <text x="136" y="92" textAnchor="middle" fontSize="12" fill="#64748b">
          channel never closes
        </text>
      </g>
      <g>
        <rect x="404" y="28" width="200" height="94" rx="14" fill="white" stroke="#0f766e" strokeWidth="2.5" />
        <text x="504" y="68" textAnchor="middle" fontWeight="800" fontSize="16" fill="#0b1220">
          Shutdown
        </text>
        <text x="504" y="92" textAnchor="middle" fontSize="12" fill="#64748b">
          context + WaitGroup
        </text>
      </g>
    </svg>
  );
}
