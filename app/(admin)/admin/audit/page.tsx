import type { Metadata } from "next";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { activityLog, organizations, users } from "@/lib/db/schema";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Admin · Audit Log" };

export default async function AdminAuditPage() {
  const rows = await db
    .select({ activity: activityLog, organizationName: organizations.name, actorName: users.name })
    .from(activityLog)
    .innerJoin(organizations, eq(organizations.id, activityLog.organizationId))
    .leftJoin(users, eq(users.id, activityLog.actorUserId))
    .orderBy(desc(activityLog.createdAt))
    .limit(200);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Audit Log</h1>
      <p className="text-sm text-muted-foreground">The last 200 tracked actions across every workspace.</p>

      <Card>
        <CardContent className="divide-y divide-border py-0">
          {rows.map((row) => (
            <div key={row.activity.id} className="flex flex-col gap-0.5 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span className="text-foreground">
                {row.activity.action} <span className="text-muted-foreground">by {row.actorName ?? "system"}</span>
              </span>
              <span className="text-xs text-muted-foreground sm:text-sm">
                {row.organizationName} · {new Date(row.activity.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
          {rows.length === 0 && <p className="py-6 text-sm text-muted-foreground">No activity recorded yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
