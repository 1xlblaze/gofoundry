"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { WaitlistForm } from "@/components/WaitlistForm";
import { ScrollReveal } from "@/components/ui";
import {
  diagnosticPillars,
  diagnosticQuestions,
  type DiagnosticPillar,
} from "@/content/diagnostic";

const SCORE_STORAGE_KEY = "gofoundry:diagnostic:last-score";

const resources: {
  href: string;
  title: string;
  description: string;
  pillars: readonly DiagnosticPillar[];
}[] = [
  {
    href: "/track/foundations",
    title: "Go Foundations track",
    description: "Plain-language on-ramp if Go syntax or basics need a refresh.",
    pillars: ["Production Go"],
  },
  {
    href: "/track/internals",
    title: "Runtime internals track",
    description: "Build evidence-based intuition for scheduling, allocation, and GC.",
    pillars: ["Runtime internals", "Concurrency", "Production Go"],
  },
  {
    href: "/track/lld",
    title: "Low-level design track",
    description: "Practice limits, queues, APIs, and implementation trade-offs.",
    pillars: ["Low-level design", "System design"],
  },
  {
    href: "/lab",
    title: "Interactive Go Lab",
    description: "Run code and make concurrency behavior visible.",
    pillars: ["Concurrency", "Runtime internals"],
  },
  {
    href: "/lesson/scheduler-gpm",
    title: "Free G/P/M scheduler teaser",
    description: "Start with the runtime model behind goroutine execution.",
    pillars: ["Runtime internals"],
  },
];

