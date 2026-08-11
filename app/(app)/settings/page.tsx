import type { Metadata } from "next";
import { eq, and } from "drizzle-orm";
import { CreditCard } from "lucide-react";
import { db } from "@/lib/db";
import { memberships, users, teamInvitations } from "@/lib/db/schema";
import { requireOrgContext } from "@/lib/org/context";
import { getCurrentInterviewUsage } from "@/lib/billing/usage";
import { PLAN_LIMITS } from "@/lib/billing/limits";
import { startCheckoutAction, openBillingPortalAction } from "@/lib/actions/billing";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { OrgNameForm } from "@/components/settings/org-name-form";
import { InviteMemberForm } from "@/components/settings/invite-member-form";
import { ProfileNameForm } from "@/components/settings/profile-name-form";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { RemoveMemberButton, RevokeInviteButton } from "@/components/settings/member-row-actions";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { user, organization, membership, subscription } = await requireOrgContext();
  const { tab } = await searchParams;
  const isOwner = membership.role === "owner";

  const members = await db
    .select({ membershipId: memberships.id, userId: users.id, name: users.name, email: users.email, role: memberships.role })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(eq(memberships.organizationId, organization.id));

  const pendingInvites = await db
    .select()
    .from(teamInvitations)
    .where(and(eq(teamInvitations.organizationId, organization.id), eq(teamInvitations.status, "pending")));

  const plan = subscription?.plan ?? "starter";
  const usage = await getCurrentInterviewUsage(organization.id);
  const limits = PLAN_LIMITS[plan];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account, workspace, team, and billing.</p>
      </div>

      <Tabs key={tab ?? "profile"} defaultValue={tab ?? "profile"}>
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your profile</CardTitle>
              </CardHeader>
              <CardContent>
                <ProfileNameForm name={user.name} email={user.email} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>Changing your password signs you out of every other device.</CardDescription>
              </CardHeader>
              <CardContent>
                <ChangePasswordForm />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="workspace">
          <Card>
            <CardHeader>
              <CardTitle>Organization</CardTitle>
            </CardHeader>
            <CardContent>
              <OrgNameForm name={organization.name} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>Members</CardTitle>
              <CardDescription>
                {members.length} member{members.length === 1 ? "" : "s"} · owners and members can access every job and candidate in
                this workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {members.map((m) => (
                  <div key={m.membershipId} className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{m.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {m.role}
                      </Badge>
                      {isOwner && m.userId !== user.id && <RemoveMemberButton membershipId={m.membershipId} />}
                    </div>
                  </div>
                ))}
              </div>

              {pendingInvites.length > 0 && (
                <div className="space-y-2">
                  {pendingInvites.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-border px-4 py-2.5">
                      <p className="min-w-0 truncate text-sm text-muted-foreground">{inv.email}</p>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge variant="outline">Invite pending</Badge>
                        {isOwner && <RevokeInviteButton invitationId={inv.id} />}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {isOwner && <InviteMemberForm />}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="capitalize">{plan} plan</CardTitle>
                <Badge variant={plan === "professional" ? "success" : "outline"} className="capitalize">
                  {subscription?.status ?? "active"}
                </Badge>
              </div>
              <CardDescription>
                {usage} interview{usage === 1 ? "" : "s"} used this month
                {limits.maxInterviewsPerMonth !== Infinity ? ` of ${limits.maxInterviewsPerMonth}` : " (unlimited)"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {plan === "starter" ? (
                <form action={startCheckoutAction}>
                  <Button type="submit" className="w-full sm:w-auto">
                    Upgrade to Professional — $49/mo
                  </Button>
                </form>
              ) : (
                <form action={openBillingPortalAction}>
                  <SubmitButton variant="outline">
                    <CreditCard className="h-4 w-4" /> Manage billing
                  </SubmitButton>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
