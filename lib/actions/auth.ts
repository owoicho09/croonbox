"use server";

import { redirect } from "next/navigation";
import { eq, and, gt, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizations, users, memberships, subscriptions, passwordResetTokens } from "@/lib/db/schema";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession, getCurrentUser, destroyAllUserSessions } from "@/lib/auth/session";
import { generateToken, hashToken } from "@/lib/auth/tokens";
import { slugWithSuffix } from "@/lib/org/slug";
import { signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "@/lib/validation/auth";
import { sendEmail } from "@/lib/email";
import { passwordResetEmail, welcomeEmail } from "@/lib/email/templates";

export type ActionState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

function firstFieldErrors(flat: Record<string, string[] | undefined>) {
  const out: Record<string, string> = {};
  for (const [key, messages] of Object.entries(flat)) {
    if (messages?.[0]) out[key] = messages[0];
  }
  return out;
}

export async function signupAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    companyName: formData.get("companyName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: firstFieldErrors(parsed.error.flatten().fieldErrors) };
  }

  const { name, companyName, email, password } = parsed.data;

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    return { fieldErrors: { email: "An account with this email already exists." } };
  }

  const passwordHash = await hashPassword(password);

  const { userId, organizationId } = await db.transaction(async (tx) => {
    const [org] = await tx
      .insert(organizations)
      .values({ name: companyName, slug: slugWithSuffix(companyName) })
      .returning({ id: organizations.id });

    const [user] = await tx
      .insert(users)
      .values({ name, email, passwordHash })
      .returning({ id: users.id });

    await tx.insert(memberships).values({ organizationId: org.id, userId: user.id, role: "owner" });
    await tx.insert(subscriptions).values({ organizationId: org.id, plan: "starter", status: "active" });

    return { userId: user.id, organizationId: org.id };
  });

  await sendEmail({
    organizationId,
    type: "employer_welcome",
    to: email,
    subject: "Welcome to Croonbox",
    html: welcomeEmail({ name, companyName, jobsUrl: `${process.env.NEXT_PUBLIC_APP_URL}/jobs/new` }),
  });

  await createSession(userId);
  redirect("/dashboard");
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: firstFieldErrors(parsed.error.flatten().fieldErrors) };
  }

  const { email, password } = parsed.data;

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || !(await verifyPassword(user.passwordHash, password))) {
    return { error: "Incorrect email or password." };
  }

  await createSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function forgotPasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { fieldErrors: firstFieldErrors(parsed.error.flatten().fieldErrors) };
  }

  const { email } = parsed.data;
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  // Always behave the same whether or not the account exists, to avoid leaking which emails are registered.
  if (user) {
    const { token, tokenHash } = generateToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await db.insert(passwordResetTokens).values({ userId: user.id, tokenHash, expiresAt });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password/${token}`;
    await sendEmail({
      type: "password_reset",
      to: user.email,
      subject: "Reset your Croonbox password",
      html: passwordResetEmail({ name: user.name, resetUrl }),
    });
  }

  return { error: undefined };
}

export async function resetPasswordAction(
  token: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { fieldErrors: firstFieldErrors(parsed.error.flatten().fieldErrors) };
  }

  const tokenHash = hashToken(token);
  const [resetRow] = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        gt(passwordResetTokens.expiresAt, new Date()),
        isNull(passwordResetTokens.usedAt),
      ),
    )
    .limit(1);

  if (!resetRow) {
    return { error: "This reset link is invalid or has expired. Request a new one." };
  }

  const passwordHash = await hashPassword(parsed.data.password);

  await db.transaction(async (tx) => {
    await tx.update(users).set({ passwordHash }).where(eq(users.id, resetRow.userId));
    await tx.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, resetRow.id));
  });

  await destroyAllUserSessions(resetRow.userId);
  redirect("/login?reset=success");
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
