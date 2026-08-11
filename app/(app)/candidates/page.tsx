import type { Metadata } from "next";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import { requireOrgContext } from "@/lib/org/context";
import { listOrganizationCandidates } from "@/lib/candidates/list";
import { CandidateFilterBar } from "@/components/candidates/filter-bar";
import { CandidateRow } from "@/components/candidates/candidate-row";
import { InviteCandidateDialog } from "@/components/candidates/invite-candidate-dialog";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Candidates" };

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; decision?: string; reviewQueue?: string }>;
}) {
  const { organization } = await requireOrgContext();
  const params = await searchParams;

  const search = params.q?.trim() ?? "";
  const status = params.status ?? "";
  const decision = params.decision ?? "";
  const reviewQueue = params.reviewQueue === "1";

  const [rows, orgJobs] = await Promise.all([
    listOrganizationCandidates(organization.id, { search, status, decision, reviewQueue }),
    db
      .select({ id: jobs.id, title: jobs.title, status: jobs.status })
      .from(jobs)
      .where(eq(jobs.organizationId, organization.id))
      .orderBy(desc(jobs.createdAt)),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Candidates</h1>
          <p className="mt-1 text-sm text-muted-foreground">Every candidate invited across your jobs.</p>
        </div>
        <InviteCandidateDialog jobs={orgJobs} />
      </div>

      <CandidateFilterBar search={search} status={status} decision={decision} reviewQueue={reviewQueue} />

      <Card>
        <CardContent className="divide-y divide-border py-0">
          {rows.map((row) => (
            <CandidateRow key={row.sessionId} row={row} />
          ))}
          {rows.length === 0 && (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {search || status || decision || reviewQueue
                ? "No candidates match these filters."
                : "Invite candidates to a published job to see them here."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
