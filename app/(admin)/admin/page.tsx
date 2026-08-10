import type { Metadata } from "next";
import { count, eq, desc } from "drizzle-orm";
import { Building2, Users2, Briefcase, CreditCard, AlertTriangle, MailWarning } from "lucide-react";
import { db } from "@/lib/db";
import { organizations, users, jobs, subscriptions, processingJobs, emailLog, activityLog } from "@/lib/db/schema";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Admin Overview" };

export default async function AdminOverviewPage() {
  const [[{ value: orgCount }], [{ value: userCount }], [{ value: jobCount }], [{ value: proCount }], [{ value: failedJobs }], [{ value: failedEmails }]] =
    await Promise.all([
      db.select({ value: count() }).from(organizations),
      db.select({ value: count() }).from(users),
      db.select({ value: count() }).from(jobs),
      db.select({ value: count() }).from(subscriptions).where(eq(subscriptions.plan, "professional")),
      db.select({ value: count() }).from(processingJobs).where(eq(processingJobs.status, "failed")),
      db.select({ value: count() }).from(emailLog).where(eq(emailLog.status, "failed")),
    ]);

  const recentActivity = await db
    .select({ activity: activityLog, organizationName: organizations.name })
    .from(activityLog)
    .innerJoin(organizations, eq(organizations.id, activityLog.organizationId))
    .orderBy(desc(activityLog.createdAt))
    .limit(20);

  const stats = [
    { label: "Organizations", value: orgCount, icon: Building2 },
    { label: "Users", value: userCount, icon: Users2 },
    { label: "Jobs", value: jobCount, icon: Briefcase },
    { label: "Professional Plans", value: proCount, icon: CreditCard },
    { label: "Failed Processing Jobs", value: failedJobs, icon: AlertTriangle },
    { label: "Failed Emails", value: failedEmails, icon: MailWarning },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-foreground">Overview</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 py-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-subtle text-primary">
                <stat.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Recent activity</h2>
        <Card>
          <CardContent className="divide-y divide-border py-0">
            {recentActivity.map((row) => (
              <div key={row.activity.id} className="flex flex-col gap-0.5 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <span className="text-foreground">{row.activity.action}</span>
                <span className="text-xs text-muted-foreground sm:text-sm">
                  {row.organizationName} · {new Date(row.activity.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
            {recentActivity.length === 0 && <p className="py-6 text-sm text-muted-foreground">No activity yet.</p>}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
