import Link from "next/link";
import type { Metadata } from "next";
import { eq, and, ne, count, desc, inArray } from "drizzle-orm";
import { Plus, Briefcase, Users, Sparkles, CheckCircle2, Circle } from "lucide-react";
import { db } from "@/lib/db";
import { jobs, candidateInvitations, candidates, interviewSessions, aiInterviewConfigs, activityLog } from "@/lib/db/schema";
import { requireOrgContext } from "@/lib/org/context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RecentCandidates } from "@/components/dashboard/recent-candidates";

export const metadata: Metadata = { title: "Dashboard" };

const STARTED_STATUSES = ["in_progress", "completed", "processing", "ready_for_review", "reviewed", "failed"];
const COMPLETED_STATUSES = ["completed", "processing", "ready_for_review", "reviewed"];
const REPORT_READY_STATUSES = ["ready_for_review", "reviewed"];

export default async function DashboardPage() {
  const { user, organization } = await requireOrgContext();

  const [orgJobs, pipelineRows, recentActivity, hasAnyInvite, hasAnyDecision] = await Promise.all([
    db.select().from(jobs).where(eq(jobs.organizationId, organization.id)).orderBy(desc(jobs.createdAt)),
    db
      .select({ jobId: candidateInvitations.jobId, status: interviewSessions.status, decision: interviewSessions.decision })
      .from(candidateInvitations)
      .innerJoin(jobs, eq(jobs.id, candidateInvitations.jobId))
      .innerJoin(candidates, eq(candidates.id, candidateInvitations.candidateId))
      .innerJoin(interviewSessions, eq(interviewSessions.invitationId, candidateInvitations.id))
      .where(and(eq(jobs.organizationId, organization.id), eq(candidates.isPreview, false))),
    db
      .select({ activity: activityLog })
      .from(activityLog)
      .where(eq(activityLog.organizationId, organization.id))
      .orderBy(desc(activityLog.createdAt))
      .limit(8),
    db
      .select({ value: count() })
      .from(candidateInvitations)
      .innerJoin(jobs, eq(jobs.id, candidateInvitations.jobId))
      .innerJoin(candidates, eq(candidates.id, candidateInvitations.candidateId))
      .where(and(eq(jobs.organizationId, organization.id), eq(candidates.isPreview, false))),
    db
      .select({ value: count() })
      .from(interviewSessions)
      .innerJoin(candidateInvitations, eq(candidateInvitations.id, interviewSessions.invitationId))
      .innerJoin(jobs, eq(jobs.id, candidateInvitations.jobId))
      .innerJoin(candidates, eq(candidates.id, candidateInvitations.candidateId))
      .where(
        and(eq(jobs.organizationId, organization.id), ne(interviewSessions.decision, "none"), eq(candidates.isPreview, false)),
      ),
  ]);

  const publishedJobs = orgJobs.filter((j) => j.status === "published");
  const jobIds = orgJobs.map((j) => j.id);
  const configuredJobIds = jobIds.length
    ? new Set(
        (await db.select({ jobId: aiInterviewConfigs.jobId }).from(aiInterviewConfigs).where(inArray(aiInterviewConfigs.jobId, jobIds))).map(
          (r) => r.jobId,
        ),
      )
    : new Set<string>();

  const totalInvited = pipelineRows.length;
  const started = pipelineRows.filter((r) => STARTED_STATUSES.includes(r.status)).length;
  const completedCount = pipelineRows.filter((r) => COMPLETED_STATUSES.includes(r.status)).length;
  const reportsReady = pipelineRows.filter((r) => REPORT_READY_STATUSES.includes(r.status)).length;
  const reviewedOrShortlisted = pipelineRows.filter((r) => r.decision !== "none").length;

  const countsByJob = new Map<string, { invited: number; completed: number; reportsReady: number }>();
  for (const row of pipelineRows) {
    const c = countsByJob.get(row.jobId) ?? { invited: 0, completed: 0, reportsReady: 0 };
    c.invited += 1;
    if (COMPLETED_STATUSES.includes(row.status)) c.completed += 1;
    if (REPORT_READY_STATUSES.includes(row.status)) c.reportsReady += 1;
    countsByJob.set(row.jobId, c);
  }

  const stats = [
    { label: "Active Jobs", value: publishedJobs.length, icon: Briefcase },
    { label: "Candidates Invited", value: totalInvited, icon: Users },
    { label: "Interviews Completed", value: completedCount, icon: CheckCircle2 },
    { label: "Reports Ready", value: reportsReady, icon: Sparkles },
  ];

  const funnel = [
    { label: "Invited", value: totalInvited },
    { label: "Started", value: started },
    { label: "Completed", value: completedCount },
    { label: "Report Ready", value: reportsReady },
    { label: "Reviewed", value: reviewedOrShortlisted },
  ];

  const checklist = [
    { label: "Set up your company", done: true },
    { label: "Create your first job", done: orgJobs.length > 0 },
    { label: "Generate an AI interviewer", done: configuredJobIds.size > 0 },
    { label: "Invite a candidate", done: (hasAnyInvite[0]?.value ?? 0) > 0 },
    { label: "Review your first report", done: (hasAnyDecision[0]?.value ?? 0) > 0 },
  ];
  const showChecklist = checklist.some((c) => !c.done);

  const recentCandidates = await db
    .select({
      jobId: jobs.id,
      jobTitle: jobs.title,
      sessionId: interviewSessions.id,
      candidateName: candidates.name,
      candidateEmail: candidates.email,
      status: interviewSessions.status,
      decision: interviewSessions.decision,
      invitedAt: candidateInvitations.createdAt,
    })
    .from(candidateInvitations)
    .innerJoin(jobs, eq(jobs.id, candidateInvitations.jobId))
    .innerJoin(candidates, eq(candidates.id, candidateInvitations.candidateId))
    .innerJoin(interviewSessions, eq(interviewSessions.invitationId, candidateInvitations.id))
    .where(and(eq(jobs.organizationId, organization.id), eq(candidates.isPreview, false)))
    .orderBy(desc(candidateInvitations.createdAt))
    .limit(6);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Welcome back, {user.name.split(" ")[0]}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {organization.name} · {publishedJobs.length} active job{publishedJobs.length === 1 ? "" : "s"}, {reportsReady} report
            {reportsReady === 1 ? "" : "s"} awaiting your review
          </p>
        </div>
        <Button asChild>
          <Link href="/jobs/new">
            <Plus className="h-4 w-4" /> New Job
          </Link>
        </Button>
      </div>

      {showChecklist && (
        <Card>
          <CardContent className="py-5">
            <p className="text-sm font-semibold text-foreground">Getting started</p>
            <div className="mt-3 space-y-2">
              {checklist.map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-sm">
                  {item.done ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className={item.done ? "text-muted-foreground line-through" : "text-foreground"}>{item.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      {totalInvited > 0 && (
        <Card>
          <CardContent className="space-y-3 py-6">
            <p className="text-sm font-semibold text-foreground">Pipeline</p>
            {funnel.map((stage) => (
              <div key={stage.label} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-xs text-muted-foreground">{stage.label}</span>
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
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Open jobs</h2>
          <Link href="/jobs" className="text-sm font-medium text-primary hover:underline">
            View all jobs
          </Link>
        </div>
        {publishedJobs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="max-w-sm text-sm text-muted-foreground">
                Create your first job and let Croonbox prepare the AI interviewer from the job description.
              </p>
              <Button asChild size="sm">
                <Link href="/jobs/new">
                  <Plus className="h-4 w-4" /> Create a job
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {publishedJobs.slice(0, 5).map((job) => {
              const c = countsByJob.get(job.id) ?? { invited: 0, completed: 0, reportsReady: 0 };
              return (
                <Link key={job.id} href={`/jobs/${job.id}`}>
                  <Card className="transition-colors hover:border-primary/40">
                    <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{job.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {[job.department, job.location].filter(Boolean).join(" · ") || "No department/location set"}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <div className="hidden items-center gap-4 text-xs text-muted-foreground sm:flex">
                          <span>{c.invited} invited</span>
                          <span>{c.completed} completed</span>
                          <span>{c.reportsReady} reports ready</span>
                        </div>
                        <Badge variant="success">Published</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Recent candidates</h2>
          <Link href="/candidates" className="text-sm font-medium text-primary hover:underline">
            View all candidates
          </Link>
        </div>
        <RecentCandidates rows={recentCandidates} />
      </section>

      {recentActivity.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-foreground">Recent activity</h2>
          <Card>
            <CardContent className="divide-y divide-border py-0">
              {recentActivity.map(({ activity }) => (
                <div key={activity.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="text-foreground">{activity.action}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{new Date(activity.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
