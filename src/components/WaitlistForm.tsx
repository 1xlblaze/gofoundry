"use client";

import { useId, useState, type FormEvent } from "react";

type WaitlistFormProps = {
  tier?: string;
  source?: string;
  buttonLabel?: string;
};

type WaitlistResponse = {
  ok: boolean;
  error?: string;
};

export function WaitlistForm({
  tier,
  source,
  buttonLabel = "Join waitlist",
}: WaitlistFormProps) {
  const inputId = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, tier, source }),
      });
      const result = (await response.json().catch(() => null)) as WaitlistResponse | null;

      if (!response.ok || !result?.ok) {
        throw new Error(result?.error || "Something went wrong. Please try again.");
      }

      setEmail("");
      setStatus("success");
      setMessage("You’re on the list. We’ll share early access details soon.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <form className="price-waitlist-form" onSubmit={handleSubmit}>
      <label className="price-visually-hidden" htmlFor={inputId}>
        Work email
      </label>
      <div className="price-waitlist-controls">
        <input
          id={inputId}
          className="search-box price-waitlist-input"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={status === "submitting"}
          required
        />
        <button className="primary-btn price-waitlist-button" type="submit" disabled={status === "submitting"}>
          {status === "submitting" ? "Joining…" : buttonLabel}
        </button>
      </div>
      {message ? (
        <p
          className={`price-form-message price-form-${status}`}
          role={status === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
