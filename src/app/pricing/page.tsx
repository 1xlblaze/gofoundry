import type { Metadata } from "next";
import Link from "next/link";
import { MotionRoot } from "@/components/MotionRoot";
import { CheckoutButton } from "@/components/CheckoutButton";
import { WaitlistForm } from "@/components/WaitlistForm";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Choose a GoFoundry plan for staff-grade Go lessons, concurrency practice, runtime performance, and system design.",
};

const tiers = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    cadence: "forever",
    description: "Build the core mental models before going deeper.",
    features: [
      "15 foundational lessons",
      "1 staff DSA problem (sliding window)",
      "Basic HEAT sheets",
      "Community access",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$18/mo",
    cadence: "or $149/year",
    description: "The complete individual path from runtime internals to architecture.",
    features: [
      "Full deep-dive curriculum (101 lessons)",
      "20 staff DSA problems with 4-gate diagnostics",
      "5 LLD design modules",
      "Concurrency sandbox + escape analysis",
      "Cloud-native HLD cases",
    ],
  },
  {
    id: "team",
    name: "Team",
    price: "$299",
    cadence: "per seat/year",
    description: "A shared mastery system for engineering organizations.",
    features: ["Team analytics", "Custom tracks", "SSO", "Priority support"],
  },
];

export default async function PricingPage() {
  const session = await auth();
  const userTier = session?.user?.tier ?? "free";

  return (
    <MotionRoot>
      <div className="price-page">
        <section className="shell page-hero price-hero">
          <p className="kicker" data-motion>
            Staff-grade plans
          </p>
          <h1 data-motion>Invest in Go depth, not content volume.</h1>
          <p data-motion>
            Start with the foundations for free. Upgrade to Pro for the full 4-gate
            diagnostic pipeline, 20 staff DSA problems, and production LLD modules.
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
              {tier.id === "pro" ? <span className="price-popular">Most complete</span> : null}
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
                  <Link href="/learn" className="primary-btn price-full-button">
                    Start free
                  </Link>
                ) : tier.id === "pro" ? (
                  session ? (
                    <div className="price-checkout-group">
                      <CheckoutButton plan="pro-monthly" label="Subscribe monthly" />
                      <CheckoutButton
                        plan="pro-yearly"
                        label="Subscribe yearly"
                        className="secondary-btn price-full-button"
                      />
                    </div>
                  ) : (
                    <Link href="/login" className="primary-btn price-full-button">
                      Sign in to subscribe
                    </Link>
                  )
                ) : (
                  <WaitlistForm
                    tier={tier.id}
                    source="pricing"
                    buttonLabel="Join Team waitlist"
                  />
                )}
              </div>
            </article>
          ))}
        </section>

        <section className="shell price-roadmap" data-motion>
          <p>
            Pro includes the full sandbox diagnostic pipeline: <code>go vet</code>, escape
            analysis, <code>-race</code>, goleak, and benchmark allocs/op. Deploy with Docker +
            optional gVisor via <code>docker-compose up</code>.
          </p>
        </section>

        <section className="shell price-lifetime panel" data-motion>
          <div>
            <p className="kicker">Early-bird access</p>
            <h2>Interested in a lifetime pass?</h2>
            <p>
              Tell us where to send launch details. Early members will be first in line for
              limited lifetime pricing.
            </p>
          </div>
          <WaitlistForm tier="lifetime" source="lifetime" buttonLabel="Register interest" />
        </section>
      </div>
    </MotionRoot>
  );
}
