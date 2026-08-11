"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { jobs, aiInterviewConfigs, activityLog, candidates, candidateInvitations, interviewSessions } from "@/lib/db/schema";
import { requireOrgContext } from "@/lib/org/context";
import { jobDetailsSchema, generateInterviewSchema } from "@/lib/validation/job";
import { canCreateActiveJob } from "@/lib/billing/limits";
import { generateInterviewConfig } from "@/lib/ai/interview-generator";
import { generateToken } from "@/lib/auth/tokens";
import type { ActionState } from "@/lib/actions/auth";

function firstFieldErrors(flat: Record<string, string[] | undefined>) {
  const out: Record<string, string> = {};
  for (const [key, messages] of Object.entries(flat)) {
    if (messages?.[0]) out[key] = messages[0];
  }
  return out;
}

async function logActivity(organizationId: string, actorUserId: string, action: string, entityType: string, entityId: string) {
  await db.insert(activityLog).values({ organizationId, actorUserId, action, entityType, entityId });
}

export async function createJobAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { organization, user } = await requireOrgContext();

  const parsed = jobDetailsSchema.safeParse({
    title: formData.get("title"),
    department: formData.get("department"),
    location: formData.get("location"),
    employmentType: formData.get("employmentType"),
    seniorityLevel: formData.get("seniorityLevel"),
    context: formData.get("context"),
    candidateInstructions: formData.get("candidateInstructions"),
    maxDurationMinutes: formData.get("maxDurationMinutes"),
    deadlineAt: formData.get("deadlineAt"),
  });

  if (!parsed.success) {
    return { fieldErrors: firstFieldErrors(parsed.error.flatten().fieldErrors) };
  }

  const { title, department, location, employmentType, seniorityLevel, context, candidateInstructions, maxDurationMinutes, deadlineAt } =
    parsed.data;

  const [job] = await db
    .insert(jobs)
    .values({
      organizationId: organization.id,
      title,
      department: department || null,
      location: location || null,
      employmentType: employmentType || null,
      seniorityLevel: seniorityLevel || null,
      context,
      candidateInstructions: candidateInstructions || null,
      maxDurationMinutes,
      deadlineAt: deadlineAt ? new Date(deadlineAt) : null,
      cameraRequired: formData.get("cameraRequired") === "on",
      createdBy: user.id,
    })
    .returning({ id: jobs.id });

  await logActivity(organization.id, user.id, "job.created", "job", job.id);
  redirect(`/jobs/${job.id}`);
}

export async function updateJobDetailsAction(jobId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const { organization } = await requireOrgContext();

  const parsed = jobDetailsSchema.safeParse({
    title: formData.get("title"),
    department: formData.get("department"),
    location: formData.get("location"),
    employmentType: formData.get("employmentType"),
    seniorityLevel: formData.get("seniorityLevel"),
    context: formData.get("context"),
    candidateInstructions: formData.get("candidateInstructions"),
    maxDurationMinutes: formData.get("maxDurationMinutes"),
    deadlineAt: formData.get("deadlineAt"),
  });

  if (!parsed.success) {
    return { fieldErrors: firstFieldErrors(parsed.error.flatten().fieldErrors) };
  }

  const { title, department, location, employmentType, seniorityLevel, context, candidateInstructions, maxDurationMinutes, deadlineAt } =
    parsed.data;

  await db
    .update(jobs)
    .set({
      title,
      department: department || null,
      location: location || null,
      employmentType: employmentType || null,
      seniorityLevel: seniorityLevel || null,
      context,
      candidateInstructions: candidateInstructions || null,
      maxDurationMinutes,
      deadlineAt: deadlineAt ? new Date(deadlineAt) : null,
      cameraRequired: formData.get("cameraRequired") === "on",
      updatedAt: new Date(),
    })
    .where(and(eq(jobs.id, jobId), eq(jobs.organizationId, organization.id)));

  revalidatePath(`/jobs/${jobId}`);
  return { error: undefined };
}

export type GenerateState = (ActionState & { generated?: boolean }) | undefined;

export async function generateInterviewConfigAction(
  jobId: string,
  _prev: GenerateState,
  formData: FormData,
): Promise<GenerateState> {
  const { organization, user } = await requireOrgContext();

  const parsed = generateInterviewSchema.safeParse({ guidanceNote: formData.get("guidanceNote") });
  if (!parsed.success) {
    return { fieldErrors: firstFieldErrors(parsed.error.flatten().fieldErrors) };
  }

  const [job] = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.organizationId, organization.id)))
    .limit(1);
  if (!job) return { error: "Job not found." };
  if (!job.context) return { error: "Add a job description before generating the interview." };

  let draft;
  try {
    draft = await generateInterviewConfig({
      jobTitle: job.title,
      context: job.context,
      guidanceNote: parsed.data.guidanceNote || undefined,
    });
  } catch {
    return { error: "Something went wrong generating the interview. Try again." };
  }

  await db
    .insert(aiInterviewConfigs)
    .values({
      jobId,
      interviewerRole: draft.interviewerRole,
      focusAreas: draft.focusAreas,
      questions: draft.questions,
      tone: draft.tone,
      openingLine: draft.openingLine,
      closingLine: draft.closingLine,
      followUpGuidance: draft.followUpGuidance,
      avoidList: draft.avoidList,
      guidanceNote: parsed.data.guidanceNote || null,
      model: process.env.ANTHROPIC_INTERVIEW_MODEL ?? "claude-opus-5",
    })
    .onConflictDoUpdate({
      target: aiInterviewConfigs.jobId,
      set: {
        interviewerRole: draft.interviewerRole,
        focusAreas: draft.focusAreas,
        questions: draft.questions,
        tone: draft.tone,
        openingLine: draft.openingLine,
        closingLine: draft.closingLine,
        followUpGuidance: draft.followUpGuidance,
        avoidList: draft.avoidList,
        guidanceNote: parsed.data.guidanceNote || null,
        updatedAt: new Date(),
      },
    });

  await logActivity(organization.id, user.id, "job.interview_generated", "job", jobId);
  revalidatePath(`/jobs/${jobId}`);
  return { generated: true };
}