function formatElapsed(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

export default function DiagnosticPage() {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [previousScore, setPreviousScore] = useState<number | null>(null);

  useEffect(() => {
    const loadSavedScore = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(SCORE_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as { percent?: unknown };
          if (typeof parsed.percent === "number") {
            const percent = parsed.percent;
            setPreviousScore((current) => current ?? percent);
          }
        }
      } catch {
        // A blocked or malformed localStorage value should never block the assessment.
      }
    }, 0);

    return () => window.clearTimeout(loadSavedScore);
  }, []);

  useEffect(() => {
    if (submitted) return;

    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [startedAt, submitted]);

  const result = useMemo(() => {
    const correct = diagnosticQuestions.reduce(
      (total, question) =>
        total + (answers[question.id] === question.answerIndex ? 1 : 0),
      0,
    );
    const percent = Math.round((correct / diagnosticQuestions.length) * 100);
    const pillars = diagnosticPillars.map((pillar) => {
      const questions = diagnosticQuestions.filter(
        (question) => question.pillar === pillar,
      );
      const pillarCorrect = questions.filter(
        (question) => answers[question.id] === question.answerIndex,
      ).length;

      return {
        pillar,
        correct: pillarCorrect,
        total: questions.length,
        percent: Math.round((pillarCorrect / questions.length) * 100),
      };
    });

    return { correct, percent, pillars };
  }, [answers]);

  const weakestPillar = result.pillars.reduce((weakest, pillar) =>
    pillar.percent < weakest.percent ? pillar : weakest,
  );

  function submitDiagnostic() {
    setSubmitted(true);
    setPreviousScore(result.percent);

    try {
      window.localStorage.setItem(
        SCORE_STORAGE_KEY,
        JSON.stringify({
          percent: result.percent,
          completedAt: new Date().toISOString(),
        }),
      );
    } catch {
      // The result remains available in this session when storage is unavailable.
    }
  }

  function retakeDiagnostic() {
    setAnswers({});
    setCurrentIndex(0);
    setSubmitted(false);
    setElapsedSeconds(0);
    setStartedAt(Date.now());
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const currentQuestion = diagnosticQuestions[currentIndex];
  const currentAnswer = answers[currentQuestion.id];
  const answeredCount = Object.keys(answers).length;
  const questionProgress = ((currentIndex + 1) / diagnosticQuestions.length) * 100;

  if (submitted) {
    const scoreLabel =
      result.percent >= 80
        ? "Staff-ready signal"
        : result.percent >= 60
          ? "Strong foundations"
          : "Core concepts to sharpen";

    return (
      <ScrollReveal>
      <div className="shell diag-page" id="diagnostic-results">
        <header className="page-hero diag-hero" data-motion>
          <span className="kicker">Staff Go Readiness · Results</span>
          <h1>Your readiness map</h1>
          <p>
            Use the breakdown as a study plan, not a credential. Staff-level work
            also depends on judgment, communication, and production evidence.
          </p>
        </header>

        <section className="panel diag-score-card" aria-labelledby="diag-score-title">
          <div className="diag-score-ring" aria-label={`${result.percent} percent`}>
            <strong>{result.percent}%</strong>
            <span>{result.correct}/{diagnosticQuestions.length}</span>
          </div>
          <div>
            <p className="type-label">{scoreLabel}</p>
            <h2 id="diag-score-title" className="type-title">
              {result.percent >= 80
                ? "Your fundamentals are interview-ready."
                : `Prioritize ${weakestPillar.pillar.toLowerCase()} next.`}
            </h2>
            <p>
              Completed in {formatElapsed(elapsedSeconds)}. Your latest score is
              saved on this device.
            </p>
          </div>
          <button className="secondary-btn diag-retake" type="button" onClick={retakeDiagnostic}>
            Retake assessment
          </button>
        </section>

        <section className="diag-section" aria-labelledby="diag-pillars-title">
          <div className="diag-section-head">
            <div>
              <p className="type-label">Capability profile</p>
              <h2 id="diag-pillars-title" className="type-title">
                Pillar breakdown
              </h2>
            </div>
            <p>Scores under 80% are useful signals for focused review.</p>
          </div>
          <div className="panel diag-breakdown">
            {result.pillars.map((pillar) => (
              <div className="diag-pillar" key={pillar.pillar}>
                <div className="diag-pillar-label">
                  <strong>{pillar.pillar}</strong>
                  <span>
                    {pillar.correct}/{pillar.total} · {pillar.percent}%
                  </span>
                </div>
                <div
                  className="diag-bar"
                  role="progressbar"
                  aria-label={`${pillar.pillar}: ${pillar.percent}%`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={pillar.percent}
                >
                  <span style={{ width: `${pillar.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="diag-section" aria-labelledby="diag-path-title">
          <div className="diag-section-head">
            <div>
              <p className="type-label">Recommended path</p>
              <h2 id="diag-path-title" className="type-title">
                Turn gaps into a practice plan
              </h2>
            </div>
            <p>
              {result.percent < 50
                ? "Scores under 50% often mean Foundations or core Concepts first — staff tracks assume comfort with Go basics."
                : "Start with resources marked for your weakest pillar, then reinforce the model by running code."}
            </p>
          </div>
          {result.percent < 50 ? (
            <div className="panel diag-foundations-callout" data-motion>
              <p className="type-label">Placement suggestion</p>
              <h3>Start with Go Foundations</h3>
              <p>
                Your score suggests refreshing syntax, values, and control flow before diving into
                scheduler internals or staff problem workspaces.
              </p>
              <Link href="/track/foundations" className="primary-btn">
                Open Foundations track →
              </Link>
            </div>
          ) : null}
          <div className="diag-resource-grid">
            {resources.map((resource) => {
              const isRecommended = resource.pillars.includes(weakestPillar.pillar);
              return (
                <Link
                  className={`panel diag-resource${isRecommended ? " diag-resource-recommended" : ""}`}
                  href={resource.href}
                  key={resource.href}
                >
                  {isRecommended ? <span className="chip chip-brand">Start here</span> : null}
                  <h3>{resource.title}</h3>
                  <p>{resource.description}</p>
                  <span className="diag-resource-link">Open resource →</span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="panel diag-waitlist" aria-labelledby="diag-waitlist-title">
          <div>
            <p className="type-label">GoFoundry Pro</p>
            <h2 id="diag-waitlist-title" className="type-title">
              {result.percent < 80
                ? "Build the missing reps with guided practice."
                : "Keep the edge with deeper production drills."}
            </h2>
            <p>
              Join the Pro waitlist for advanced labs, race detection, benchmarks,
              and staff-level design feedback.
            </p>
          </div>
          <WaitlistForm
            tier="pro"
            source="diagnostic"
            buttonLabel="Join Pro waitlist"
          />
        </section>

        <details className="panel diag-review">
          <summary>Review answers and explanations</summary>
          <div className="diag-review-list">
            {diagnosticQuestions.map((question, index) => {
              const selected = answers[question.id];
              const isCorrect = selected === question.answerIndex;
              return (
                <article
                  className={`diag-review-item ${isCorrect ? "diag-review-correct" : "diag-review-wrong"}`}
                  key={question.id}
                >
                  <p className="type-label">
                    {String(index + 1).padStart(2, "0")} · {question.pillar}
                  </p>
                  <h3>{question.prompt}</h3>
                  <p>
                    <strong>Your answer:</strong> {question.options[selected]}
                  </p>
                  {!isCorrect ? (
                    <p>
                      <strong>Correct answer:</strong>{" "}
                      {question.options[question.answerIndex]}
                    </p>
                  ) : null}
                  <p className="diag-explanation">{question.explanation}</p>
                </article>
              );
            })}
          </div>
        </details>
      </div>
      </ScrollReveal>
    );
  }

  return (
    <ScrollReveal>
    <div className="shell diag-page">
      <header className="page-hero diag-hero" data-motion>
        <span className="kicker">Placement quiz · ~15 min</span>
        <h1>Find the gaps before the interview does.</h1>
        <p>
          Fifteen practical questions across Go internals, concurrency, production engineering,
          and system design. We recommend Foundations, HEAT, or internals based on your score.
          No account required.
        </p>
        {previousScore !== null ? (
          <p className="diag-last-score">
            Last score on this device: <strong>{previousScore}%</strong>
          </p>
        ) : null}
      </header>

      <section className="panel diag-quiz" aria-labelledby="diag-question-title" data-motion>
        <div className="diag-quiz-topline">
          <div>
            <span className="type-label">
              Question {currentIndex + 1} of {diagnosticQuestions.length}
            </span>
            <span className="chip">{currentQuestion.pillar}</span>
          </div>
          <div className="diag-timer" aria-label={`Elapsed time ${formatElapsed(elapsedSeconds)}`}>
            <span aria-hidden="true">◷</span>
            <strong>{formatElapsed(elapsedSeconds)}</strong>
            <small>guidance only</small>
          </div>
        </div>

        <div className="diag-question-progress" aria-hidden="true">
          <span className="diagnostic-progress-fill" style={{ width: `${questionProgress}%` }} />
        </div>

        <fieldset className="diag-fieldset">
          <legend id="diag-question-title">{currentQuestion.prompt}</legend>
          <div className="diag-options">
            {currentQuestion.options.map((option, optionIndex) => {
              const selected = currentAnswer === optionIndex;
              return (
                <button
                  className={`diag-option diagnostic-option${selected ? " diag-option-selected is-selected" : ""}`}
                  type="button"
                  aria-pressed={selected}
                  key={option}
                  onClick={() =>
                    setAnswers((current) => ({
                      ...current,
                      [currentQuestion.id]: optionIndex,
                    }))
                  }
                >
                  <span aria-hidden="true">{String.fromCharCode(65 + optionIndex)}</span>
                  {option}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="diag-controls">
          <button
            className="secondary-btn"
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
          >
            Back
          </button>
          <span>
            {answeredCount}/{diagnosticQuestions.length} answered
          </span>
          {currentIndex < diagnosticQuestions.length - 1 ? (
            <button
              className="primary-btn"
              type="button"
              disabled={currentAnswer === undefined}
              onClick={() =>
                setCurrentIndex((index) =>
                  Math.min(diagnosticQuestions.length - 1, index + 1),
                )
              }
            >
              Next question
            </button>
          ) : (
            <button
              className="primary-btn"
              type="button"
              disabled={answeredCount !== diagnosticQuestions.length}
              onClick={submitDiagnostic}
            >
              See my readiness map
            </button>
          )}
        </div>
      </section>

      <p className="diag-disclaimer">
        Take your time—the clock is only a pacing cue and never locks the assessment.
      </p>
    </div>
    </ScrollReveal>
  );
}
