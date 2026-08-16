import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const stripe = getStripe();
  const origin = new URL(request.url).origin;

  const customers = await stripe.customers.list({
    email: session.user.email,
    limit: 1,
  });

  let customerId = customers.data[0]?.id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email,
      metadata: { userId: session.user.id ?? "" },
    });
    customerId = customer.id;
  }

  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/pricing`,
  });

  return NextResponse.json({ url: portal.url });
}
