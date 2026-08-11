import type { Metadata } from "next";
import { eq, desc } from "drizzle-orm";
import { AlertTriangle } from "lucide-react";
import { db } from "@/lib/db";
import {
  interviewSessions,
  candidateInvitations,
  candidates,
  jobs,
  organizations,
  recordings,
  transcripts,
  aiReports,
} from "@/lib/db/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Admin · Interviews" };

const statusVariant: Record<string, "outline" | "default" | "success" | "warning" | "secondary" | "destructive"> = {
  not_started: "outline",
  in_progress: "default",
  completed: "secondary",
  processing: "warning",
  ready_for_review: "success",
  reviewed: "secondary",
  failed: "destructive",
};

// Sessions past this stage should have a recording/transcript/report — flag it if missing.
const PAST_COMPLETION = ["completed", "processing", "ready_for_review", "reviewed"];
const PAST_PROCESSING = ["processing", "ready_for_review", "reviewed"];

export default async function AdminInterviewsPage() {
  const rows = await db
    .select({
      session: interviewSessions,
      candidateName: candidates.name,
      jobTitle: jobs.title,
      organizationName: organizations.name,
      hasRecording: recordings.id,
      hasTranscript: transcripts.id,
      hasReport: aiReports.id,
    })
    .from(interviewSessions)
    .innerJoin(candidateInvitations, eq(candidateInvitations.id, interviewSessions.invitationId))
    .innerJoin(candidates, eq(candidates.id, candidateInvitations.candidateId))
    .innerJoin(jobs, eq(jobs.id, candidateInvitations.jobId))
    .innerJoin(organizations, eq(organizations.id, jobs.organizationId))
    .leftJoin(recordings, eq(recordings.sessionId, interviewSessions.id))
    .leftJoin(transcripts, eq(transcripts.sessionId, interviewSessions.id))
    .leftJoin(aiReports, eq(aiReports.sessionId, interviewSessions.id))
    .orderBy(desc(interviewSessions.updatedAt))
    .limit(200);

  const failedCount = rows.filter((r) => r.session.status === "failed").length;
  const missingDataCount = rows.filter(
    (r) =>
      (PAST_COMPLETION.includes(r.session.status) && !r.hasRecording) ||
      (PAST_PROCESSING.includes(r.session.status) && !r.hasTranscript) ||
      (r.session.status === "reviewed" && !r.hasReport),
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-foreground">Interviews ({rows.length})</h1>
        <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span>{failedCount} failed</span>
          <span className="hidden sm:inline">·</span>
          <span>{missingDataCount} missing recording/transcript/report</span>
        </div>
      </div>

      <Card>
        <CardContent className="divide-y divide-border py-0">
          {rows.map((row) => {
            const missingRecording = PAST_COMPLETION.includes(row.session.status) && !row.hasRecording;
            const missingTranscript = PAST_PROCESSING.includes(row.session.status) && !row.hasTranscript;
            const missingReport = row.session.status === "reviewed" && !row.hasReport;
            const hasIssue = row.session.status === "failed" || missingRecording || missingTranscript || missingReport;

            return (
              <div key={row.session.id} className="flex flex-col gap-1.5 py-4 text-sm sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {row.candidateName} · {row.jobTitle}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {row.organizationName} · updated {new Date(row.session.updatedAt).toLocaleString()}
                  </p>
                  {row.session.status === "failed" && row.session.failureReason && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
                      <AlertTriangle className="h-3.5 w-3.5" /> {row.session.failureReason}
                    </p>
                  )}
                  {missingRecording && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
                      <AlertTriangle className="h-3.5 w-3.5" /> Recording missing
                    </p>
                  )}
                  {missingTranscript && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
                      <AlertTriangle className="h-3.5 w-3.5" /> Transcript missing
                    </p>
                  )}
                  {missingReport && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
                      <AlertTriangle className="h-3.5 w-3.5" /> AI report missing
                    </p>
                  )}
                </div>
                <Badge variant={hasIssue ? "destructive" : statusVariant[row.session.status]} className="shrink-0 capitalize">
                  {row.session.status.replace(/_/g, " ")}
                </Badge>
              </div>
            );
          })}
          {rows.length === 0 && <p className="py-6 text-sm text-muted-foreground">No interview sessions yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
