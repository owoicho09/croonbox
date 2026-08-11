"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, and, gt, count } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { teamInvitations, memberships } from "@/lib/db/schema";
import { requireOrgContext } from "@/lib/org/context";
import { requireUser } from "@/lib/actions/auth";
import { generateToken, hashToken } from "@/lib/auth/tokens";
import { sendEmail } from "@/lib/email";
import { teamInvitationEmail } from "@/lib/email/templates";
import type { ActionState } from "@/lib/actions/auth";

const schema = z.object({ email: z.string().trim().toLowerCase().email("Enter a valid email") });

export async function inviteTeamMemberAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { organization, user } = await requireOrgContext();

  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { fieldErrors: { email: parsed.error.flatten().fieldErrors.email?.[0] ?? "Invalid email" } };
  }
  const { email } = parsed.data;

  const { token, tokenHash } = generateToken();
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  await db
    .insert(teamInvitations)
    .values({ organizationId: organization.id, email, tokenHash, invitedBy: user.id, expiresAt })
    .onConflictDoUpdate({
      target: [teamInvitations.organizationId, teamInvitations.email],
      set: { tokenHash, status: "pending", expiresAt, invitedBy: user.id },
    });

  await sendEmail({
    organizationId: organization.id,
    type: "team_invitation",
    to: email,
    subject: `${user.name} invited you to join ${organization.name} on Croonbox`,
    html: teamInvitationEmail({
      inviterName: user.name,
      companyName: organization.name,
      inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL}/team-invite/${token}`,
    }),
  });

  revalidatePath("/team");
  return { error: undefined };
}

export async function acceptTeamInvitationAction(token: string) {
  const user = await requireUser();
  const tokenHash = hashToken(token);

  const [invitation] = await db
    .select()
    .from(teamInvitations)
    .where(
      and(eq(teamInvitations.tokenHash, tokenHash), eq(teamInvitations.status, "pending"), gt(teamInvitations.expiresAt, new Date())),
    )
    .limit(1);

  if (!invitation) {
    return { error: "This invitation is invalid or has expired." };
  }

  if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
    return { error: `This invitation was sent to ${invitation.email}. Log in with that email to accept it.` };
  }

  const [existing] = await db
    .select({ id: memberships.id })
    .from(memberships)
    .where(and(eq(memberships.organizationId, invitation.organizationId), eq(memberships.userId, user.id)))
    .limit(1);

  if (!existing) {
    await db.insert(memberships).values({ organizationId: invitation.organizationId, userId: user.id, role: invitation.role });
  }
  await db.update(teamInvitations).set({ status: "accepted" }).where(eq(teamInvitations.id, invitation.id));

  redirect("/dashboard");
}

// Plain <form action> targets (not wired through useActionState), so these return void — the
// remove/revoke buttons only render for owners against rows already known to exist, so the
// guard branches below are backstops, not user-facing error paths.
export async function removeMemberAction(membershipId: string): Promise<void> {
  const { organization, membership } = await requireOrgContext();
  if (membership.role !== "owner") return;

  const [target] = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.id, membershipId), eq(memberships.organizationId, organization.id)))
    .limit(1);
  if (!target) return;

  if (target.role === "owner") {
    const [{ value: ownerCount }] = await db
      .select({ value: count() })
      .from(memberships)
      .where(and(eq(memberships.organizationId, organization.id), eq(memberships.role, "owner")));
    if (ownerCount <= 1) return;
  }

  await db.delete(memberships).where(eq(memberships.id, membershipId));
  revalidatePath("/team");
}

export async function revokeTeamInvitationAction(invitationId: string): Promise<void> {
  const { organization, membership } = await requireOrgContext();
  if (membership.role !== "owner") return;

  await db
    .update(teamInvitations)
    .set({ status: "revoked" })
    .where(and(eq(teamInvitations.id, invitationId), eq(teamInvitations.organizationId, organization.id)));

  revalidatePath("/team");
}
