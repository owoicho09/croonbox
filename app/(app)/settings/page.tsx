import Link from "next/link";
import type { Metadata } from "next";
import { eq, and } from "drizzle-orm";
import { CreditCard } from "lucide-react";
import { db } from "@/lib/db";
import { memberships, users, teamInvitations } from "@/lib/db/schema";
import { requireOrgContext } from "@/lib/org/context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrgNameForm } from "@/components/settings/org-name-form";
import { InviteMemberForm } from "@/components/settings/invite-member-form";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { organization, membership } = await requireOrgContext();

  const members = await db
    .select({ id: users.id, name: users.name, email: users.email, role: memberships.role })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(eq(memberships.organizationId, organization.id));

  const pendingInvites = await db
    .select()
    .from(teamInvitations)
    .where(and(eq(teamInvitations.organizationId, organization.id), eq(teamInvitations.status, "pending")));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your workspace, team, and billing.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization</CardTitle>
        </CardHeader>
        <CardContent>
          <OrgNameForm name={organization.name} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team</CardTitle>
          <CardDescription>Owners and members can access every job and candidate in this workspace.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-2.5">
                <div>
                  <p className="text-sm font-medium text-foreground">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.email}</p>
                </div>
                <Badge variant="outline" className="capitalize">
                  {m.role}
                </Badge>
              </div>
            ))}
            {pendingInvites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between rounded-lg border border-dashed border-border px-4 py-2.5">
                <p className="text-sm text-muted-foreground">{inv.email}</p>
                <Badge variant="outline">Invite pending</Badge>
              </div>
            ))}
          </div>

          {membership.role === "owner" && <InviteMemberForm />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing</CardTitle>
        </CardHeader>
        <CardContent>
          <Link href="/settings/billing" className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
            <CreditCard className="h-4 w-4" /> Manage plan &amp; usage
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
