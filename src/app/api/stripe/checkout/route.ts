import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getStripe, isStripeConfigured, PRICE_IDS } from "@/lib/stripe";

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured. Set STRIPE_SECRET_KEY and price IDs." },
      { status: 503 },
    );
  }

  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  let body: { plan?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const priceId =
    body.plan === "pro-yearly"
      ? PRICE_IDS.proYearly
      : body.plan === "team-yearly"
        ? PRICE_IDS.teamYearly
        : PRICE_IDS.proMonthly;

  if (!priceId) {
    return NextResponse.json({ error: "Price ID not configured" }, { status: 503 });
  }

  const stripe = getStripe();
  const origin = new URL(request.url).origin;

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: session.user.email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/pricing?success=1`,
    cancel_url: `${origin}/pricing?canceled=1`,
    metadata: {
      userId: session.user.id ?? "",
      email: session.user.email,
    },
  });

  return NextResponse.json({ url: checkout.url });
}
