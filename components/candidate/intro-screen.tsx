"use client";

import { useState, useTransition } from "react";
import { Clock, ListChecks, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startInterviewAction } from "@/lib/actions/interview";

export function IntroScreen({
  token,
  jobTitle,
  companyName,
  candidateInstructions,
  questionCount,
  onContinue,
}: {
  token: string;
  jobTitle: string;
  companyName: string;
  candidateInstructions: string | null;
  questionCount: number;
  onContinue: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleStart() {
    startTransition(async () => {
      try {
        await startInterviewAction(token);
        onContinue();
      } catch {
        setError("Something went wrong starting your interview. Please refresh and try again.");
      }
    });
  }

  return (
    <div className="mx-auto max-w-md text-center">
      <p className="text-sm font-medium text-primary">{companyName}</p>
      <h1 className="mt-2 text-2xl font-semibold text-foreground">{jobTitle}</h1>

      {candidateInstructions && <p className="mt-4 text-sm text-muted-foreground">{candidateInstructions}</p>}

      <div className="mt-8 space-y-4 text-left">
        <div className="flex items-start gap-3">
          <ListChecks className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm text-foreground">
            {questionCount} question{questionCount === 1 ? "" : "s"} — answer each with a short video.
          </p>
        </div>
        <div className="flex items-start gap-3">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm text-foreground">You&apos;ll get prep time before each question, then record your answer.</p>
        </div>
        <div className="flex items-start gap-3">
          <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm text-foreground">Works great on your phone. Find somewhere quiet with good lighting.</p>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <Button size="lg" className="mt-8 w-full" onClick={handleStart} disabled={isPending}>
        {isPending ? "Loading…" : "Get Started"}
      </Button>
    </div>
  );
}
