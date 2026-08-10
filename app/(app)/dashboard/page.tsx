import Link from "next/link";
import type { Metadata } from "next";
import { eq, and, count, desc } from "drizzle-orm";
import { Plus, Briefcase, Users, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { jobs, candidateInvitations, candidates, interviewSessions } from "@/lib/db/schema";
import { requireOrgContext } from "@/lib/org/context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RecentCandidates } from "@/components/dashboard/recent-candidates";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { user, organization } = await requireOrgContext();

  const [[{ value: published }], [{ value: totalCandidates }], [{ value: readyForReview }]] = await Promise.all([
    db.select({ value: count() }).from(jobs).where(and(eq(jobs.organizationId, organization.id), eq(jobs.status, "published"))),
    db
      .select({ value: count() })
      .from(candidateInvitations)
      .innerJoin(jobs, eq(jobs.id, candidateInvitations.jobId))
      .where(eq(jobs.organizationId, organization.id)),
    db
      .select({ value: count() })
      .from(interviewSessions)
      .innerJoin(candidateInvitations, eq(candidateInvitations.id, interviewSessions.invitationId))
      .innerJoin(jobs, eq(jobs.id, candidateInvitations.jobId))
      .where(and(eq(jobs.organizationId, organization.id), eq(interviewSessions.status, "ready_for_review"))),
  ]);

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
    .where(eq(jobs.organizationId, organization.id))
    .orderBy(desc(candidateInvitations.createdAt))
    .limit(8);

  const stats = [
    { label: "Published Jobs", value: published, icon: Briefcase },
    { label: "Candidates Invited", value: totalCandidates, icon: Users },
    { label: "Ready for Review", value: readyForReview, icon: Sparkles },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Welcome back, {user.name.split(" ")[0]}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{organization.name}</p>
        </div>
        <Button asChild>
          <Link href="/jobs/new">
            <Plus className="h-4 w-4" /> New Job
          </Link>
        </Button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
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

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Recent candidates</h2>
          <Link href="/jobs" className="text-sm font-medium text-primary hover:underline">
            View all jobs
          </Link>
        </div>
        <RecentCandidates rows={recentCandidates} />
      </section>
    </div>
  );
}
