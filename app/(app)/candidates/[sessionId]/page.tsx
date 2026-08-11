import { notFound } from "next/navigation";
import { Clock, Target, UserCircle } from "lucide-react";
import { requireOrgContext } from "@/lib/org/context";
import { getCandidateReviewDetail } from "@/lib/candidates/detail";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DecisionButtons } from "@/components/review/decision-buttons";
import { NoteForm } from "@/components/review/note-form";
import { SyncTranscriptButton } from "@/components/review/sync-transcript-button";

const statusLabel: Record<string, string> = {
  not_started: "Invited",
  in_progress: "Interview in progress",
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

function InsightList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">Nothing noted.</p>;
  return (
    <div>
      <p className="text-xs font-semibold text-foreground">{title}</p>
      <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-muted-foreground">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default async function CandidateReviewPage({ params }: PageProps<"/candidates/[sessionId]">) {
  const { sessionId } = await params;
  const { organization } = await requireOrgContext();

  const detail = await getCandidateReviewDetail(sessionId, organization.id);
  if (!detail) notFound();

  const { job, candidate, session, config, recordingUrl, transcript, report, notes } = detail;
  const isReady = session.status === "ready_for_review" || session.status === "reviewed";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold text-foreground">{candidate.name}</h1>
          <p className="text-sm text-muted-foreground">
            {candidate.email} · {job.title}
          </p>
        </div>
        <Badge variant={statusVariant[session.status]} className="shrink-0">
          {statusLabel[session.status]}
        </Badge>
      </div>

      <DecisionButtons sessionId={session.id} decision={session.decision} />

      {session.status === "failed" && session.failureReason && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-destructive">
          Interview failed: {session.failureReason}
        </p>
      )}
      {(session.status === "not_started" || session.status === "in_progress") && (
        <p className="rounded-lg bg-secondary px-4 py-3 text-sm text-muted-foreground">
          This candidate hasn&apos;t finished their interview yet.
        </p>
      )}
      {session.status === "processing" && (
        <p className="rounded-lg bg-secondary px-4 py-3 text-sm text-muted-foreground">
          {transcript
            ? "The interview is complete — generating the AI report now. Check back shortly."
            : "The interview is complete and waiting on the transcript. If this doesn't update on its own, use “Check for transcript” on the Transcript tab."}
        </p>
      )}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recording">Recording</TabsTrigger>
          <TabsTrigger value="transcript">Transcript</TabsTrigger>
          <TabsTrigger value="report">AI Report</TabsTrigger>
          <TabsTrigger value="notes">Notes &amp; Decision</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-4">
            <Card>
              <CardContent className="grid gap-4 py-6 sm:grid-cols-3">
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> Started
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    {session.startedAt ? new Date(session.startedAt).toLocaleString() : "Not yet"}
                  </p>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> Completed
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    {session.completedAt ? new Date(session.completedAt).toLocaleString() : "Not yet"}
                  </p>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <UserCircle className="h-3.5 w-3.5" /> Interviewer role
                  </p>
                  <p className="mt-1 text-sm text-foreground">{config?.interviewerRole ?? "—"}</p>
                </div>
              </CardContent>
            </Card>

            {config && config.focusAreas.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Target className="h-4 w-4 text-primary" /> Focus areas
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-1.5">
                  {config.focusAreas.map((area) => (
                    <Badge key={area} variant="outline">
                      {area}
                    </Badge>
                  ))}
                </CardContent>
              </Card>
            )}

            {report && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground">{report.summary}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="recording">
          {recordingUrl ? (
            <video src={recordingUrl} controls playsInline className="w-full rounded-xl border border-border" />
          ) : (
            <p className="text-sm text-muted-foreground">
              {isReady ? "No recording was captured for this interview." : "The recording will appear here once the interview is complete."}
            </p>
          )}
        </TabsContent>

        <TabsContent value="transcript">
          {transcript ? (
            <div className="max-h-[32rem] space-y-3 overflow-y-auto rounded-xl border border-border p-4">
              {(transcript.turns ?? []).map((turn, i) => (
                <div key={i} className={turn.role === "agent" ? "text-left" : "text-right"}>
                  <span
                    className={`inline-block max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                      turn.role === "agent" ? "bg-secondary text-foreground" : "bg-primary-subtle text-primary"
                    }`}
                  >
                    {turn.text}
                  </span>
                </div>
              ))}
              {(transcript.turns ?? []).length === 0 && (
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{transcript.text}</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Transcript not available yet.</p>
              {session.elevenLabsConversationId && <SyncTranscriptButton sessionId={session.id} />}
            </div>
          )}
        </TabsContent>

        <TabsContent value="report">
          {report ? (
            <Card>
              <CardContent className="space-y-4 py-6">
                <p className="text-sm text-foreground">{report.summary}</p>
                <InsightList title="Relevant experience" items={report.relevantExperience} />
                <InsightList title="Strong signals" items={report.strongSignals} />
                <InsightList title="Areas to review" items={report.areasToReview} />
                <InsightList title="Suggested follow-up questions" items={report.suggestedFollowUps} />
              </CardContent>
            </Card>
          ) : (
            <p className="text-sm text-muted-foreground">The AI report isn&apos;t ready yet.</p>
          )}
        </TabsContent>

        <TabsContent value="notes">
          <div className="space-y-3">
            {notes.map((n) => (
              <div key={n.note.id} className="rounded-lg border border-border px-4 py-3">
                <p className="text-sm text-foreground">{n.note.note}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {n.authorName} · {new Date(n.note.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
            <NoteForm sessionId={session.id} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
