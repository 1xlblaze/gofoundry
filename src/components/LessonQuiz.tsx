"use client";

import { useEffect, useState } from "react";
import type { QuizQuestion } from "@/content/types";
import { saveQuizScore } from "@/lib/progress";

export function LessonQuiz({
  slug,
  questions,
}: {
  slug: string;
  questions: QuizQuestion[];
}) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    setAnswers({});
    setSubmitted(false);
    setScore(0);
  }, [slug]);

  if (!questions.length) return null;

  function onSubmit() {
    let correct = 0;
    for (const q of questions) {
      if (answers[q.id] === q.answerIndex) correct++;
    }
    const ratio = correct / questions.length;
    setScore(ratio);
    setSubmitted(true);
    saveQuizScore(slug, ratio);
  }

  return (
    <section className="mt-16 border-t border-[var(--line)] pt-12">
      <p className="type-label">Quiz</p>
      <h2 className="type-title mt-2 text-[var(--text-h2)] text-ink">
        Check your understanding
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">
        Answer all questions, then submit. A perfect score marks the lesson complete.
      </p>
      <div className="mt-10 space-y-10">
        {questions.map((q, qi) => (
          <fieldset key={q.id}>
            <legend className="type-title text-[1.05rem] text-ink">
              <span className="mr-2 font-mono text-sm text-ink-faint">
                {String(qi + 1).padStart(2, "0")}
              </span>
              {q.prompt}
            </legend>
            <div className="mt-4 space-y-2">
              {q.options.map((opt, oi) => {
                const selected = answers[q.id] === oi;
                let ring = "border-[var(--line)] bg-foam/40";
                if (submitted) {
                  if (oi === q.answerIndex) ring = "border-teal bg-mint/20";
                  else if (selected) ring = "border-copper bg-copper/10";
                } else if (selected) {
                  ring = "border-teal bg-foam";
                }
                return (
                  <label
                    key={oi}
                    className={`flex cursor-pointer items-start gap-3 border px-4 py-3.5 text-sm leading-relaxed transition ${ring}`}
                  >
                    <input
                      type="radio"
                      className="mt-1 accent-[var(--signal)]"
                      name={q.id}
                      checked={selected}
                      disabled={submitted}
                      onChange={() =>
                        setAnswers((prev) => ({ ...prev, [q.id]: oi }))
                      }
                    />
                    <span className="text-ink-soft">{opt}</span>
                  </label>
                );
              })}
            </div>
            {submitted && (
              <p className="type-serif mt-3 text-sm text-ink-soft">{q.explanation}</p>
            )}
          </fieldset>
        ))}
      </div>
      {!submitted ? (
        <button
          type="button"
          onClick={onSubmit}
          disabled={Object.keys(answers).length < questions.length}
          className="btn-primary mt-10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Submit quiz
        </button>
      ) : (
        <p className="mt-10 font-mono text-sm text-ink">
          Score {Math.round(score * 100)}% · {Math.round(score * questions.length)}/
          {questions.length}
        </p>
      )}
    </section>
  );
}
