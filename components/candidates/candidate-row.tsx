import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { QuickDecision } from "@/components/review/quick-decision";

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

const statusLabel: Record<string, string> = {
  not_started: "Invited",
  in_progress: "In progress",
  completed: "Completed",
  processing: "Processing",
  ready_for_review: "Ready for Review",
  reviewed: "Reviewed",
  failed: "Failed",
};

const statusVariant: Record<string, "outline" | "default" | "success" | "warning" | "secondary" | "destructive"> = {
  not_started: "outline",
  in_progress: "default",
  completed: "secondary",
  processing: "warning",
  ready_for_review: "success",
  reviewed: "secondary",
  failed: "destructive",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function CandidateRow({ row }: { row: Row }) {
  return (
    <Link
      href={`/candidates/${row.sessionId}`}
      className="flex items-center gap-4 px-4 py-3.5 text-sm transition-colors hover:bg-secondary/50"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-xs font-semibold text-primary">
        {initials(row.candidateName)}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">{row.candidateName}</p>
        <p className="truncate text-xs text-muted-foreground">
          {row.candidateEmail} · {row.jobTitle}
        </p>
      </div>

      <QuickDecision sessionId={row.sessionId} decision={row.decision} />

      <Badge variant={statusVariant[row.status]} className="hidden shrink-0 sm:inline-flex">
        {statusLabel[row.status]}
      </Badge>

      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
