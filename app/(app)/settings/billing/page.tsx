import type { Metadata } from "next";
import { requireOrgContext } from "@/lib/org/context";
import { getCurrentInterviewUsage } from "@/lib/billing/usage";
import { PLAN_LIMITS } from "@/lib/billing/limits";
import { startCheckoutAction, openBillingPortalAction } from "@/lib/actions/billing";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Billing" };

export default async function BillingPage() {
  const { organization, subscription } = await requireOrgContext();
  const plan = subscription?.plan ?? "starter";
  const usage = await getCurrentInterviewUsage(organization.id);
  const limits = PLAN_LIMITS[plan];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your plan and usage.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="capitalize">{plan} plan</CardTitle>
            <Badge variant={plan === "professional" ? "success" : "outline"} className="capitalize">
              {subscription?.status ?? "active"}
            </Badge>
          </div>
          <CardDescription>
            {usage} interview{usage === 1 ? "" : "s"} used this month
            {limits.maxInterviewsPerMonth !== Infinity ? ` of ${limits.maxInterviewsPerMonth}` : " (unlimited)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {plan === "starter" ? (
            <form action={startCheckoutAction}>
              <Button type="submit">Upgrade to Professional — $49/mo</Button>
            </form>
          ) : (
            <form action={openBillingPortalAction}>
              <Button type="submit" variant="outline">
                Manage billing
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
