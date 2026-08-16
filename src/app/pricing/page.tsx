import type { Metadata } from "next";
import Link from "next/link";
import { ScrollReveal } from "@/components/ui";
import { CheckoutButton } from "@/components/CheckoutButton";
import { WaitlistForm } from "@/components/WaitlistForm";
import { auth } from "@/auth";
import { isStripeConfigured } from "@/lib/stripe";
import { buildPageMetadata } from "@/lib/site-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Pricing",
  description:
    "GoFoundry is free during public beta — staff problems, Lab, HEAT canvas, diagnostics, and the full curriculum.",
  path: "/pricing",
});

const tiers = [
  {
    id: "free",
    name: "Public beta",
    price: "$0",
    cadence: "everything unlocked",
    description: "Full platform access while we ship the staff-grade curriculum.",
    features: [
      "101-lesson curriculum",
      "20 staff DSA problems + 5 LLD modules",
      "Go Lab + HEAT canvas",
      "4-gate diagnostic sandbox (vet, escape, race, bench)",
      "Community access",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$18/mo",
    cadence: "coming soon",
    description: "Paid subscriptions launch later. Everything is free today.",
    features: [
      "Same full platform as beta",
      "Priority diagnostic queue",
      "Saved submission history",
      "Advanced analytics",
    ],
  },
  {
    id: "team",
    name: "Team",
    price: "$299",
    cadence: "per seat/year · waitlist",
    description: "Organization features for engineering teams.",
    features: ["Team analytics", "Custom tracks", "SSO", "Priority support"],
  },
];

const waitlistTierOptions = [
  { id: "team", label: "Team plan (per seat/year)" },
  { id: "lifetime", label: "Lifetime pass (early-bird)" },
];

export default async function PricingPage() {
  const session = await auth();
  const userTier = session?.user?.tier ?? "free";
  const billingLive = isStripeConfigured();

  return (
    <ScrollReveal>
      <div className="price-page">
        <section className="shell page-hero price-hero">
          <p className="kicker" data-motion>
            Public beta
          </p>
          <h1 data-motion>Everything is free right now.</h1>
          <p data-motion>
            Staff problems, Go Lab, HEAT canvas, and the 4-gate diagnostic pipeline are
            open to everyone. Pro subscriptions are not live yet — explore the full
            platform at no cost.
          </p>
          {userTier !== "free" && (
            <p className="price-active-tier" data-motion>
              Your plan: <strong>{userTier}</strong>
            </p>
          )}
        </section>

        <section className="shell price-tier-grid" aria-label="Pricing tiers">
          {tiers.map((tier) => (
            <article
              key={tier.id}
              className={`panel price-tier-card${tier.id === "free" ? " price-tier-featured" : ""}`}
              data-motion
            >
              {tier.id === "free" ? <span className="price-popular">Live now</span> : null}
              <div>
                <h2>{tier.name}</h2>
                <p className="price-tier-description">{tier.description}</p>
              </div>
              <div className="price-amount">
                <strong>{tier.price}</strong>
                <span>{tier.cadence}</span>
              </div>
              <ul className="price-feature-list">
                {tier.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <div className="price-tier-action">
                {tier.id === "free" ? (
                  <Link href="/problems" className="primary-btn price-full-button">
                    Open staff problems
                  </Link>
                ) : tier.id === "pro" ? (
                  billingLive && session ? (
                    <div className="price-checkout-group">
                      <CheckoutButton plan="pro-monthly" label="Subscribe monthly" />
                      <CheckoutButton
                        plan="pro-yearly"
                        label="Subscribe yearly"
                        className="secondary-btn price-full-button"
                      />
                    </div>
                  ) : (
                    <Link href="/lab" className="secondary-btn price-full-button">
                      {billingLive ? "Sign in to subscribe" : "Use the free Lab →"}
                    </Link>
                  )
                ) : (
                  <Link href="#pricing-waitlist" className="secondary-btn price-full-button">
                    Join waitlist below
                  </Link>
                )}
              </div>
            </article>
          ))}
        </section>

        <section className="shell price-roadmap" data-motion>
          <p>
            Public beta includes the curriculum, Lab, HEAT canvas, and the 4-gate diagnostic
            pipeline at no cost. Paid plans are listed so you can see what is coming — nothing
            extra is required to start learning today.
          </p>
        </section>

        <section id="pricing-waitlist" className="shell price-lifetime panel" data-motion>
          <div>
            <p className="kicker">Coming soon</p>
            <h2>Team & lifetime waitlist</h2>
            <p>
              One form for organization seats or a limited lifetime pass. Tell us where to send
              launch details — early members get first access when paid plans go live.
            </p>
          </div>
          <WaitlistForm
            source="pricing"
            buttonLabel="Join waitlist"
            tierOptions={waitlistTierOptions}
          />
        </section>
      </div>
    </ScrollReveal>
  );
}
