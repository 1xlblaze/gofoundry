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
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    setAnswers({});
    setRevealed({});
    setSubmitted(false);
    setScore(0);
  }, [slug]);

  if (!questions.length) return null;

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount >= questions.length;

  function grade() {
    let correct = 0;
    for (const q of questions) {
      if (answers[q.id] === q.answerIndex) correct++;
    }
    return correct / questions.length;
  }

  function onSubmit() {
    const ratio = grade();
    setScore(ratio);
    setSubmitted(true);
    saveQuizScore(slug, ratio);
  }

  function onSelect(questionId: string, optionIndex: number) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
    setRevealed((prev) => ({ ...prev, [questionId]: true }));

    const nextAnswers = { ...answers, [questionId]: optionIndex };
    if (Object.keys(nextAnswers).length >= questions.length) {
      let correct = 0;
      for (const q of questions) {
        if (nextAnswers[q.id] === q.answerIndex) correct++;
      }
      const ratio = correct / questions.length;
      window.setTimeout(() => {
        setScore(ratio);
        setSubmitted(true);
        saveQuizScore(slug, ratio);
      }, 600);
    }
  }

  function optionClass(question: QuizQuestion, optionIndex: number, selected: boolean) {
    const showResult = submitted || revealed[question.id];
    let state = "lesson-quiz-option";

    if (showResult) {
      if (optionIndex === question.answerIndex) state += " lesson-quiz-option-correct";
      else if (selected) state += " lesson-quiz-option-wrong";
    } else if (selected) {
      state += " lesson-quiz-option-selected";
    }

    return state;
  }

  return (
    <section className="lesson-quiz" aria-labelledby="lesson-quiz-title">
      <p className="type-label">Comprehension check</p>
      <h2 id="lesson-quiz-title" className="lesson-quiz-heading">
        Check your understanding
      </h2>
      <p className="lesson-quiz-lead">
        Tap an answer for instant feedback. A perfect score marks the lesson complete.
      </p>
      <p className="lesson-quiz-progress" aria-live="polite">
        {answeredCount} of {questions.length} answered
      </p>

      <div className="lesson-quiz-list">
        {questions.map((q, qi) => (
          <fieldset key={q.id} className="lesson-quiz-fieldset">
            <legend className="lesson-quiz-legend">
              <span className="lesson-quiz-index">{String(qi + 1).padStart(2, "0")}</span>
              {q.prompt}
            </legend>
            <div className="lesson-quiz-options">
              {q.options.map((opt, oi) => {
                const selected = answers[q.id] === oi;
                return (
                  <label key={oi} className={optionClass(q, oi, selected)}>
                    <input
                      type="radio"
                      className="lesson-quiz-radio"
                      name={q.id}
                      checked={selected}
                      disabled={submitted}
                      onChange={() => onSelect(q.id, oi)}
                    />
                    <span className="lesson-quiz-option-text">{opt}</span>
                    {selected && !submitted && !revealed[q.id] ? (
                      <span className="lesson-quiz-pending" aria-hidden>…</span>
                    ) : null}
                    {(submitted || revealed[q.id]) && oi === q.answerIndex ? (
                      <span className="lesson-quiz-mark lesson-quiz-mark-ok" aria-hidden>✓</span>
                    ) : null}
                    {(submitted || revealed[q.id]) && selected && oi !== q.answerIndex ? (
                      <span className="lesson-quiz-mark lesson-quiz-mark-bad" aria-hidden>✕</span>
                    ) : null}
                  </label>
                );
              })}
            </div>
            {(submitted || revealed[q.id]) && (
              <p className="lesson-quiz-explanation">{q.explanation}</p>
            )}
          </fieldset>
        ))}
      </div>

      {submitted ? (
        <p className="lesson-quiz-score" role="status">
          Score {Math.round(score * 100)}% · {Math.round(score * questions.length)}/
          {questions.length}
          {score === 1 ? " · Lesson marked complete" : ""}
        </p>
      ) : (
        <button
          type="button"
          onClick={onSubmit}
          disabled={!allAnswered}
          className="primary-btn lesson-quiz-submit"
        >
          Submit quiz
        </button>
      )}
    </section>
  );
}
