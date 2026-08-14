"use client";

import Link from "next/link";
import { useId, useState } from "react";

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
    <div className="hero-lab-card" data-motion>
      <div className="hero-lab-heading">
        <div>
          <p className="hero-lab-kicker">Run the proof</p>
          <h2>Can you spot the goroutine leak?</h2>
        </div>
        <Link href="/lab" className="hero-lab-link">
          Open full Lab <span aria-hidden>→</span>
        </Link>
      </div>

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
          rows={12}
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
