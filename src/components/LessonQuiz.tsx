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
    <section className="mt-14 border-t border-[var(--line)] pt-10">
      <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
        Check your understanding
      </h2>
      <p className="mt-2 text-sm text-ink-soft">
        Answer all questions, then submit. A perfect score marks the lesson complete.
      </p>
      <div className="mt-8 space-y-8">
        {questions.map((q, qi) => (
          <fieldset key={q.id}>
            <legend className="font-semibold text-ink">
              {qi + 1}. {q.prompt}
            </legend>
            <div className="mt-3 space-y-2">
              {q.options.map((opt, oi) => {
                const selected = answers[q.id] === oi;
                let ring = "border-[var(--line)]";
                if (submitted) {
                  if (oi === q.answerIndex) ring = "border-teal bg-mint/20";
                  else if (selected) ring = "border-copper bg-copper/10";
                } else if (selected) {
                  ring = "border-teal bg-foam";
                }
                return (
                  <label
                    key={oi}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm transition ${ring}`}
                  >
                    <input
                      type="radio"
                      className="mt-1"
                      name={q.id}
                      checked={selected}
                      disabled={submitted}
                      onChange={() =>
                        setAnswers((prev) => ({ ...prev, [q.id]: oi }))
                      }
                    />
                    <span>{opt}</span>
                  </label>
                );
              })}
            </div>
            {submitted && (
              <p className="mt-3 text-sm text-ink-soft">{q.explanation}</p>
            )}
          </fieldset>
        ))}
      </div>
      {!submitted ? (
        <button
          type="button"
          onClick={onSubmit}
          disabled={Object.keys(answers).length < questions.length}
          className="mt-8 rounded-full bg-teal-deep px-6 py-3 text-sm font-semibold text-foam transition hover:bg-teal disabled:cursor-not-allowed disabled:opacity-40"
        >
          Submit quiz
        </button>
      ) : (
        <p className="mt-8 text-sm font-medium text-ink">
          Score: {Math.round(score * 100)}% (
          {Math.round(score * questions.length)}/{questions.length})
        </p>
      )}
    </section>
  );
}
