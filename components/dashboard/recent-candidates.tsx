import { Card, CardContent } from "@/components/ui/card";
import { CandidateRow } from "@/components/candidates/candidate-row";

type Row = {
  jobId: string;
  jobTitle: string;
  sessionId: string;
  candidateName: string;
  candidateEmail: string;
  status: string;
  decision: "none" | "shortlisted" | "maybe" | "rejected";
  invitedAt: Date;
};

export function RecentCandidates({ rows }: { rows: Row[] }) {
  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Invite candidates to a published job to see them here.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="divide-y divide-border py-0">
        {rows.map((row) => (
          <CandidateRow key={row.sessionId} row={row} />
        ))}
      </CardContent>
    </Card>
  );
}
