import Link from "next/link";
import { notFound } from "next/navigation";
import { Users } from "lucide-react";
import { eq, and, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { jobs, interviewQuestions } from "@/lib/db/schema";
import { requireOrgContext } from "@/lib/org/context";
import { updateJobDetailsAction, addQuestionAction } from "@/lib/actions/jobs";
import { JobDetailsForm } from "@/components/jobs/job-details-form";
import { QuestionList } from "@/components/jobs/question-list";
import { AddQuestionForm } from "@/components/jobs/add-question-form";
import { PublishBar } from "@/components/jobs/publish-bar";

function toDatetimeLocal(date: Date | null) {
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default async function JobDetailPage({ params }: PageProps<"/jobs/[jobId]">) {
  const { jobId } = await params;
  const { organization } = await requireOrgContext();

  const [job] = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.organizationId, organization.id)))
    .limit(1);

  if (!job) notFound();

  const questions = await db
    .select()
    .from(interviewQuestions)
    .where(eq(interviewQuestions.jobId, jobId))
    .orderBy(asc(interviewQuestions.orderIndex));

  const updateAction = updateJobDetailsAction.bind(null, jobId);
  const addQuestion = addQuestionAction.bind(null, jobId);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-foreground">{job.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Configure the interview and publish when ready.</p>
        </div>
        <Link
          href={`/jobs/${job.id}/candidates`}
          className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <Users className="h-4 w-4" /> Candidates
        </Link>
      </div>

      <PublishBar jobId={job.id} status={job.status} />

      <section>
        <h2 className="mb-4 text-sm font-semibold text-foreground">Job details</h2>
        <JobDetailsForm
          action={updateAction}
          submitLabel="Save changes"
          defaults={{
            title: job.title,
            candidateInstructions: job.candidateInstructions ?? "",
            defaultPrepSeconds: job.defaultPrepSeconds,
            defaultResponseSeconds: job.defaultResponseSeconds,
            retakesAllowed: job.retakesAllowed,
            deadlineAt: toDatetimeLocal(job.deadlineAt),
          }}
        />
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold text-foreground">
          Interview questions <span className="text-muted-foreground">({questions.length})</span>
        </h2>
        <div className="space-y-4">
          <QuestionList jobId={job.id} questions={questions} />
          <AddQuestionForm action={addQuestion} />
        </div>
      </section>
    </div>
  );
}
