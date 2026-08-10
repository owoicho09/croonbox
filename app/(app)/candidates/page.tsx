import type { Metadata } from "next";
import { requireOrgContext } from "@/lib/org/context";
import { listOrganizationCandidates } from "@/lib/candidates/list";
import { CandidateFilterBar } from "@/components/candidates/filter-bar";
import { CandidateRow } from "@/components/candidates/candidate-row";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Candidates" };

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; reviewQueue?: string }>;
}) {
  const { organization } = await requireOrgContext();
  const params = await searchParams;

  const search = params.q?.trim() ?? "";
  const status = params.status ?? "";
  const reviewQueue = params.reviewQueue === "1";

  const rows = await listOrganizationCandidates(organization.id, { search, status, reviewQueue });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Candidates</h1>
        <p className="mt-1 text-sm text-muted-foreground">Every candidate invited across your jobs.</p>
      </div>

      <CandidateFilterBar search={search} status={status} reviewQueue={reviewQueue} />

      <Card>
        <CardContent className="divide-y divide-border py-0">
          {rows.map((row) => (
            <CandidateRow key={row.sessionId} row={row} />
          ))}
          {rows.length === 0 && (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {search || status || reviewQueue
                ? "No candidates match these filters."
                : "Invite candidates to a published job to see them here."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
