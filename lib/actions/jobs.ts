"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, and, max } from "drizzle-orm";
import { db } from "@/lib/db";
import { jobs, interviewQuestions, activityLog } from "@/lib/db/schema";
import { requireOrgContext } from "@/lib/org/context";
import { jobDetailsSchema, questionSchema } from "@/lib/validation/job";
import { canCreateActiveJob } from "@/lib/billing/limits";
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
    candidateInstructions: formData.get("candidateInstructions"),
    defaultPrepSeconds: formData.get("defaultPrepSeconds"),
    defaultResponseSeconds: formData.get("defaultResponseSeconds"),
    retakesAllowed: formData.get("retakesAllowed"),
    deadlineAt: formData.get("deadlineAt"),
  });

  if (!parsed.success) {
    return { fieldErrors: firstFieldErrors(parsed.error.flatten().fieldErrors) };
  }

  const { title, candidateInstructions, defaultPrepSeconds, defaultResponseSeconds, retakesAllowed, deadlineAt } =
    parsed.data;

  const [job] = await db
    .insert(jobs)
    .values({
      organizationId: organization.id,
      title,
      candidateInstructions: candidateInstructions || null,
      defaultPrepSeconds,
      defaultResponseSeconds,
      retakesAllowed,
      deadlineAt: deadlineAt ? new Date(deadlineAt) : null,
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
    candidateInstructions: formData.get("candidateInstructions"),
    defaultPrepSeconds: formData.get("defaultPrepSeconds"),
    defaultResponseSeconds: formData.get("defaultResponseSeconds"),
    retakesAllowed: formData.get("retakesAllowed"),
    deadlineAt: formData.get("deadlineAt"),
  });

  if (!parsed.success) {
    return { fieldErrors: firstFieldErrors(parsed.error.flatten().fieldErrors) };
  }

  const { title, candidateInstructions, defaultPrepSeconds, defaultResponseSeconds, retakesAllowed, deadlineAt } =
    parsed.data;

  await db
    .update(jobs)
    .set({
      title,
      candidateInstructions: candidateInstructions || null,
      defaultPrepSeconds,
      defaultResponseSeconds,
      retakesAllowed,
      deadlineAt: deadlineAt ? new Date(deadlineAt) : null,
      updatedAt: new Date(),
    })
    .where(and(eq(jobs.id, jobId), eq(jobs.organizationId, organization.id)));

  revalidatePath(`/jobs/${jobId}`);
  return { error: undefined };
}

export async function publishJobAction(jobId: string): Promise<ActionState> {
  const { organization, user, subscription } = await requireOrgContext();

  const [job] = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.organizationId, organization.id)))
    .limit(1);
  if (!job) return { error: "Job not found." };

  const [{ value: maxOrderIndex }] = await db
    .select({ value: max(interviewQuestions.orderIndex) })
    .from(interviewQuestions)
    .where(eq(interviewQuestions.jobId, jobId));
  if (maxOrderIndex === null) {
    return { error: "Add at least one interview question before publishing." };
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

export async function addQuestionAction(jobId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const { organization } = await requireOrgContext();

  const parsed = questionSchema.safeParse({
    prompt: formData.get("prompt"),
    prepSeconds: formData.get("prepSeconds") || undefined,
    responseSeconds: formData.get("responseSeconds") || undefined,
    evaluationGuidance: formData.get("evaluationGuidance"),
  });

  if (!parsed.success) {
    return { fieldErrors: firstFieldErrors(parsed.error.flatten().fieldErrors) };
  }

  const [job] = await db
    .select({ id: jobs.id })
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.organizationId, organization.id)))
    .limit(1);
  if (!job) return { error: "Job not found." };

  const [{ value: currentMax }] = await db
    .select({ value: max(interviewQuestions.orderIndex) })
    .from(interviewQuestions)
    .where(eq(interviewQuestions.jobId, jobId));

  const { prompt, prepSeconds, responseSeconds, evaluationGuidance } = parsed.data;

  await db.insert(interviewQuestions).values({
    jobId,
    orderIndex: (currentMax ?? -1) + 1,
    prompt,
    prepSeconds: prepSeconds ?? null,
    responseSeconds: responseSeconds ?? null,
    evaluationGuidance: evaluationGuidance || null,
  });

  revalidatePath(`/jobs/${jobId}`);
  return { error: undefined };
}

export async function deleteQuestionAction(jobId: string, questionId: string) {
  const { organization } = await requireOrgContext();
  const [job] = await db
    .select({ id: jobs.id })
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.organizationId, organization.id)))
    .limit(1);
  if (!job) return;

  await db.delete(interviewQuestions).where(and(eq(interviewQuestions.id, questionId), eq(interviewQuestions.jobId, jobId)));
  revalidatePath(`/jobs/${jobId}`);
}
