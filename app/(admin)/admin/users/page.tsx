import type { Metadata } from "next";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, memberships, organizations } from "@/lib/db/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Admin · Users" };

export default async function AdminUsersPage() {
  const rows = await db
    .select({ user: users, organizationName: organizations.name, role: memberships.role })
    .from(users)
    .leftJoin(memberships, eq(memberships.userId, users.id))
    .leftJoin(organizations, eq(organizations.id, memberships.organizationId))
    .orderBy(desc(users.createdAt))
    .limit(200);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Users ({rows.length})</h1>

      <Card>
        <CardContent className="divide-y divide-border py-0">
          {rows.map((row) => (
            <div key={row.user.id} className="flex flex-col gap-1 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">
                  {row.user.name} {row.user.isPlatformAdmin && <Badge variant="warning">Platform Admin</Badge>}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {row.user.email} · {row.organizationName ?? "No workspace"} {row.role ? `· ${row.role}` : ""}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                Joined {new Date(row.user.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}
          {rows.length === 0 && <p className="py-6 text-sm text-muted-foreground">No users yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
