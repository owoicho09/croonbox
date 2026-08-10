import type { Metadata } from "next";
import { createJobAction } from "@/lib/actions/jobs";
import { JobDetailsForm } from "@/components/jobs/job-details-form";

export const metadata: Metadata = { title: "New Job" };

export default function NewJobPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-foreground">Create a job</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        You&apos;ll add interview questions and publish on the next step.
      </p>
      <div className="mt-8">
        <JobDetailsForm
          action={createJobAction}
          submitLabel="Continue to questions"
          defaults={{
            title: "",
            candidateInstructions: "",
            defaultPrepSeconds: 60,
            defaultResponseSeconds: 120,
            retakesAllowed: 1,
            deadlineAt: "",
          }}
        />
      </div>
    </div>
  );
}
