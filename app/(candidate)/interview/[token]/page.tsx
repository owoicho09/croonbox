import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";
import { loadInterviewByToken } from "@/lib/candidates/session";
import { InterviewFlow } from "@/components/candidate/interview-flow";

export const metadata: Metadata = { title: "Your Interview" };

function InvalidLink({ message }: { message: string }) {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="mx-auto max-w-sm text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-destructive">
          <AlertTriangle className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-lg font-semibold text-foreground">{message}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          If you think this is a mistake, reach out to the team that invited you.
        </p>
      </div>
    </div>
  );
}

// "failed" is deliberately excluded — a candidate whose call dropped can restart from the link.
const FINISHED_STATUSES = new Set(["completed", "processing", "ready_for_review", "reviewed"]);

export default async function CandidateInterviewPage({ params }: PageProps<"/interview/[token]">) {
  const { token } = await params;
  const result = await loadInterviewByToken(token);

  if (result.status === "not_found") return <InvalidLink message="This interview link isn't valid." />;
  if (result.status === "revoked") return <InvalidLink message="This interview link has been revoked." />;
  if (result.status === "expired") return <InvalidLink message="This interview link has expired." />;

  const { job, session, organizationName, questionCount } = result;

  return (
    <InterviewFlow
      token={token}
      jobTitle={job.title}
      companyName={organizationName}
      candidateInstructions={job.candidateInstructions}
      questionCount={questionCount}
      alreadyFinished={FINISHED_STATUSES.has(session.status)}
    />
  );
}
