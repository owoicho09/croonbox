import Link from "next/link";
import type { Metadata } from "next";
import { eq, and, desc, inArray } from "drizzle-orm";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { jobs, candidateInvitations, candidates, interviewSessions } from "@/lib/db/schema";
import { requireOrgContext } from "@/lib/org/context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Jobs" };

const statusVariant = {
  draft: "outline",
  published: "success",
  closed: "secondary",
  archived: "secondary",
} as const;

const COMPLETED_STATUSES = ["completed", "processing", "ready_for_review", "reviewed"];
const REPORT_READY_STATUSES = ["ready_for_review", "reviewed"];

export default async function JobsPage() {
  const { organization } = await requireOrgContext();

  const orgJobs = await db
    .select()
    .from(jobs)
    .where(eq(jobs.organizationId, organization.id))
    .orderBy(desc(jobs.createdAt));

  const jobIds = orgJobs.map((j) => j.id);
  const pipelineRows =
    jobIds.length === 0
      ? []
      : await db
          .select({ jobId: candidateInvitations.jobId, status: interviewSessions.status })
          .from(candidateInvitations)
          .innerJoin(candidates, eq(candidates.id, candidateInvitations.candidateId))
          .innerJoin(interviewSessions, eq(interviewSessions.invitationId, candidateInvitations.id))
          .where(and(inArray(candidateInvitations.jobId, jobIds), eq(candidates.isPreview, false)));

  const countsByJob = new Map<string, { invited: number; completed: number; reportsReady: number }>();
  for (const row of pipelineRows) {
    const counts = countsByJob.get(row.jobId) ?? { invited: 0, completed: 0, reportsReady: 0 };
    counts.invited += 1;
    if (COMPLETED_STATUSES.includes(row.status)) counts.completed += 1;
    if (REPORT_READY_STATUSES.includes(row.status)) counts.reportsReady += 1;
    countsByJob.set(row.jobId, counts);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Jobs</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create and manage your interview jobs.</p>
        </div>
        <Button asChild>
          <Link href="/jobs/new">
            <Plus className="h-4 w-4" /> New Job
          </Link>
        </Button>
      </div>

      {orgJobs.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="max-w-sm text-sm text-muted-foreground">
              Create your first job and let Croonbox prepare the AI interviewer from the job description.
            </p>
            <Button asChild>
              <Link href="/jobs/new">
                <Plus className="h-4 w-4" /> Create your first job
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-8 grid gap-4">
          {orgJobs.map((job) => {
            const counts = countsByJob.get(job.id) ?? { invited: 0, completed: 0, reportsReady: 0 };
            const subtitle = [job.department, job.location].filter(Boolean).join(" · ");
            return (
              <Link key={job.id} href={`/jobs/${job.id}`}>
                <Card className="transition-colors hover:border-primary/40">
                  <CardContent className="flex flex-wrap items-center justify-between gap-4 py-5">
                    <div className="min-w-0">
                      <h2 className="truncate font-medium text-foreground">{job.title}</h2>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {subtitle ? `${subtitle} · ` : ""}Created {new Date(job.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <div className="hidden items-center gap-4 text-xs text-muted-foreground sm:flex sm:gap-6">
                        <div className="text-center">
                          <p className="text-sm font-semibold text-foreground">{counts.invited}</p>
                          <p>Invited</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold text-foreground">{counts.completed}</p>
                          <p>Completed</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold text-foreground">{counts.reportsReady}</p>
                          <p>Ready</p>
                        </div>
                      </div>
                      <Badge variant={statusVariant[job.status]} className="capitalize">
                        {job.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
