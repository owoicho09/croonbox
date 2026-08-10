import "server-only";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { memberships, organizations, subscriptions } from "@/lib/db/schema";
import { requireUser } from "@/lib/actions/auth";

export async function requireOrgContext() {
  const user = await requireUser();

  const [row] = await db
    .select({ membership: memberships, organization: organizations, subscription: subscriptions })
    .from(memberships)
    .innerJoin(organizations, eq(memberships.organizationId, organizations.id))
    .leftJoin(subscriptions, eq(subscriptions.organizationId, organizations.id))
    .where(eq(memberships.userId, user.id))
    .limit(1);

  if (!row) redirect("/onboarding");

  return {
    user,
    organization: row.organization,
    membership: row.membership,
    subscription: row.subscription,
  };
}
