import type { Metadata } from "next";
import { eq, count, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizations, subscriptions, jobs, memberships } from "@/lib/db/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Admin · Organizations" };

export default async function AdminOrganizationsPage() {
  const rows = await db
    .select({
      organization: organizations,
      plan: subscriptions.plan,
      status: subscriptions.status,
      jobCount: count(jobs.id),
    })
    .from(organizations)
    .leftJoin(subscriptions, eq(subscriptions.organizationId, organizations.id))
    .leftJoin(jobs, eq(jobs.organizationId, organizations.id))
    .groupBy(organizations.id, subscriptions.plan, subscriptions.status)
    .orderBy(desc(organizations.createdAt));

  const memberCounts = await db
    .select({ organizationId: memberships.organizationId, value: count() })
    .from(memberships)
    .groupBy(memberships.organizationId);
  const memberCountByOrg = new Map(memberCounts.map((m) => [m.organizationId, m.value]));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Organizations ({rows.length})</h1>

      <Card>
        <CardContent className="divide-y divide-border py-0">
          {rows.map((row) => (
            <div key={row.organization.id} className="flex flex-col gap-2 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{row.organization.name}</p>
                <p className="text-xs text-muted-foreground">
                  {row.jobCount} jobs · {memberCountByOrg.get(row.organization.id) ?? 0} members · created{" "}
                  {new Date(row.organization.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant={row.plan === "professional" ? "success" : "outline"} className="capitalize">
                  {row.plan ?? "starter"}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {row.status ?? "active"}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
