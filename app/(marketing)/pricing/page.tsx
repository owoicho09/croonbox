import type { Metadata } from "next";
import { PricingTiers } from "@/components/marketing/pricing-tiers";

export const metadata: Metadata = { title: "Pricing" };

export default function PricingPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Simple, Transparent Pricing</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Start free, upgrade when you need to. No hidden fees, no surprises.
        </p>
      </div>
      <PricingTiers />
    </section>
  );
}
