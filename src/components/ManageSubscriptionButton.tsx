"use client";

import { useState } from "react";

export function ManageSubscriptionButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPortal() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/stripe/portal", { method: "POST" });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        throw new Error(data.error ?? "Could not open billing portal");
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Portal failed");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        className={className ?? "secondary-btn"}
        onClick={openPortal}
        disabled={loading}
      >
        {loading ? "Opening…" : "Manage subscription"}
      </button>
      {error && (
        <p className="checkout-error" role="alert">{error}</p>
      )}
    </div>
  );
}
