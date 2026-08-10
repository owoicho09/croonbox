import "server-only";
import { eq, and, or, ilike, desc, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { jobs, candidateInvitations, candidates, interviewSessions } from "@/lib/db/schema";

export type CandidateListFilters = {
  search?: string;
  status?: string;
  reviewQueue?: boolean;
};

export async function listOrganizationCandidates(organizationId: string, filters: CandidateListFilters) {
  const conditions: SQL[] = [eq(jobs.organizationId, organizationId)];

  if (filters.search) {
    const term = `%${filters.search}%`;
    conditions.push(
      or(ilike(candidates.name, term), ilike(candidates.email, term), ilike(jobs.title, term))!,
    );
  }

  if (filters.reviewQueue) {
    conditions.push(eq(interviewSessions.status, "ready_for_review"));
    conditions.push(eq(interviewSessions.decision, "none"));
  } else if (filters.status) {
    conditions.push(eq(interviewSessions.status, filters.status as (typeof interviewSessions.status.enumValues)[number]));
  }

  return db
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
    .where(and(...conditions))
    .orderBy(desc(candidateInvitations.createdAt))
    .limit(100);
}
