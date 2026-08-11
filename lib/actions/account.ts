"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireUser } from "@/lib/actions/auth";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroyAllUserSessions } from "@/lib/auth/session";
import { updateNameSchema, changePasswordSchema } from "@/lib/validation/auth";
import type { ActionState } from "@/lib/actions/auth";

function firstFieldErrors(flat: Record<string, string[] | undefined>) {
  const out: Record<string, string> = {};
  for (const [key, messages] of Object.entries(flat)) {
    if (messages?.[0]) out[key] = messages[0];
  }
  return out;
}

export async function updateNameAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();

  const parsed = updateNameSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { fieldErrors: firstFieldErrors(parsed.error.flatten().fieldErrors) };
  }

  await db.update(users).set({ name: parsed.data.name, updatedAt: new Date() }).where(eq(users.id, user.id));

  revalidatePath("/settings");
  return { error: undefined };
}

export type ChangePasswordState = (ActionState & { success?: boolean }) | undefined;

export async function changePasswordAction(_prev: ChangePasswordState, formData: FormData): Promise<ChangePasswordState> {
  const user = await requireUser();

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmNewPassword: formData.get("confirmNewPassword"),
  });
  if (!parsed.success) {
    return { fieldErrors: firstFieldErrors(parsed.error.flatten().fieldErrors) };
  }

  const [row] = await db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, user.id)).limit(1);
  if (!row || !(await verifyPassword(row.passwordHash, parsed.data.currentPassword))) {
    return { fieldErrors: { currentPassword: "Current password is incorrect." } };
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, user.id));

  // Log out every other session for security, then re-issue one for this device.
  await destroyAllUserSessions(user.id);
  await createSession(user.id);

  revalidatePath("/settings");
  return { success: true };
}
