"use client";

type DiagramStepperProps = {
  steps: string[];
  step: number;
  onStep: (index: number) => void;
  title?: string;
};

export function DiagramStepper({ steps, step, onStep, title }: DiagramStepperProps) {
  return (
    <div className="diagram-stepper" role="group" aria-label={title ?? "Diagram walkthrough"}>
      <div className="diagram-stepper-controls">
        <button
          type="button"
          className="ghost-btn diagram-stepper-btn"
          onClick={() => onStep(Math.max(0, step - 1))}
          disabled={step === 0}
          aria-label="Previous step"
        >
          ← Prev
        </button>
        <span className="diagram-stepper-index">
          Step {step + 1} / {steps.length}
        </span>
        <button
          type="button"
          className="ghost-btn diagram-stepper-btn"
          onClick={() => onStep(Math.min(steps.length - 1, step + 1))}
          disabled={step >= steps.length - 1}
          aria-label="Next step"
        >
          Next →
        </button>
      </div>
      <ol className="diagram-stepper-dots" aria-hidden>
        {steps.map((_, index) => (
          <li key={index}>
            <button
              type="button"
              className={`diagram-stepper-dot${index === step ? " is-active" : ""}${
                index < step ? " is-done" : ""
              }`}
              onClick={() => onStep(index)}
              aria-label={`Step ${index + 1}`}
            />
          </li>
        ))}
      </ol>
      <p className="diagram-stepper-text" role="status">{steps[step]}</p>
    </div>
  );
}
