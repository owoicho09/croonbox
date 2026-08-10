import "server-only";
import { sql, eq, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  processingJobs,
  candidateResponses,
  interviewQuestions,
  interviewSessions,
  candidateInvitations,
  candidates,
  videoAssets,
  jobs,
  transcripts,
  responseInsights,
  sessionInsights,
  users,
  memberships,
} from "@/lib/db/schema";
import { transcribeVideo } from "@/lib/ai/transcribe";
import { generateResponseInsights, generateSessionInsights } from "@/lib/ai/insights";
import { sendEmail } from "@/lib/email";
import { employerReviewReadyEmail } from "@/lib/email/templates";

type ClaimedJob = {
  id: string;
  type: "transcribe_response" | "generate_response_insights" | "generate_session_insights" | "notify_employer_ready";
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

  if (exhausted && job.type === "transcribe_response") {
    const responseId = job.payload.responseId as string;
    await db.update(candidateResponses).set({ status: "transcription_failed" }).where(eq(candidateResponses.id, responseId));
  }
}

async function enqueue(type: ClaimedJob["type"], payload: Record<string, unknown>) {
  await db.insert(processingJobs).values({ type, payload });
}

async function handleTranscribeResponse(payload: Record<string, unknown>) {
  const responseId = payload.responseId as string;

  const [row] = await db
    .select({
      response: candidateResponses,
      storagePath: videoAssets.storagePath,
      mimeType: videoAssets.mimeType,
    })
    .from(candidateResponses)
    .innerJoin(videoAssets, eq(videoAssets.id, candidateResponses.videoAssetId))
    .where(eq(candidateResponses.id, responseId))
    .limit(1);

  if (!row) throw new Error(`Response ${responseId} not found`);

  await db.update(candidateResponses).set({ status: "transcribing" }).where(eq(candidateResponses.id, responseId));

  const text = await transcribeVideo(row.storagePath, row.mimeType);

  await db.insert(transcripts).values({ responseId, text, provider: "openai" });
  await db.update(candidateResponses).set({ status: "transcribed" }).where(eq(candidateResponses.id, responseId));

  await enqueue("generate_response_insights", { responseId });
}

async function handleGenerateResponseInsights(payload: Record<string, unknown>) {
  const responseId = payload.responseId as string;

  const [row] = await db
    .select({
      response: candidateResponses,
      transcript: transcripts.text,
      question: interviewQuestions.prompt,
      evaluationGuidance: interviewQuestions.evaluationGuidance,
      jobTitle: jobs.title,
      jobId: jobs.id,
    })
    .from(candidateResponses)
    .innerJoin(transcripts, eq(transcripts.responseId, candidateResponses.id))
    .innerJoin(interviewQuestions, eq(interviewQuestions.id, candidateResponses.questionId))
    .innerJoin(jobs, eq(jobs.id, interviewQuestions.jobId))
    .where(eq(candidateResponses.id, responseId))
    .limit(1);

  if (!row) throw new Error(`Response ${responseId} not found`);

  const insight = await generateResponseInsights({
    jobTitle: row.jobTitle,
    question: row.question,
    evaluationGuidance: row.evaluationGuidance,
    transcript: row.transcript,
  });

  await db
    .insert(responseInsights)
    .values({
      responseId,
      summary: insight.summary,
      evidence: insight.evidence,
      strongSignals: insight.strongSignals,
      areasToReview: insight.areasToReview,
      model: process.env.OPENAI_INSIGHTS_MODEL ?? "gpt-4.1",
    })
    .onConflictDoUpdate({
      target: responseInsights.responseId,
      set: {
        summary: insight.summary,
        evidence: insight.evidence,
        strongSignals: insight.strongSignals,
        areasToReview: insight.areasToReview,
      },
    });

  // If every response in this session now has insights, roll up the session-level summary.
  const sessionId = row.response.sessionId;
  const allResponses = await db.select().from(candidateResponses).where(eq(candidateResponses.sessionId, sessionId));
  const allQuestions = await db.select({ id: interviewQuestions.id }).from(interviewQuestions).where(eq(interviewQuestions.jobId, row.jobId));

  const insightedCount = await db
    .select({ responseId: responseInsights.responseId })
    .from(responseInsights)
    .innerJoin(candidateResponses, eq(candidateResponses.id, responseInsights.responseId))
    .where(eq(candidateResponses.sessionId, sessionId));

  if (allResponses.length >= allQuestions.length && insightedCount.length >= allQuestions.length) {
    await enqueue("generate_session_insights", { sessionId });
  }
}

async function handleGenerateSessionInsights(payload: Record<string, unknown>) {
  const sessionId = payload.sessionId as string;

  const rows = await db
    .select({
      question: interviewQuestions.prompt,
      summary: responseInsights.summary,
    })
    .from(candidateResponses)
    .innerJoin(interviewQuestions, eq(interviewQuestions.id, candidateResponses.questionId))
    .innerJoin(responseInsights, eq(responseInsights.responseId, candidateResponses.id))
    .where(eq(candidateResponses.sessionId, sessionId))
    .orderBy(asc(interviewQuestions.orderIndex));

  if (rows.length === 0) throw new Error(`No insighted responses for session ${sessionId}`);

  const [sessionRow] = await db
    .select({ jobTitle: jobs.title })
    .from(interviewSessions)
    .innerJoin(candidateInvitations, eq(candidateInvitations.id, interviewSessions.invitationId))
    .innerJoin(jobs, eq(jobs.id, candidateInvitations.jobId))
    .where(eq(interviewSessions.id, sessionId))
    .limit(1);

  const insight = await generateSessionInsights({
    jobTitle: sessionRow?.jobTitle ?? "this role",
    perQuestion: rows.map((r) => ({ question: r.question, summary: r.summary })),
  });

  await db
    .insert(sessionInsights)
    .values({
      sessionId,
      overallSummary: insight.overallSummary,
      relevantExperience: insight.relevantExperience,
      areasToExplore: insight.areasToExplore,
      suggestedFollowUps: insight.suggestedFollowUps,
      model: process.env.OPENAI_INSIGHTS_MODEL ?? "gpt-4.1",
    })
    .onConflictDoUpdate({
      target: sessionInsights.sessionId,
      set: {
        overallSummary: insight.overallSummary,
        relevantExperience: insight.relevantExperience,
        areasToExplore: insight.areasToExplore,
        suggestedFollowUps: insight.suggestedFollowUps,
      },
    });

  await db.update(interviewSessions).set({ status: "ready_for_review", updatedAt: new Date() }).where(eq(interviewSessions.id, sessionId));

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
      case "transcribe_response":
        await handleTranscribeResponse(job.payload);
        break;
      case "generate_response_insights":
        await handleGenerateResponseInsights(job.payload);
        break;
      case "generate_session_insights":
        await handleGenerateSessionInsights(job.payload);
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
