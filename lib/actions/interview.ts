"use server";

import { randomUUID } from "node:crypto";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  candidateInvitations,
  interviewSessions,
  interviewQuestions,
  candidateResponses,
  videoAssets,
  processingJobs,
} from "@/lib/db/schema";
import { hashToken } from "@/lib/auth/tokens";
import { createSignedUploadUrl } from "@/lib/storage";

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

export async function startInterviewAction(token: string) {
  const { invitation, session } = await resolveSession(token);

  if (session.status === "not_started") {
    await db.update(interviewSessions).set({ status: "in_progress", startedAt: new Date() }).where(eq(interviewSessions.id, session.id));
  }
  if (invitation.status === "pending") {
    await db.update(candidateInvitations).set({ status: "opened" }).where(eq(candidateInvitations.id, invitation.id));
  }

  return { ok: true };
}

export async function requestUploadTicketAction(token: string, questionId: string, mimeType: string) {
  const { session } = await resolveSession(token);

  const [question] = await db
    .select({ id: interviewQuestions.id })
    .from(interviewQuestions)
    .where(eq(interviewQuestions.id, questionId))
    .limit(1);
  if (!question) throw new Error("Question not found.");

  const extension = mimeType.includes("mp4") ? "mp4" : "webm";
  const path = `${session.id}/${questionId}/${randomUUID()}.${extension}`;

  const ticket = await createSignedUploadUrl(path);
  return ticket;
}

export async function saveResponseAction(params: {
  token: string;
  questionId: string;
  storagePath: string;
  mimeType: string;
  durationSeconds: number;
  sizeBytes: number;
}) {
  const { token, questionId, storagePath, mimeType, durationSeconds, sizeBytes } = params;
  const { session } = await resolveSession(token);

  const [asset] = await db
    .insert(videoAssets)
    .values({ storagePath, mimeType, durationSeconds, sizeBytes })
    .returning({ id: videoAssets.id });

  const [existing] = await db
    .select()
    .from(candidateResponses)
    .where(and(eq(candidateResponses.sessionId, session.id), eq(candidateResponses.questionId, questionId)))
    .limit(1);

  let responseId: string;
  if (existing) {
    await db
      .update(candidateResponses)
      .set({
        videoAssetId: asset.id,
        status: "uploaded",
        retakeCount: existing.retakeCount + 1,
        recordedAt: new Date(),
      })
      .where(eq(candidateResponses.id, existing.id));
    responseId = existing.id;
  } else {
    const [created] = await db
      .insert(candidateResponses)
      .values({ sessionId: session.id, questionId, videoAssetId: asset.id, status: "uploaded" })
      .returning({ id: candidateResponses.id });
    responseId = created.id;
  }

  await db.insert(processingJobs).values({
    type: "transcribe_response",
    payload: { responseId },
  });

  return { ok: true };
}

export async function completeInterviewAction(token: string) {
  const { session, invitation } = await resolveSession(token);

  const questions = await db
    .select({ id: interviewQuestions.id })
    .from(interviewQuestions)
    .where(eq(interviewQuestions.jobId, invitation.jobId));

  const responses = await db.select().from(candidateResponses).where(eq(candidateResponses.sessionId, session.id));
  const answeredIds = new Set(responses.map((r) => r.questionId));
  const missing = questions.filter((q) => !answeredIds.has(q.id));
  if (missing.length > 0) {
    throw new Error("Please answer every question before submitting.");
  }

  await db
    .update(interviewSessions)
    .set({ status: "processing", completedAt: new Date() })
    .where(eq(interviewSessions.id, session.id));

  return { ok: true };
}
