"use client";

import { useState } from "react";
import { IntroScreen } from "@/components/candidate/intro-screen";
import { DeviceCheck } from "@/components/candidate/device-check";
import { LiveInterview } from "@/components/candidate/live-interview";
import { CompleteScreen } from "@/components/candidate/complete-screen";

type Phase = "intro" | "device-check" | "live" | "complete";

export function InterviewFlow({
  token,
  jobTitle,
  companyName,
  candidateInstructions,
  questionCount,
  alreadyFinished,
}: {
  token: string;
  jobTitle: string;
  companyName: string;
  candidateInstructions: string | null;
  questionCount: number;
  alreadyFinished: boolean;
}) {
  const [phase, setPhase] = useState<Phase>(alreadyFinished ? "complete" : "intro");
  const [stream, setStream] = useState<MediaStream | null>(null);

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
      {phase === "intro" && (
        <IntroScreen
          jobTitle={jobTitle}
          companyName={companyName}
          candidateInstructions={candidateInstructions}
          questionCount={questionCount}
          onContinue={() => setPhase("device-check")}
        />
      )}

      {phase === "device-check" && (
        <DeviceCheck
          onReady={(s) => {
            setStream(s);
            setPhase("live");
          }}
        />
      )}

      {phase === "live" && stream && (
        <LiveInterview
          token={token}
          stream={stream}
          jobTitle={jobTitle}
          companyName={companyName}
          onComplete={() => setPhase("complete")}
        />
      )}

      {phase === "complete" && <CompleteScreen companyName={companyName} />}
    </div>
  );
}
