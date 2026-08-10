"use client";

import { useMemo, useState } from "react";
import { IntroScreen } from "@/components/candidate/intro-screen";
import { DeviceCheck } from "@/components/candidate/device-check";
import { QuestionRecorder } from "@/components/candidate/question-recorder";
import { CompleteScreen } from "@/components/candidate/complete-screen";
import { completeInterviewAction } from "@/lib/actions/interview";

type Question = {
  id: string;
  prompt: string;
  prepSeconds: number | null;
  responseSeconds: number | null;
};

type Phase = "intro" | "device-check" | "question" | "submitting" | "complete";

export function InterviewFlow({
  token,
  jobTitle,
  companyName,
  candidateInstructions,
  defaultPrepSeconds,
  defaultResponseSeconds,
  retakesAllowed,
  questions,
  answeredQuestionIds,
  alreadyFinished,
}: {
  token: string;
  jobTitle: string;
  companyName: string;
  candidateInstructions: string | null;
  defaultPrepSeconds: number;
  defaultResponseSeconds: number;
  retakesAllowed: number;
  questions: Question[];
  answeredQuestionIds: string[];
  alreadyFinished: boolean;
}) {
  const firstUnansweredIndex = useMemo(() => {
    const answered = new Set(answeredQuestionIds);
    const idx = questions.findIndex((q) => !answered.has(q.id));
    return idx === -1 ? questions.length : idx;
  }, [questions, answeredQuestionIds]);

  const [phase, setPhase] = useState<Phase>(alreadyFinished ? "complete" : "intro");
  const [questionIndex, setQuestionIndex] = useState(firstUnansweredIndex);
  const [stream, setStream] = useState<MediaStream | null>(null);

  async function handleQuestionSubmitted() {
    const nextIndex = questionIndex + 1;
    if (nextIndex >= questions.length) {
      setPhase("submitting");
      try {
        await completeInterviewAction(token);
      } finally {
        setPhase("complete");
      }
      return;
    }
    setQuestionIndex(nextIndex);
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-12">
      {phase === "intro" && (
        <IntroScreen
          token={token}
          jobTitle={jobTitle}
          companyName={companyName}
          candidateInstructions={candidateInstructions}
          questionCount={questions.length}
          onContinue={() => setPhase("device-check")}
        />
      )}

      {phase === "device-check" && (
        <DeviceCheck
          onReady={(s) => {
            setStream(s);
            setPhase("question");
          }}
        />
      )}

      {phase === "question" && stream && questions[questionIndex] && (
        <QuestionRecorder
          key={questions[questionIndex].id}
          token={token}
          question={questions[questionIndex]}
          questionNumber={questionIndex + 1}
          totalQuestions={questions.length}
          defaultPrepSeconds={defaultPrepSeconds}
          defaultResponseSeconds={defaultResponseSeconds}
          retakesAllowed={retakesAllowed}
          stream={stream}
          onSubmitted={handleQuestionSubmitted}
        />
      )}

      {phase === "submitting" && <p className="text-sm text-muted-foreground">Submitting your interview…</p>}

      {phase === "complete" && <CompleteScreen companyName={companyName} />}
    </div>
  );
}
