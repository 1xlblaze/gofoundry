"use client";

import { useState } from "react";

type CheckoutButtonProps = {
  plan: "pro-monthly" | "pro-yearly" | "team-yearly";
  label: string;
  className?: string;
};

export function CheckoutButton({ plan, label, className }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkout() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        throw new Error(data.error ?? "Checkout failed");
      }

      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        className={className ?? "primary-btn price-full-button"}
        onClick={checkout}
        disabled={loading}
      >
        {loading ? "Redirecting…" : label}
      </button>
      {error && (
        <p className="checkout-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
