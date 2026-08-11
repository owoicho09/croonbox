"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { interviewSessions, candidateInvitations, jobs, transcripts } from "@/lib/db/schema";
import { requireOrgContext } from "@/lib/org/context";
import { fetchConversationTranscript } from "@/lib/elevenlabs";
import { ingestSessionTranscript } from "@/lib/elevenlabs/ingest";

// Manual fallback for when ElevenLabs' post-call webhook never arrives — most commonly because
// the app isn't running behind a publicly reachable URL (e.g. local dev without a tunnel), or a
// single delivery was missed. Pulls the transcript directly from the ElevenLabs API instead.
export async function syncTranscriptAction(sessionId: string): Promise<{ error?: string }> {
  const { organization } = await requireOrgContext();

  const [row] = await db
    .select({ session: interviewSessions })
    .from(interviewSessions)
    .innerJoin(candidateInvitations, eq(candidateInvitations.id, interviewSessions.invitationId))
    .innerJoin(jobs, eq(jobs.id, candidateInvitations.jobId))
    .where(and(eq(interviewSessions.id, sessionId), eq(jobs.organizationId, organization.id)))
    .limit(1);

  if (!row) return { error: "Session not found." };
  if (!row.session.elevenLabsConversationId) {
    return { error: "This interview hasn't connected to ElevenLabs yet — there's no conversation to sync." };
  }

  const [existingTranscript] = await db
    .select({ id: transcripts.id })
    .from(transcripts)
    .where(eq(transcripts.sessionId, sessionId))
    .limit(1);
  if (existingTranscript) return { error: "Transcript already synced." };

  let data;
  try {
    data = await fetchConversationTranscript(row.session.elevenLabsConversationId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Couldn't reach ElevenLabs." };
  }

  if (!data.transcript || data.transcript.length === 0) {
    return { error: "ElevenLabs hasn't finished processing this conversation yet — try again shortly." };
  }

  await ingestSessionTranscript(sessionId, data.transcript);

  revalidatePath(`/candidates/${sessionId}`);
  return {};
}
