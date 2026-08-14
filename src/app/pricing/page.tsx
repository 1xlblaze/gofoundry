import type { Metadata } from "next";
import Link from "next/link";
import { MotionRoot } from "@/components/MotionRoot";
import { WaitlistForm } from "@/components/WaitlistForm";

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
    features: ["15 foundational lessons", "Basic HEAT sheets", "Community access"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$18/mo",
    cadence: "or $149/year",
    description: "The complete individual path from runtime internals to architecture.",
    features: [
      "Full deep-dive curriculum",
      "Allocation benchmarks",
      "Concurrency sandbox",
      "Cloud-native HLD cases",
      "Staff-level interview scripts",
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

export default function PricingPage() {
  return (
    <MotionRoot>
      <div className="price-page">
        <section className="shell page-hero price-hero">
          <p className="kicker" data-motion>
            Staff-grade plans
          </p>
          <h1 data-motion>Invest in Go depth, not content volume.</h1>
          <p data-motion>
            Start with the foundations for free. Join the waitlist when you are ready for
            performance labs, production design cases, and a complete interview operating system.
          </p>
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
                ) : (
                  <WaitlistForm
                    tier={tier.id}
                    source="pricing"
                    buttonLabel={tier.id === "pro" ? "Join Pro waitlist" : "Join Team waitlist"}
                  />
                )}
              </div>
            </article>
          ))}
        </section>

        <section className="shell price-roadmap" data-motion>
          <p>
            Pro sandbox (Docker/--race + allocs/op) and Stripe billing are on the roadmap. Join the
            waitlist for early-bird lifetime pricing.
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
