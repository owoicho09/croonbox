import type { Metadata } from "next";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { candidateInvitations, candidates, interviewSessions, jobs } from "@/lib/db/schema";
import { requireOrgContext } from "@/lib/org/context";
import { getCompletionTrend } from "@/lib/reports/trends";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const metadata: Metadata = { title: "Reports" };

const STARTED_STATUSES = ["in_progress", "completed", "processing", "ready_for_review", "reviewed", "failed"];
const COMPLETED_STATUSES = ["completed", "processing", "ready_for_review", "reviewed"];
const REPORT_READY_STATUSES = ["ready_for_review", "reviewed"];

export default async function ReportsPage() {
  const { organization } = await requireOrgContext();

  const rows = await db
    .select({ status: interviewSessions.status, decision: interviewSessions.decision, createdAt: candidateInvitations.createdAt, completedAt: interviewSessions.completedAt })
    .from(candidateInvitations)
    .innerJoin(jobs, eq(jobs.id, candidateInvitations.jobId))
    .innerJoin(candidates, eq(candidates.id, candidateInvitations.candidateId))
    .innerJoin(interviewSessions, eq(interviewSessions.invitationId, candidateInvitations.id))
    .where(and(eq(jobs.organizationId, organization.id), eq(candidates.isPreview, false)));

  const totalInvited = rows.length;
  const started = rows.filter((r) => STARTED_STATUSES.includes(r.status)).length;
  const completed = rows.filter((r) => COMPLETED_STATUSES.includes(r.status)).length;
  const reportsReady = rows.filter((r) => REPORT_READY_STATUSES.includes(r.status)).length;
  const awaitingReview = rows.filter((r) => r.status === "ready_for_review").length;
  const shortlisted = rows.filter((r) => r.decision === "shortlisted").length;
  const maybe = rows.filter((r) => r.decision === "maybe").length;
  const rejected = rows.filter((r) => r.decision === "rejected").length;
  const completionRate = totalInvited === 0 ? 0 : Math.round((completed / totalInvited) * 100);

  const days = await getCompletionTrend(organization.id);
  const maxTrend = Math.max(1, ...days.map((d) => d.value));

  const funnel = [
    { label: "Invited", value: totalInvited },
    { label: "Started", value: started },
    { label: "Completed", value: completed },
    { label: "Reports Ready", value: reportsReady },
    { label: "Shortlisted", value: shortlisted },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">Operational metrics across your hiring pipeline.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {[
          { label: "Total Invited", value: totalInvited },
          { label: "Interviews Started", value: started },
          { label: "Interviews Completed", value: completed },
          { label: "Reports Ready", value: reportsReady },
          { label: "Awaiting Review", value: awaitingReview },
          { label: "Completion Rate", value: `${completionRate}%` },
          { label: "Shortlisted", value: shortlisted },
          { label: "Rejected", value: rejected },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="py-5">
              <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pipeline funnel</CardTitle>
          <CardDescription>Where candidates are across your whole workspace right now.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {funnel.map((stage) => (
            <div key={stage.label} className="flex items-center gap-3">
              <span className="w-32 shrink-0 text-sm text-muted-foreground">{stage.label}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${totalInvited === 0 ? 0 : Math.max(2, (stage.value / totalInvited) * 100)}%` }}
                />
              </div>
              <span className="w-8 shrink-0 text-right text-sm font-medium text-foreground">{stage.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Interview trends</CardTitle>
          <CardDescription>Interviews completed per day, last 14 days.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-end gap-1.5">
            {days.map((d) => (
              <div key={d.key} className="flex flex-1 flex-col items-center gap-1" title={`${d.label}: ${d.value}`}>
                <div
                  className="w-full rounded-t-sm bg-primary/80"
                  style={{ height: `${Math.max(4, (d.value / maxTrend) * 100)}px` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
            <span>{days[0]?.label}</span>
            <span>{days[days.length - 1]?.label}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Review decisions</CardTitle>
          <CardDescription>Review workload across the team.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xl font-semibold text-foreground">{awaitingReview}</p>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </div>
          <div>
            <p className="text-xl font-semibold text-foreground">{maybe}</p>
            <p className="text-xs text-muted-foreground">Marked maybe</p>
          </div>
          <div>
            <p className="text-xl font-semibold text-foreground">{shortlisted + rejected}</p>
            <p className="text-xs text-muted-foreground">Decided (shortlisted or rejected)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
