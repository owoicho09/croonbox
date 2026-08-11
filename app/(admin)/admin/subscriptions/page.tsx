import type { Metadata } from "next";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { subscriptions, organizations } from "@/lib/db/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Admin · Subscriptions" };

const statusVariant: Record<string, "outline" | "success" | "warning" | "destructive" | "secondary"> = {
  active: "success",
  trialing: "outline",
  past_due: "warning",
  canceled: "destructive",
  incomplete: "destructive",
};

export default async function AdminSubscriptionsPage() {
  const rows = await db
    .select({ subscription: subscriptions, organizationName: organizations.name })
    .from(subscriptions)
    .innerJoin(organizations, eq(organizations.id, subscriptions.organizationId))
    .orderBy(desc(subscriptions.updatedAt))
    .limit(200);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Subscriptions ({rows.length})</h1>

      <Card>
        <CardContent className="divide-y divide-border py-0">
          {rows.map((row) => (
            <div key={row.subscription.id} className="flex flex-col gap-1 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground capitalize">
                  {row.organizationName} · {row.subscription.plan}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {row.subscription.stripeCustomerId ?? "No Stripe customer"} ·{" "}
                  {row.subscription.currentPeriodEnd
                    ? `renews ${new Date(row.subscription.currentPeriodEnd).toLocaleDateString()}`
                    : "no renewal date"}
                </p>
              </div>
              <Badge variant={statusVariant[row.subscription.status] ?? "outline"} className="shrink-0 capitalize">
                {row.subscription.status}
              </Badge>
            </div>
          ))}
          {rows.length === 0 && <p className="py-6 text-sm text-muted-foreground">No subscriptions yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
