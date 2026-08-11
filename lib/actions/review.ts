"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { interviewSessions, candidateInvitations, jobs, reviewNotes, activityLog } from "@/lib/db/schema";
import { requireOrgContext } from "@/lib/org/context";

async function requireSessionInOrg(sessionId: string, organizationId: string) {
  const [row] = await db
    .select({ session: interviewSessions, jobId: jobs.id })
    .from(interviewSessions)
    .innerJoin(candidateInvitations, eq(candidateInvitations.id, interviewSessions.invitationId))
    .innerJoin(jobs, eq(jobs.id, candidateInvitations.jobId))
    .where(and(eq(interviewSessions.id, sessionId), eq(jobs.organizationId, organizationId)))
    .limit(1);
  if (!row) throw new Error("Interview session not found.");
  return row;
}

export async function addReviewNoteAction(sessionId: string, formData: FormData) {
  const { organization, user } = await requireOrgContext();
  await requireSessionInOrg(sessionId, organization.id);

  const note = String(formData.get("note") ?? "").trim();
  if (!note) return;

  await db.insert(reviewNotes).values({ sessionId, userId: user.id, note });
  revalidatePath(`/candidates/${sessionId}`);
}

export async function setDecisionAction(sessionId: string, decision: "shortlisted" | "maybe" | "rejected") {
  const { organization, user } = await requireOrgContext();
  const { jobId, session } = await requireSessionInOrg(sessionId, organization.id);

  // Only flip to "reviewed" once there was actually something to review — deciding early
  // (e.g. rejecting before the candidate has interviewed) shouldn't misrepresent progress.
  const nextStatus = session.status === "ready_for_review" || session.status === "reviewed" ? "reviewed" : session.status;

  await db
    .update(interviewSessions)
    .set({ decision, decidedBy: user.id, decidedAt: new Date(), status: nextStatus, updatedAt: new Date() })
    .where(eq(interviewSessions.id, sessionId));

  await db.insert(activityLog).values({
    organizationId: organization.id,
    actorUserId: user.id,
    action: `candidate.${decision}`,
    entityType: "job",
    entityId: jobId,
  });

  revalidatePath(`/candidates/${sessionId}`);
  revalidatePath("/candidates");
  revalidatePath(`/jobs/${jobId}/candidates`);
  revalidatePath("/dashboard");
}
