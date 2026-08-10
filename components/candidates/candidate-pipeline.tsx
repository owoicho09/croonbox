import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type Row = {
  sessionId: string;
  candidateName: string;
  candidateEmail: string;
  status: string;
  decision: string;
  invitedAt: Date;
};

const statusLabel: Record<string, string> = {
  not_started: "Invited",
  in_progress: "Started",
  completed: "Completed",
  processing: "Processing",
  ready_for_review: "Ready for Review",
  reviewed: "Reviewed",
};

const statusVariant: Record<string, "outline" | "default" | "success" | "warning" | "secondary"> = {
  not_started: "outline",
  in_progress: "default",
  completed: "secondary",
  processing: "warning",
  ready_for_review: "success",
  reviewed: "secondary",
};

const decisionVariant: Record<string, "outline" | "success" | "warning" | "destructive"> = {
  none: "outline",
  shortlisted: "success",
  maybe: "warning",
  rejected: "destructive",
};

export function CandidatePipeline({ rows }: { rows: Row[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No candidates invited yet.</p>;
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <Link key={row.sessionId} href={`/candidates/${row.sessionId}`}>
          <Card className="transition-colors hover:border-primary/40">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{row.candidateName}</p>
                <p className="truncate text-xs text-muted-foreground">{row.candidateEmail}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {row.decision !== "none" && (
                  <Badge variant={decisionVariant[row.decision]} className="capitalize">
                    {row.decision}
                  </Badge>
                )}
                <Badge variant={statusVariant[row.status]}>{statusLabel[row.status]}</Badge>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
