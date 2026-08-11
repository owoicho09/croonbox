import "server-only";
import { eq, and, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  jobs,
  candidateInvitations,
  candidates,
  aiInterviewConfigs,
  interviewSessions,
  recordings,
  transcripts,
  aiReports,
  reviewNotes,
  users,
} from "@/lib/db/schema";
import { createSignedPlaybackUrl } from "@/lib/storage";

export async function getCandidateReviewDetail(sessionId: string, organizationId: string) {
  const [row] = await db
    .select({
      job: jobs,
      candidate: candidates,
      session: interviewSessions,
      invitation: candidateInvitations,
      config: aiInterviewConfigs,
    })
    .from(interviewSessions)
    .innerJoin(candidateInvitations, eq(candidateInvitations.id, interviewSessions.invitationId))
    .innerJoin(jobs, eq(jobs.id, candidateInvitations.jobId))
    .innerJoin(candidates, eq(candidates.id, candidateInvitations.candidateId))
    .leftJoin(aiInterviewConfigs, eq(aiInterviewConfigs.jobId, jobs.id))
    .where(and(eq(interviewSessions.id, sessionId), eq(jobs.organizationId, organizationId)))
    .limit(1);

  if (!row) return null;
  const { job, candidate, session, config } = row;

  const [recording] = await db.select().from(recordings).where(eq(recordings.sessionId, sessionId)).limit(1);

  let recordingUrl: string | null = null;
  if (recording) {
    try {
      recordingUrl = await createSignedPlaybackUrl(recording.storagePath);
    } catch {
      // Storage not configured yet — recording simply won't render.
    }
  }

  const [transcript] = await db.select().from(transcripts).where(eq(transcripts.sessionId, sessionId)).limit(1);
  const [report] = await db.select().from(aiReports).where(eq(aiReports.sessionId, sessionId)).limit(1);

  const notes = await db
    .select({ note: reviewNotes, authorName: users.name })
    .from(reviewNotes)
    .innerJoin(users, eq(users.id, reviewNotes.userId))
    .where(eq(reviewNotes.sessionId, sessionId))
    .orderBy(asc(reviewNotes.createdAt));

  return { job, candidate, session, config, recording, recordingUrl, transcript, report, notes };
}
