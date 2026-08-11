"use server";

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  candidateInvitations,
  candidates,
  jobs,
  organizations,
  aiInterviewConfigs,
  interviewSessions,
  recordings,
} from "@/lib/db/schema";
import { hashToken } from "@/lib/auth/tokens";
import { createSignedUploadUrl } from "@/lib/storage";
import { getSignedConversationUrl, buildInterviewDynamicVariables } from "@/lib/elevenlabs";

async function resolveSession(token: string) {
  const tokenHash = hashToken(token);
  const [invitation] = await db
    .select()
    .from(candidateInvitations)
    .where(eq(candidateInvitations.tokenHash, tokenHash))
    .limit(1);
  if (!invitation) throw new Error("Invalid interview link.");
  if (invitation.expiresAt.getTime() < Date.now()) throw new Error("This interview link has expired.");

  const [session] = await db
    .select()
    .from(interviewSessions)
    .where(eq(interviewSessions.invitationId, invitation.id))
    .limit(1);
  if (!session) throw new Error("Interview session not found.");

  return { invitation, session };
}

export async function startLiveInterviewAction(token: string) {
  const { invitation, session } = await resolveSession(token);

  const [row] = await db
    .select({ candidate: candidates, job: jobs, organizationName: organizations.name, config: aiInterviewConfigs })
    .from(candidates)
    .innerJoin(jobs, eq(jobs.id, invitation.jobId))
    .innerJoin(organizations, eq(organizations.id, jobs.organizationId))
    .innerJoin(aiInterviewConfigs, eq(aiInterviewConfigs.jobId, jobs.id))
    .where(eq(candidates.id, invitation.candidateId))
    .limit(1);

  if (!row) throw new Error("This interview isn't ready yet.");

  if (session.status === "not_started" || session.status === "failed") {
    await db
      .update(interviewSessions)
      .set({ status: "in_progress", startedAt: new Date(), failureReason: null })
      .where(eq(interviewSessions.id, session.id));
  }
  if (invitation.status === "pending") {
    await db.update(candidateInvitations).set({ status: "opened" }).where(eq(candidateInvitations.id, invitation.id));
  }

  const signedUrl = await getSignedConversationUrl();
  const dynamicVariables = buildInterviewDynamicVariables({
    jobTitle: row.job.title,
    companyName: row.organizationName,
    candidateName: row.candidate.name,
    interviewerRole: row.config.interviewerRole,
    focusAreas: row.config.focusAreas,
    questions: row.config.questions,
    tone: row.config.tone,
    openingLine: row.config.openingLine,
    closingLine: row.config.closingLine,
    followUpGuidance: row.config.followUpGuidance,
    avoidList: row.config.avoidList,
    maxDurationMinutes: row.job.maxDurationMinutes,
  });

  return { signedUrl, dynamicVariables };
}

export async function requestRecordingUploadTicketAction(token: string, mimeType: string) {
  const { session } = await resolveSession(token);
  const extension = mimeType.includes("mp4") ? "mp4" : "webm";
  const path = `${session.id}/recording-${randomUUID()}.${extension}`;
  return createSignedUploadUrl(path);
}

export async function completeInterviewAction(params: {
  token: string;
  conversationId: string;
  storagePath?: string;
  mimeType?: string;
  durationSeconds?: number;
  sizeBytes?: number;
}) {
  const { token, conversationId, storagePath, mimeType, durationSeconds, sizeBytes } = params;
  const { session } = await resolveSession(token);

  if (storagePath && mimeType) {
    await db
      .insert(recordings)
      .values({ sessionId: session.id, storagePath, mimeType, durationSeconds, sizeBytes })
      .onConflictDoUpdate({
        target: recordings.sessionId,
        set: { storagePath, mimeType, durationSeconds, sizeBytes },
      });
  }

  await db
    .update(interviewSessions)
    .set({ status: "processing", completedAt: new Date(), elevenLabsConversationId: conversationId, updatedAt: new Date() })
    .where(eq(interviewSessions.id, session.id));

  return { ok: true };
}

export async function failInterviewAction(token: string, reason: string) {
  const { session } = await resolveSession(token);
  await db
    .update(interviewSessions)
    .set({ status: "failed", failureReason: reason, completedAt: new Date(), updatedAt: new Date() })
    .where(eq(interviewSessions.id, session.id));
  return { ok: true };
}
