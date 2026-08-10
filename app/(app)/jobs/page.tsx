import Link from "next/link";
import type { Metadata } from "next";
import { eq, desc } from "drizzle-orm";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import { requireOrgContext } from "@/lib/org/context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Jobs" };

const statusVariant = {
  draft: "outline",
  published: "success",
  archived: "secondary",
} as const;

export default async function JobsPage() {
  const { organization } = await requireOrgContext();

  const orgJobs = await db
    .select()
    .from(jobs)
    .where(eq(jobs.organizationId, organization.id))
    .orderBy(desc(jobs.createdAt));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Jobs</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create and manage your interview jobs.</p>
        </div>
        <Button asChild>
          <Link href="/jobs/new">
            <Plus className="h-4 w-4" /> New Job
          </Link>
        </Button>
      </div>

      {orgJobs.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-sm text-muted-foreground">You haven&apos;t created a job yet.</p>
            <Button asChild>
              <Link href="/jobs/new">
                <Plus className="h-4 w-4" /> Create your first job
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-8 grid gap-4">
          {orgJobs.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`}>
              <Card className="transition-colors hover:border-primary/40">
                <CardContent className="flex items-center justify-between gap-4 py-5">
                  <div className="min-w-0">
                    <h2 className="truncate font-medium text-foreground">{job.title}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Created {new Date(job.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={statusVariant[job.status]} className="shrink-0 capitalize">
                    {job.status}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
