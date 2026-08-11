"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { requireOrgContext } from "@/lib/org/context";
import { getStripe } from "@/lib/stripe";

export async function startCheckoutAction() {
  const { organization, user, subscription } = await requireOrgContext();
  const stripe = getStripe();

  let customerId = subscription?.stripeCustomerId ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: organization.name,
      metadata: { organizationId: organization.id },
    });
    customerId = customer.id;
    await db
      .update(subscriptions)
      .set({ stripeCustomerId: customerId })
      .where(eq(subscriptions.organizationId, organization.id));
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: process.env.STRIPE_PRICE_PROFESSIONAL, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=billing&checkout=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=billing&checkout=cancelled`,
    client_reference_id: organization.id,
  });

  if (!session.url) throw new Error("Failed to create checkout session.");
  redirect(session.url);
}

export async function openBillingPortalAction() {
  const { subscription } = await requireOrgContext();
  if (!subscription?.stripeCustomerId) throw new Error("No billing account yet.");

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=billing`,
  });

  redirect(session.url);
}
