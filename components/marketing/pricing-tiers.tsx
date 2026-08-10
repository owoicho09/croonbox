import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const tiers = [
  {
    name: "Starter",
    price: "Free",
    description: "Perfect for small teams getting started with async interviews.",
    cta: "Start Free",
    href: "/signup",
    features: [
      "Up to 3 active jobs",
      "50 candidate interviews per month",
      "Video recording & playback",
      "Transcripts",
      "Basic AI insights",
      "Email support",
    ],
  },
  {
    name: "Professional",
    price: "$49",
    period: "/month",
    description: "For growing teams that need advanced evaluation and analytics.",
    cta: "Start Free Trial",
    href: "/signup?plan=professional",
    highlighted: true,
    features: [
      "Unlimited active jobs",
      "Unlimited interviews",
      "Advanced AI insights",
      "Custom evaluation guidance",
      "Team collaboration",
      "PDF reports",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large organizations with custom requirements.",
    cta: "Contact Sales",
    href: "/contact",
    features: [
      "Everything in Professional",
      "SSO & SAML",
      "Custom integrations",
      "Dedicated success manager",
      "SLA guarantees",
    ],
  },
];

export function PricingTiers() {
  return (
    <div className="mt-12 grid gap-6 lg:grid-cols-3">
      {tiers.map((tier) => (
        <Card
          key={tier.name}
          className={cn("relative flex flex-col", tier.highlighted && "border-primary shadow-md")}
        >
          {tier.highlighted && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
              Most Popular
            </span>
          )}
          <CardHeader>
            <h3 className="text-lg font-semibold text-foreground">{tier.name}</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-foreground">{tier.price}</span>
              {tier.period && <span className="text-sm text-muted-foreground">{tier.period}</span>}
            </div>
            <p className="text-sm text-muted-foreground">{tier.description}</p>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
            <ul className="flex-1 space-y-3">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button asChild className="mt-6" variant={tier.highlighted ? "default" : "outline"}>
              <Link href={tier.href}>{tier.cta}</Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
