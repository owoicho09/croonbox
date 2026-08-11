"use client";

import { Mic, MessageCircle, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

export function IntroScreen({
  jobTitle,
  companyName,
  candidateInstructions,
  questionCount,
  onContinue,
}: {
  jobTitle: string;
  companyName: string;
  candidateInstructions: string | null;
  questionCount: number;
  onContinue: () => void;
}) {
  return (
    <div className="mx-auto max-w-md text-center">
      <p className="text-sm font-medium text-primary">{companyName}</p>
      <h1 className="mt-2 text-2xl font-semibold text-foreground">{jobTitle}</h1>

      {candidateInstructions && <p className="mt-4 text-sm text-muted-foreground">{candidateInstructions}</p>}

      <div className="mt-8 space-y-4 text-left">
        <div className="flex items-start gap-3">
          <Mic className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm text-foreground">
            You&apos;ll have a short live voice conversation with our AI interviewer — about
            {questionCount > 0 ? ` ${questionCount} focused question${questionCount === 1 ? "" : "s"}` : " a few focused questions"}.
          </p>
        </div>
        <div className="flex items-start gap-3">
          <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm text-foreground">Just talk naturally, like a real conversation. It&apos;ll ask follow-ups if it needs more detail.</p>
        </div>
        <div className="flex items-start gap-3">
          <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm text-foreground">Works great on your phone. Find somewhere quiet with good signal.</p>
        </div>
      </div>

      <Button size="lg" className="mt-8 w-full" onClick={onContinue}>
        Get Started
      </Button>
    </div>
  );
}
