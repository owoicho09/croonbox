"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext } from "@/lib/org/context";
import { singleCandidateSchema } from "@/lib/validation/candidate";
import { parseCandidateRows } from "@/lib/candidates/parse";
import { inviteCandidates } from "@/lib/candidates/invite";
import type { ActionState } from "@/lib/actions/auth";

export type InviteState = (ActionState & { summary?: string }) | undefined;

async function runInvite(jobId: string, rows: { name: string; email: string }[]): Promise<InviteState> {
  if (rows.length === 0) return { error: "No valid candidates found." };

  const { organization, user, subscription } = await requireOrgContext();

  const result = await inviteCandidates({
    jobId,
    organizationId: organization.id,
    organizationName: organization.name,
    invitedByUserId: user.id,
    plan: subscription?.plan ?? "starter",
    rows,
  });

  revalidatePath(`/jobs/${jobId}/candidates`);

  const parts = [`${result.created} invited`];
  if (result.skipped.length) parts.push(`${result.skipped.length} already invited`);
  if (result.errors.length) parts.push(`${result.errors.length} failed`);

  return {
    summary: parts.join(" · "),
    error: result.errors[0],
  };
}

export async function inviteSingleCandidateAction(
  jobId: string,
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const parsed = singleCandidateSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
  });

  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    return { fieldErrors: { name: flat.name?.[0] ?? "", email: flat.email?.[0] ?? "" } };
  }

  return runInvite(jobId, [parsed.data]);
}

export async function inviteBulkCandidatesAction(
  jobId: string,
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const raw = String(formData.get("rows") ?? "");
  const { rows, errors } = parseCandidateRows(raw);

  const result = await runInvite(jobId, rows);
  if (errors.length) {
    return { ...result, error: result?.error ?? errors[0] };
  }
  return result;
}

export async function inviteCsvCandidatesAction(
  jobId: string,
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a CSV file to upload." };
  }

  const raw = await file.text();
  const { rows, errors } = parseCandidateRows(raw);

  const result = await runInvite(jobId, rows);
  if (errors.length) {
    return { ...result, error: result?.error ?? errors[0] };
  }
  return result;
}
