"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { RotateCcw, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requestUploadTicketAction, saveResponseAction } from "@/lib/actions/interview";
import { uploadToSignedUrl } from "@/lib/storage/client";

type Question = {
  id: string;
  prompt: string;
  prepSeconds: number | null;
  responseSeconds: number | null;
};

type Phase = "prep" | "recording" | "preview" | "uploading" | "error";

const PREFERRED_MIME_TYPES = ["video/webm;codecs=vp8,opus", "video/webm", "video/mp4"];

function pickMimeType() {
  for (const type of PREFERRED_MIME_TYPES) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) return type;
  }
  return "video/webm";
}

export function QuestionRecorder({
  token,
  question,
  questionNumber,
  totalQuestions,
  defaultPrepSeconds,
  defaultResponseSeconds,
  retakesAllowed,
  stream,
  onSubmitted,
}: {
  token: string;
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  defaultPrepSeconds: number;
  defaultResponseSeconds: number;
  retakesAllowed: number;
  stream: MediaStream;
  onSubmitted: () => void;
}) {
  const prepDuration = question.prepSeconds ?? defaultPrepSeconds;
  const responseDuration = question.responseSeconds ?? defaultResponseSeconds;

  const [phase, setPhase] = useState<Phase>(prepDuration > 0 ? "prep" : "recording");
  const [secondsLeft, setSecondsLeft] = useState(prepDuration > 0 ? prepDuration : responseDuration);
  const [retakesUsed, setRetakesUsed] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobRef = useRef<Blob | null>(null);
  const recordStartRef = useRef<number>(0);

  useEffect(() => {
    if (liveVideoRef.current && phase !== "preview") {
      liveVideoRef.current.srcObject = stream;
    }
  }, [stream, phase]);

  const startRecording = useCallback(() => {
    chunksRef.current = [];
    const mimeType = pickMimeType();
    const recorder = new MediaRecorder(stream, { mimeType });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      blobRef.current = blob;
      setPhase("preview");
    };
    recorder.start();
    recorderRef.current = recorder;
    recordStartRef.current = Date.now();
    setSecondsLeft(responseDuration);
    setPhase("recording");
  }, [stream, responseDuration]);

  // Countdown for prep and recording phases.
  useEffect(() => {
    if (phase !== "prep" && phase !== "recording") return;

    if (secondsLeft <= 0) {
      // Defer to a callback rather than calling setState synchronously in the effect body.
      const id = setTimeout(() => {
        if (phase === "prep") startRecording();
        else recorderRef.current?.stop();
      }, 0);
      return () => clearTimeout(id);
    }

    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, secondsLeft, startRecording]);

  useEffect(() => {
    if (phase === "preview" && previewVideoRef.current && blobRef.current) {
      previewVideoRef.current.src = URL.createObjectURL(blobRef.current);
    }
  }, [phase]);

  function handleRetake() {
    setRetakesUsed((n) => n + 1);
    blobRef.current = null;
    startRecording();
  }

  async function handleContinue() {
    if (!blobRef.current) return;
    setPhase("uploading");
    setErrorMessage(null);

    try {
      const durationSeconds = Math.max(1, Math.round((Date.now() - recordStartRef.current) / 1000));
      const blob = blobRef.current;
      const ticket = await requestUploadTicketAction(token, question.id, blob.type);
      await uploadToSignedUrl(ticket.bucket, ticket.path, ticket.token, blob);
      await saveResponseAction({
        token,
        questionId: question.id,
        storagePath: ticket.path,
        mimeType: blob.type,
        durationSeconds,
        sizeBytes: blob.size,
      });
      onSubmitted();
    } catch {
      setErrorMessage("We couldn't upload your response. Check your connection and try again.");
      setPhase("preview");
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <p className="text-center text-xs font-medium text-muted-foreground">
        Question {questionNumber} of {totalQuestions}
      </p>
      <h1 className="mt-2 text-center text-xl font-semibold text-foreground">{question.prompt}</h1>

      <div className="relative mt-6 aspect-video overflow-hidden rounded-xl border border-border bg-navy">
        {phase === "preview" ? (
          <video ref={previewVideoRef} controls playsInline className="h-full w-full object-cover" />
        ) : (
          <video ref={liveVideoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
        )}

        {phase === "prep" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-navy/70 text-white">
            <p className="text-sm">Get ready…</p>
            <p className="text-4xl font-bold">{secondsLeft}</p>
          </div>
        )}

        {phase === "recording" && (
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-destructive px-3 py-1 text-xs font-medium text-white">
            <span className="h-2 w-2 animate-pulse rounded-full bg-white" /> REC {secondsLeft}s
          </div>
        )}
      </div>

      {errorMessage && <p className="mt-3 text-center text-sm text-destructive">{errorMessage}</p>}

      <div className="mt-6 flex items-center justify-center gap-3">
        {phase === "recording" && (
          <Button variant="outline" onClick={() => recorderRef.current?.stop()}>
            Finish early
          </Button>
        )}

        {phase === "preview" && (
          <>
            {retakesUsed < retakesAllowed && (
              <Button variant="outline" onClick={handleRetake}>
                <RotateCcw className="h-4 w-4" /> Retake
              </Button>
            )}
            <Button onClick={handleContinue}>
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {phase === "uploading" && (
          <Button disabled>
            Uploading…
          </Button>
        )}
      </div>
    </div>
  );
}
