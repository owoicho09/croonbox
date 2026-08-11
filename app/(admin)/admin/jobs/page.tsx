import type { Metadata } from "next";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { jobs, organizations } from "@/lib/db/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Admin · Jobs" };

const statusVariant = {
  draft: "outline",
  published: "success",
  closed: "secondary",
  archived: "secondary",
} as const;

export default async function AdminJobsPage() {
  const rows = await db
    .select({ job: jobs, organizationName: organizations.name })
    .from(jobs)
    .innerJoin(organizations, eq(organizations.id, jobs.organizationId))
    .orderBy(desc(jobs.createdAt))
    .limit(200);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Jobs ({rows.length})</h1>

      <Card>
        <CardContent className="divide-y divide-border py-0">
          {rows.map((row) => (
            <div key={row.job.id} className="flex flex-col gap-1 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{row.job.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {row.organizationName} · created {new Date(row.job.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Badge variant={statusVariant[row.job.status]} className="shrink-0 capitalize">
                {row.job.status}
              </Badge>
            </div>
          ))}
          {rows.length === 0 && <p className="py-6 text-sm text-muted-foreground">No jobs yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
