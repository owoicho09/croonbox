import { notFound } from "next/navigation";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { jobs, candidateInvitations, candidates, interviewSessions } from "@/lib/db/schema";
import { requireOrgContext } from "@/lib/org/context";
import { InvitePanel } from "@/components/candidates/invite-panel";
import { CandidatePipeline } from "@/components/candidates/candidate-pipeline";

export default async function JobCandidatesPage({ params }: PageProps<"/jobs/[jobId]/candidates">) {
  const { jobId } = await params;
  const { organization } = await requireOrgContext();

  const [job] = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.organizationId, organization.id)))
    .limit(1);
  if (!job) notFound();

  const rows = await db
    .select({
      sessionId: interviewSessions.id,
      candidateName: candidates.name,
      candidateEmail: candidates.email,
      status: interviewSessions.status,
      decision: interviewSessions.decision,
      invitedAt: candidateInvitations.createdAt,
    })
    .from(candidateInvitations)
    .innerJoin(candidates, eq(candidateInvitations.candidateId, candidates.id))
    .innerJoin(interviewSessions, eq(interviewSessions.invitationId, candidateInvitations.id))
    .where(eq(candidateInvitations.jobId, jobId))
    .orderBy(desc(candidateInvitations.createdAt));

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{job.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Invite and track candidates for this job.</p>
      </div>

      {job.status === "published" ? (
        <InvitePanel jobId={job.id} />
      ) : (
        <p className="rounded-lg bg-secondary px-4 py-3 text-sm text-muted-foreground">
          Publish this job before inviting candidates.
        </p>
      )}

      <section>
        <h2 className="mb-4 text-sm font-semibold text-foreground">
          Candidates <span className="text-muted-foreground">({rows.length})</span>
        </h2>
        <CandidatePipeline rows={rows} />
      </section>
    </div>
  );
}
