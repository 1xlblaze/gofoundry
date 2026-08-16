import type { Metadata } from "next";
import Link from "next/link";
import { ScrollReveal } from "@/components/ui";
import { CheckoutButton } from "@/components/CheckoutButton";
import { ManageSubscriptionButton } from "@/components/ManageSubscriptionButton";
import { WaitlistForm } from "@/components/WaitlistForm";
import { auth } from "@/auth";
import { ENTITLEMENT_COPY } from "@/lib/entitlements";
import { isStripeConfigured } from "@/lib/stripe";
import { buildPageMetadata } from "@/lib/site-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Pricing",
  description:
    "GoFoundry Pro — full staff problem bank, advanced Temper diagnostics, and curriculum reading free for beta members.",
  path: "/pricing",
});

const tiers = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    cadence: "forever",
    description: "Read the curriculum, run the Lab, and try two starter staff problems.",
    features: [
      "Full curriculum readable",
      ENTITLEMENT_COPY.freeProblemsLabel,
      "Go Lab + HEAT canvas",
      ENTITLEMENT_COPY.freeDiagnosticsLabel,
      "Placement quiz + progress tracking",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$18/mo",
    cadence: "or $180/year",
    description: "Unlock the staff problem bank and full Temper diagnostic pipeline.",
    features: [
      ENTITLEMENT_COPY.proProblemsLabel,
      ENTITLEMENT_COPY.proDiagnosticsLabel,
      "Saved submission history",
      ENTITLEMENT_COPY.lessonReading,
      "Priority diagnostic queue",
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
  const isPaid = userTier === "pro" || userTier === "cohort";

  return (
    <ScrollReveal>
      <div className="price-page">
        <section className="shell page-hero price-hero">
          <p className="kicker" data-motion>
            Pricing
          </p>
          <h1 data-motion>Curriculum free. Pro unlocks staff problems.</h1>
          <p data-motion>
            Read every lesson, use the Lab, and solve two starter staff problems on the free tier.
            Pro adds the full problem bank and advanced Temper gates (escape, leak, bench).
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
              className={`panel price-tier-card${tier.id === "pro" ? " price-tier-featured" : ""}`}
              data-motion
            >
              {tier.id === "pro" ? <span className="price-popular">Staff prep</span> : null}
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
                  <Link href="/track/foundations" className="primary-btn price-full-button">
                    Start Foundations
                  </Link>
                ) : tier.id === "pro" ? (
                  isPaid && session ? (
                    <ManageSubscriptionButton className="primary-btn price-full-button" />
                  ) : billingLive && session ? (
                    <div className="price-checkout-group">
                      <CheckoutButton plan="pro-monthly" label="Subscribe monthly" />
                      <CheckoutButton
                        plan="pro-yearly"
                        label="Subscribe yearly"
                        className="secondary-btn price-full-button"
                      />
                    </div>
                  ) : (
                    <Link
                      href={billingLive ? "/login" : "/problems/dsa-01-slice-headers"}
                      className="primary-btn price-full-button"
                    >
                      {billingLive ? "Sign in to subscribe" : "Try a free staff problem →"}
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

        <section className="shell price-roadmap panel" data-motion>
          <p className="kicker">Beta grandfathering</p>
          <h2>Early members keep lesson access</h2>
          <p>
            If you created a GoFoundry account before paid launch, curriculum reading stays free
            on your account — including when Pro billing goes live. Pro is for the staff problem
            bank and advanced diagnostics, not for locking lessons you already had access to.
          </p>
        </section>

        <section className="shell price-roadmap" data-motion>
          <p>
            Refunds: cancel anytime from the billing portal. Monthly plans refund the unused
            portion within 7 days of charge when you contact support. See{" "}
            <Link href="/terms">Terms of Service</Link> for details.
          </p>
        </section>

        <section id="pricing-waitlist" className="shell price-lifetime panel" data-motion>
          <div>
            <p className="kicker">Coming soon</p>
            <h2>Team & lifetime waitlist</h2>
            <p>
              One form for organization seats or a limited lifetime pass. Tell us where to send
              launch details — early members get first access when Team plans go live.
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
