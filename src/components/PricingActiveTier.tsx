"use client";

import { useEffect, useState } from "react";

type SessionResponse = {
  user?: { tier?: string };
};

export function PricingActiveTier() {
  const [tier, setTier] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((response) => response.json() as Promise<SessionResponse>)
      .then((session) => {
        const userTier = session?.user?.tier;
        if (userTier && userTier !== "free") setTier(userTier);
      })
      .catch(() => undefined);
  }, []);

  if (!tier) return null;

  return (
    <p className="price-active-tier" data-motion>
      Your plan: <strong>{tier}</strong>
    </p>
  );
}