export async function publishJobAction(jobId: string): Promise<ActionState> {
  const { organization, user, subscription } = await requireOrgContext();

  const [job] = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.organizationId, organization.id)))
    .limit(1);
  if (!job) return { error: "Job not found." };

  const [config] = await db.select({ id: aiInterviewConfigs.id }).from(aiInterviewConfigs).where(eq(aiInterviewConfigs.jobId, jobId)).limit(1);
  if (!config) {
    return { error: "Generate the interview structure before publishing." };
  }

  const allowed = await canCreateActiveJob(organization.id, subscription?.plan ?? "starter");
  if (!allowed) {
    return { error: "You've reached your plan's active job limit. Upgrade to publish more jobs." };
  }

  await db
    .update(jobs)
    .set({ status: "published", publishedAt: new Date(), updatedAt: new Date() })
    .where(eq(jobs.id, jobId));

  await logActivity(organization.id, user.id, "job.published", "job", jobId);
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/jobs");
  return { error: undefined };
}

export async function archiveJobAction(jobId: string) {
  const { organization, user } = await requireOrgContext();
  await db
    .update(jobs)
    .set({ status: "archived", updatedAt: new Date() })
    .where(and(eq(jobs.id, jobId), eq(jobs.organizationId, organization.id)));
  await logActivity(organization.id, user.id, "job.archived", "job", jobId);
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/jobs");
}

// "Closed" stops new invitations while keeping the job and its candidates fully reviewable —
// distinct from "archived", which is a soft-hide once the hiring team is done with the job entirely.
export async function closeJobAction(jobId: string) {
  const { organization, user } = await requireOrgContext();
  await db
    .update(jobs)
    .set({ status: "closed", updatedAt: new Date() })
    .where(and(eq(jobs.id, jobId), eq(jobs.organizationId, organization.id)));
  await logActivity(organization.id, user.id, "job.closed", "job", jobId);
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/jobs");
}

// Lets an employer test the real live-interview flow end to end (same ElevenLabs call,
// recording, transcript, and AI report pipeline a candidate goes through) without inflating
// candidate counts or plan usage. Reuses one preview candidate identity per user per org, and
// resets its session on every call so the employer can retest as many times as they like.
export async function previewInterviewAction(jobId: string): Promise<{ token: string } | { error: string }> {
  const { organization, user } = await requireOrgContext();

  const [job] = await db
    .select({ id: jobs.id })
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.organizationId, organization.id)))
    .limit(1);
  if (!job) return { error: "Job not found." };

  const [config] = await db.select({ id: aiInterviewConfigs.id }).from(aiInterviewConfigs).where(eq(aiInterviewConfigs.jobId, jobId)).limit(1);
  if (!config) return { error: "Generate the AI interview before previewing." };

  const previewEmail = `preview+${user.id}@croonbox.preview`;
  let [candidate] = await db
    .select()
    .from(candidates)
    .where(and(eq(candidates.organizationId, organization.id), eq(candidates.email, previewEmail)))
    .limit(1);
  if (!candidate) {
    [candidate] = await db
      .insert(candidates)
      .values({ organizationId: organization.id, email: previewEmail, name: `${user.name} (Preview)`, isPreview: true })
      .returning();
  }

  const { token, tokenHash } = generateToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const [invitation] = await db
    .insert(candidateInvitations)
    .values({ jobId, candidateId: candidate.id, tokenHash, invitedBy: user.id, expiresAt, status: "pending" })
    .onConflictDoUpdate({
      target: [candidateInvitations.jobId, candidateInvitations.candidateId],
      set: { tokenHash, expiresAt, status: "pending" },
    })
    .returning({ id: candidateInvitations.id });

  const [existingSession] = await db
    .select({ id: interviewSessions.id })
    .from(interviewSessions)
    .where(eq(interviewSessions.invitationId, invitation.id))
    .limit(1);

  if (existingSession) {
    await db
      .update(interviewSessions)
      .set({
        status: "not_started",
        startedAt: null,
        completedAt: null,
        failureReason: null,
        elevenLabsConversationId: null,
        decision: "none",
        decidedBy: null,
        decidedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(interviewSessions.id, existingSession.id));
  } else {
    await db.insert(interviewSessions).values({ invitationId: invitation.id, status: "not_started" });
  }

  return { token };
}
