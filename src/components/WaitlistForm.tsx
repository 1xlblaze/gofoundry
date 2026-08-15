"use client";

import { useId, useState, type FormEvent } from "react";

type WaitlistTierOption = {
  id: string;
  label: string;
};

type WaitlistFormProps = {
  tier?: string;
  source?: string;
  buttonLabel?: string;
  tierOptions?: WaitlistTierOption[];
};

type WaitlistResponse = {
  ok: boolean;
  error?: string;
};

export function WaitlistForm({
  tier: defaultTier,
  source,
  buttonLabel = "Join waitlist",
  tierOptions,
}: WaitlistFormProps) {
  const inputId = useId();
  const tierSelectId = useId();
  const initialTier = defaultTier ?? tierOptions?.[0]?.id ?? "team";
  const [tier, setTier] = useState(initialTier);
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
      {tierOptions && tierOptions.length > 1 ? (
        <label className="price-waitlist-tier-label" htmlFor={tierSelectId}>
          <span id={`${tierSelectId}-label`}>I&apos;m interested in</span>
          <select
            id={tierSelectId}
            className="price-waitlist-tier-select"
            aria-labelledby={`${tierSelectId}-label`}
            value={tier}
            onChange={(event) => setTier(event.target.value)}
            disabled={status === "submitting"}
          >
            {tierOptions.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
        </label>
      ) : null}
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
