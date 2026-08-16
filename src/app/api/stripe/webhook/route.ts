import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getStripe, isStripeConfigured, tierFromStripePrice } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const stripe = getStripe();
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing webhook signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const email = session.customer_email ?? session.metadata?.email;
    const subscriptionId = session.subscription as string | null;

    if (email && subscriptionId) {
      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = sub.items.data[0]?.price.id ?? "";
      const tier = tierFromStripePrice(priceId);

      const db = await getDb();
      if (db) {
        await db.query(
          `INSERT INTO users (email, tier) VALUES ($1, $2)
           ON CONFLICT (email) DO UPDATE SET tier = $2`,
          [email, tier],
        );
      }
    }
  }

  if (event.type === "customer.subscription.updated") {
    const sub = event.data.object;
    const customer = await stripe.customers.retrieve(sub.customer as string);
    if (!customer.deleted && "email" in customer && customer.email) {
      const priceId = sub.items.data[0]?.price.id ?? "";
      const tier =
        sub.status === "active" || sub.status === "trialing"
          ? tierFromStripePrice(priceId)
          : "free";

      const db = await getDb();
      if (db) {
        await db.query(
          `INSERT INTO users (email, tier) VALUES ($1, $2)
           ON CONFLICT (email) DO UPDATE SET tier = $2`,
          [customer.email, tier],
        );
      }
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object;
    const customer = await stripe.customers.retrieve(sub.customer as string);
    if (!customer.deleted && "email" in customer && customer.email) {
      const db = await getDb();
      if (db) {
        await db.query(`UPDATE users SET tier = 'free' WHERE email = $1`, [
          customer.email,
        ]);
      }
    }
  }

  return NextResponse.json({ received: true });
}
