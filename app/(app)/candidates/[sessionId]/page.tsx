import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireOrgContext } from "@/lib/org/context";
import { getCandidateReviewDetail } from "@/lib/candidates/detail";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DecisionButtons } from "@/components/review/decision-buttons";
import { NoteForm } from "@/components/review/note-form";

const statusLabel: Record<string, string> = {
  not_started: "Invited",
  in_progress: "Started",
  completed: "Completed",
  processing: "Processing",
  ready_for_review: "Ready for Review",
  reviewed: "Reviewed",
};

function InsightList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
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

  const { job, candidate, session, questions, responseByQuestion, playbackUrls, overallInsight, notes } = detail;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Link
        href={`/jobs/${job.id}/candidates`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> {job.title}
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{candidate.name}</h1>
          <p className="text-sm text-muted-foreground">
            {candidate.email} · {job.title}
          </p>
        </div>
        <Badge variant="outline">{statusLabel[session.status]}</Badge>
      </div>

      <DecisionButtons sessionId={session.id} decision={session.decision} />

      {session.status !== "ready_for_review" && session.status !== "reviewed" && (
        <p className="rounded-lg bg-secondary px-4 py-3 text-sm text-muted-foreground">
          {session.status === "processing"
            ? "This interview is still being transcribed and analyzed. Check back shortly."
            : "This candidate hasn't finished their interview yet."}
        </p>
      )}

      {overallInsight && (
        <Card>
          <CardHeader>
            <CardTitle>Interview Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-foreground">{overallInsight.overallSummary}</p>
            <InsightList title="Relevant experience" items={overallInsight.relevantExperience} />
            <InsightList title="Areas to explore" items={overallInsight.areasToExplore} />
            <InsightList title="Suggested follow-up questions" items={overallInsight.suggestedFollowUps} />
          </CardContent>
        </Card>
      )}

      <section className="space-y-6">
        <h2 className="text-sm font-semibold text-foreground">Responses</h2>
        {questions.map((q, i) => {
          const r = responseByQuestion.get(q.id);
          const videoUrl = r ? playbackUrls.get(r.response.id) : undefined;

          return (
            <Card key={q.id}>
              <CardHeader>
                <CardTitle className="text-base">
                  Q{i + 1}. {q.prompt}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!r && <p className="text-sm text-muted-foreground">Not answered.</p>}

                {r && videoUrl && (
                  <video src={videoUrl} controls playsInline className="w-full max-w-md rounded-lg border border-border" />
                )}

                {r?.transcriptText && (
                  <div>
                    <p className="text-xs font-semibold text-foreground">Transcript</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{r.transcriptText}</p>
                  </div>
                )}

                {r?.insight && (
                  <div className="space-y-3 rounded-lg bg-primary-subtle/40 p-4">
                    <p className="text-sm text-foreground">{r.insight.summary}</p>
                    <InsightList title="Evidence" items={r.insight.evidence} />
                    <InsightList title="Strong signals" items={r.insight.strongSignals} />
                    <InsightList title="Areas to review" items={r.insight.areasToReview} />
                  </div>
                )}

                {r && !r.transcriptText && r.response.status !== "transcription_failed" && (
                  <p className="text-xs text-muted-foreground">Transcribing…</p>
                )}
                {r?.response.status === "transcription_failed" && (
                  <p className="text-xs text-destructive">Transcription failed for this response.</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Internal notes</h2>
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
      </section>
    </div>
  );
}
