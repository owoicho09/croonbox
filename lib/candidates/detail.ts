import "server-only";
import { eq, and, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  jobs,
  candidateInvitations,
  candidates,
  interviewSessions,
  interviewQuestions,
  candidateResponses,
  videoAssets,
  transcripts,
  responseInsights,
  sessionInsights,
  reviewNotes,
  users,
} from "@/lib/db/schema";
import { createSignedPlaybackUrl } from "@/lib/storage";

export async function getCandidateReviewDetail(sessionId: string, organizationId: string) {
  const [row] = await db
    .select({ job: jobs, candidate: candidates, session: interviewSessions, invitation: candidateInvitations })
    .from(interviewSessions)
    .innerJoin(candidateInvitations, eq(candidateInvitations.id, interviewSessions.invitationId))
    .innerJoin(jobs, eq(jobs.id, candidateInvitations.jobId))
    .innerJoin(candidates, eq(candidates.id, candidateInvitations.candidateId))
    .where(and(eq(interviewSessions.id, sessionId), eq(jobs.organizationId, organizationId)))
    .limit(1);

  if (!row) return null;
  const { job, candidate, session } = row;

  const questions = await db
    .select()
    .from(interviewQuestions)
    .where(eq(interviewQuestions.jobId, job.id))
    .orderBy(asc(interviewQuestions.orderIndex));

  const responseRows = await db
    .select({
      response: candidateResponses,
      storagePath: videoAssets.storagePath,
      transcriptText: transcripts.text,
      insight: responseInsights,
    })
    .from(candidateResponses)
    .leftJoin(videoAssets, eq(videoAssets.id, candidateResponses.videoAssetId))
    .leftJoin(transcripts, eq(transcripts.responseId, candidateResponses.id))
    .leftJoin(responseInsights, eq(responseInsights.responseId, candidateResponses.id))
    .where(eq(candidateResponses.sessionId, sessionId));

  const responseByQuestion = new Map(responseRows.map((r) => [r.response.questionId, r]));

  const playbackUrls = new Map<string, string>();
  await Promise.all(
    responseRows
      .filter((r) => r.storagePath)
      .map(async (r) => {
        try {
          playbackUrls.set(r.response.id, await createSignedPlaybackUrl(r.storagePath!));
        } catch {
          // Storage not configured yet — video simply won't render.
        }
      }),
  );

  const [overallInsight] = await db.select().from(sessionInsights).where(eq(sessionInsights.sessionId, sessionId)).limit(1);

  const notes = await db
    .select({ note: reviewNotes, authorName: users.name })
    .from(reviewNotes)
    .innerJoin(users, eq(users.id, reviewNotes.userId))
    .where(eq(reviewNotes.sessionId, sessionId))
    .orderBy(asc(reviewNotes.createdAt));

  return { job, candidate, session, questions, responseByQuestion, playbackUrls, overallInsight, notes };
}
