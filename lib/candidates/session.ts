import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { candidateInvitations, candidates, jobs, aiInterviewConfigs, interviewSessions, organizations } from "@/lib/db/schema";
import { hashToken } from "@/lib/auth/tokens";

export async function loadInterviewByToken(token: string) {
  const tokenHash = hashToken(token);

  const [row] = await db
    .select({
      invitation: candidateInvitations,
      candidate: candidates,
      job: jobs,
      session: interviewSessions,
      organizationName: organizations.name,
      questionCount: aiInterviewConfigs.questions,
    })
    .from(candidateInvitations)
    .innerJoin(candidates, eq(candidateInvitations.candidateId, candidates.id))
    .innerJoin(jobs, eq(candidateInvitations.jobId, jobs.id))
    .innerJoin(organizations, eq(jobs.organizationId, organizations.id))
    .innerJoin(interviewSessions, eq(interviewSessions.invitationId, candidateInvitations.id))
    .leftJoin(aiInterviewConfigs, eq(aiInterviewConfigs.jobId, jobs.id))
    .where(eq(candidateInvitations.tokenHash, tokenHash))
    .limit(1);

  if (!row) return { status: "not_found" as const };

  if (row.invitation.status === "revoked") return { status: "revoked" as const };
  if (row.invitation.expiresAt.getTime() < Date.now()) return { status: "expired" as const };

  return {
    status: "ok" as const,
    invitation: row.invitation,
    candidate: row.candidate,
    job: row.job,
    session: row.session,
    organizationName: row.organizationName,
    questionCount: row.questionCount?.length ?? 0,
  };
}
