import "server-only";
import { sql, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  processingJobs,
  interviewSessions,
  candidateInvitations,
  candidates,
  jobs,
  aiInterviewConfigs,
  transcripts,
  aiReports,
  users,
  memberships,
} from "@/lib/db/schema";
import { generateInterviewReport } from "@/lib/ai/insights";
import { sendEmail } from "@/lib/email";
import { employerReviewReadyEmail } from "@/lib/email/templates";

type ClaimedJob = {
  id: string;
  type: "generate_ai_report" | "notify_employer_ready";
  payload: Record<string, unknown>;
  attempts: number;
  maxAttempts: number;
};

async function claimNextJob(): Promise<ClaimedJob | null> {
  const rows = await db.execute<{
    id: string;
    type: ClaimedJob["type"];
    payload: Record<string, unknown>;
    attempts: number;
    max_attempts: number;
  }>(sql`
    UPDATE processing_jobs
    SET status = 'processing', attempts = attempts + 1, updated_at = now()
    WHERE id = (
      SELECT id FROM processing_jobs
      WHERE status = 'pending' AND run_after <= now()
      ORDER BY created_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    RETURNING id, type, payload, attempts, max_attempts
  `);

  const row = rows[0];
  if (!row) return null;
  return { id: row.id, type: row.type, payload: row.payload, attempts: row.attempts, maxAttempts: row.max_attempts };
}

async function markCompleted(jobId: string) {
  await db.update(processingJobs).set({ status: "completed", updatedAt: new Date() }).where(eq(processingJobs.id, jobId));
}

async function markFailed(job: ClaimedJob, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const exhausted = job.attempts >= job.maxAttempts;

  await db
    .update(processingJobs)
    .set({
      status: exhausted ? "failed" : "pending",
      lastError: message,
      runAfter: exhausted ? undefined : new Date(Date.now() + Math.min(2 ** job.attempts, 60) * 60 * 1000),
      updatedAt: new Date(),
    })
    .where(eq(processingJobs.id, job.id));
}

async function enqueue(type: ClaimedJob["type"], payload: Record<string, unknown>) {
  await db.insert(processingJobs).values({ type, payload });
}

async function handleGenerateAiReport(payload: Record<string, unknown>) {
  const sessionId = payload.sessionId as string;

  const [row] = await db
    .select({
      transcriptText: transcripts.text,
      jobTitle: jobs.title,
      interviewerRole: aiInterviewConfigs.interviewerRole,
      focusAreas: aiInterviewConfigs.focusAreas,
    })
    .from(interviewSessions)
    .innerJoin(transcripts, eq(transcripts.sessionId, interviewSessions.id))
    .innerJoin(candidateInvitations, eq(candidateInvitations.id, interviewSessions.invitationId))
    .innerJoin(jobs, eq(jobs.id, candidateInvitations.jobId))
    .innerJoin(aiInterviewConfigs, eq(aiInterviewConfigs.jobId, jobs.id))
    .where(eq(interviewSessions.id, sessionId))
    .limit(1);

  if (!row) throw new Error(`Session ${sessionId} has no transcript yet`);

  const report = await generateInterviewReport({
    jobTitle: row.jobTitle,
    interviewerRole: row.interviewerRole,
    focusAreas: row.focusAreas,
    transcript: row.transcriptText,
  });

  await db
    .insert(aiReports)
    .values({
      sessionId,
      summary: report.summary,
      relevantExperience: report.relevantExperience,
      strongSignals: report.strongSignals,
      areasToReview: report.areasToReview,
      suggestedFollowUps: report.suggestedFollowUps,
      model: process.env.ANTHROPIC_INSIGHTS_MODEL ?? "claude-opus-5",
    })
    .onConflictDoUpdate({
      target: aiReports.sessionId,
      set: {
        summary: report.summary,
        relevantExperience: report.relevantExperience,
        strongSignals: report.strongSignals,
        areasToReview: report.areasToReview,
        suggestedFollowUps: report.suggestedFollowUps,
      },
    });

  await db
    .update(interviewSessions)
    .set({ status: "ready_for_review", updatedAt: new Date() })
    .where(eq(interviewSessions.id, sessionId));

  await enqueue("notify_employer_ready", { sessionId });
}

async function handleNotifyEmployerReady(payload: Record<string, unknown>) {
  const sessionId = payload.sessionId as string;

  const [row] = await db
    .select({
      candidateName: candidates.name,
      jobTitle: jobs.title,
      organizationId: jobs.organizationId,
    })
    .from(interviewSessions)
    .innerJoin(candidateInvitations, eq(candidateInvitations.id, interviewSessions.invitationId))
    .innerJoin(jobs, eq(jobs.id, candidateInvitations.jobId))
    .innerJoin(candidates, eq(candidates.id, candidateInvitations.candidateId))
    .where(eq(interviewSessions.id, sessionId))
    .limit(1);

  if (!row) throw new Error(`Session ${sessionId} not found`);

  const owners = await db
    .select({ email: users.email, name: users.name })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(eq(memberships.organizationId, row.organizationId));

  const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/candidates/${sessionId}`;

  for (const owner of owners) {
    await sendEmail({
      organizationId: row.organizationId,
      type: "employer_review_ready",
      to: owner.email,
      subject: `${row.candidateName}'s interview is ready for review`,
      html: employerReviewReadyEmail({
        name: owner.name,
        candidateName: row.candidateName,
        jobTitle: row.jobTitle,
        reviewUrl,
      }),
    });
  }
}

export async function processNextJob(): Promise<"empty" | "processed"> {
  const job = await claimNextJob();
  if (!job) return "empty";

  try {
    switch (job.type) {
      case "generate_ai_report":
        await handleGenerateAiReport(job.payload);
        break;
      case "notify_employer_ready":
        await handleNotifyEmployerReady(job.payload);
        break;
    }
    await markCompleted(job.id);
  } catch (error) {
    await markFailed(job, error);
  }

  return "processed";
}
