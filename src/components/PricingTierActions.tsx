"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckoutButton } from "@/components/CheckoutButton";
import { ManageSubscriptionButton } from "@/components/ManageSubscriptionButton";

type SessionResponse = {
  user?: { tier?: string; name?: string | null };
};

export function PricingTierActions({
  tierId,
  billingLive,
}: {
  tierId: "free" | "pro" | "team";
  billingLive: boolean;
}) {
  const [session, setSession] = useState<SessionResponse | null | undefined>(undefined);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((response) => response.json() as Promise<SessionResponse>)
      .then((data) => setSession(data))
      .catch(() => setSession(null));
  }, []);

  if (tierId === "free") {
    return (
      <Link href="/track/foundations" className="primary-btn price-full-button">
        Start Foundations
      </Link>
    );
  }

  if (tierId === "team") {
    return (
      <Link href="#pricing-waitlist" className="secondary-btn price-full-button">
        Join waitlist below
      </Link>
    );
  }

  const userTier = session?.user?.tier ?? "free";
  const isPaid = userTier === "pro" || userTier === "cohort";
  const signedIn = Boolean(session?.user);

  if (session === undefined) {
    return (
      <Link href="/pricing" className="secondary-btn price-full-button">
        Loading…
      </Link>
    );
  }

  if (isPaid && signedIn) {
    return <ManageSubscriptionButton className="primary-btn price-full-button" />;
  }

  if (billingLive && signedIn) {
    return (
      <div className="price-checkout-group">
        <CheckoutButton plan="pro-monthly" label="Subscribe monthly" />
        <CheckoutButton
          plan="pro-yearly"
          label="Subscribe yearly"
          className="secondary-btn price-full-button"
        />
      </div>
    );
  }

  return (
    <Link
      href={billingLive ? "/login" : "/problems/dsa-01-slice-headers"}
      className="primary-btn price-full-button"
    >
      {billingLive ? "Sign in to subscribe" : "Try a free staff problem →"}
    </Link>
  );
}
