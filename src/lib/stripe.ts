import Stripe from "stripe";

let stripe: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe(): Stripe {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
}

export const PRICE_IDS = {
  proMonthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID ?? "",
  proYearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID ?? "",
  teamYearly: process.env.STRIPE_TEAM_YEARLY_PRICE_ID ?? "",
};

export type UserTier = "free" | "pro" | "cohort";

export function tierFromStripePrice(priceId: string): UserTier {
  if (priceId === PRICE_IDS.teamYearly) return "cohort";
  if (priceId === PRICE_IDS.proMonthly || priceId === PRICE_IDS.proYearly) return "pro";
  return "free";
}
