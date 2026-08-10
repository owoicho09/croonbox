import type { Metadata } from "next";
import { desc, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { processingJobs } from "@/lib/db/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Admin · Processing" };

const statusVariant = {
  pending: "outline",
  processing: "default",
  completed: "success",
  failed: "destructive",
} as const;

export default async function AdminProcessingPage() {
  const rows = await db
    .select()
    .from(processingJobs)
    .where(ne(processingJobs.status, "completed"))
    .orderBy(desc(processingJobs.updatedAt))
    .limit(100);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Processing Jobs</h1>
      <p className="text-sm text-muted-foreground">Pending, in-progress, and failed jobs (completed jobs are hidden).</p>

      <Card>
        <CardContent className="divide-y divide-border py-0">
          {rows.map((job) => (
            <div key={job.id} className="flex items-start justify-between gap-4 py-4 text-sm">
              <div className="min-w-0">
                <p className="font-medium text-foreground">{job.type}</p>
                <p className="text-xs text-muted-foreground">
                  Attempts {job.attempts}/{job.maxAttempts} · updated {new Date(job.updatedAt).toLocaleString()}
                </p>
                {job.lastError && <p className="mt-1 break-words text-xs text-destructive">{job.lastError}</p>}
              </div>
              <Badge variant={statusVariant[job.status]} className="shrink-0">
                {job.status}
              </Badge>
            </div>
          ))}
          {rows.length === 0 && <p className="py-6 text-sm text-muted-foreground">No pending or failed jobs.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
