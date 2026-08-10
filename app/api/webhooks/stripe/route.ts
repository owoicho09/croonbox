import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { eq } from "drizzle-orm";
import { getStripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";

const ACTIVE_STATUSES = new Set<Stripe.Subscription.Status>(["active", "trialing", "past_due"]);

async function syncSubscriptionByCustomer(customerId: string, subscription: Stripe.Subscription) {
  const plan = ACTIVE_STATUSES.has(subscription.status) ? "professional" : "starter";
  const currentPeriodEnd = subscription.items.data[0]?.current_period_end;

  await db
    .update(subscriptions)
    .set({
      stripeSubscriptionId: subscription.id,
      plan,
      status: subscription.status === "trialing" ? "trialing" : ACTIVE_STATUSES.has(subscription.status) ? "active" : "canceled",
      currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeCustomerId, customerId));
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.customer && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        await syncSubscriptionByCustomer(session.customer as string, subscription);
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.created": {
      const subscription = event.data.object as Stripe.Subscription;
      await syncSubscriptionByCustomer(subscription.customer as string, subscription);
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await db
        .update(subscriptions)
        .set({ plan: "starter", status: "canceled", updatedAt: new Date() })
        .where(eq(subscriptions.stripeCustomerId, subscription.customer as string));
      break;
    }
  }

  return NextResponse.json({ received: true });
}
