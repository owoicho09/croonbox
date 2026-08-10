import "server-only";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { candidates, candidateInvitations, interviewSessions, jobs, activityLog } from "@/lib/db/schema";
import { generateToken } from "@/lib/auth/tokens";
import { sendEmail } from "@/lib/email";
import { candidateInvitationEmail } from "@/lib/email/templates";
import { getCurrentInterviewUsage, canInviteMore, incrementInterviewUsage } from "@/lib/billing/usage";
import type { Plan } from "@/lib/billing/limits";
import type { CandidateRow } from "@/lib/validation/candidate";

const INVITE_VALIDITY_DAYS = 30;

export async function inviteCandidates({
  jobId,
  organizationId,
  organizationName,
  invitedByUserId,
  plan,
  rows,
}: {
  jobId: string;
  organizationId: string;
  organizationName: string;
  invitedByUserId: string;
  plan: Plan;
  rows: CandidateRow[];
}) {
  const [job] = await db.select().from(jobs).where(and(eq(jobs.id, jobId), eq(jobs.organizationId, organizationId))).limit(1);
  if (!job) return { created: 0, skipped: [], errors: ["Job not found."] };
  if (job.status !== "published") {
    return { created: 0, skipped: [], errors: ["Publish this job before inviting candidates."] };
  }

  let used = await getCurrentInterviewUsage(organizationId);
  const errors: string[] = [];
  const skipped: string[] = [];
  let created = 0;

  const expiresAt = job.deadlineAt ?? new Date(Date.now() + INVITE_VALIDITY_DAYS * 24 * 60 * 60 * 1000);

  for (const row of rows) {
    if (!canInviteMore(used, plan)) {
      errors.push(`Plan limit reached — ${row.email} was not invited. Upgrade to invite more candidates this month.`);
      continue;
    }

    // Find or create the candidate identity within this org (independent of any single job).
    let [candidate] = await db
      .select()
      .from(candidates)
      .where(and(eq(candidates.organizationId, organizationId), eq(candidates.email, row.email)))
      .limit(1);

    if (!candidate) {
      [candidate] = await db
        .insert(candidates)
        .values({ organizationId, email: row.email, name: row.name })
        .returning();
    }

    const [existingInvite] = await db
      .select({ id: candidateInvitations.id })
      .from(candidateInvitations)
      .where(and(eq(candidateInvitations.jobId, jobId), eq(candidateInvitations.candidateId, candidate.id)))
      .limit(1);

    if (existingInvite) {
      skipped.push(`${row.email} was already invited to this job.`);
      continue;
    }

    const { token, tokenHash } = generateToken();

    const [invitation] = await db
      .insert(candidateInvitations)
      .values({ jobId, candidateId: candidate.id, tokenHash, invitedBy: invitedByUserId, expiresAt })
      .returning();

    await db.insert(interviewSessions).values({ invitationId: invitation.id, status: "not_started" });

    const interviewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/interview/${token}`;
    await sendEmail({
      organizationId,
      type: "candidate_invitation",
      to: candidate.email,
      subject: `You're invited to interview for ${job.title}`,
      html: candidateInvitationEmail({
        candidateName: candidate.name,
        jobTitle: job.title,
        companyName: organizationName,
        interviewUrl,
        deadlineText: job.deadlineAt ? job.deadlineAt.toLocaleDateString() : undefined,
      }),
    });

    await incrementInterviewUsage(organizationId, 1);
    used += 1;
    created += 1;
  }

  await db.insert(activityLog).values({
    organizationId,
    actorUserId: invitedByUserId,
    action: "candidates.invited",
    entityType: "job",
    entityId: jobId,
    metadata: { created, skipped: skipped.length, errors: errors.length },
  });

  return { created, skipped, errors };
}
