"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Conversation } from "@elevenlabs/client";
import { PhoneOff, Mic, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  startLiveInterviewAction,
  requestRecordingUploadTicketAction,
  completeInterviewAction,
  failInterviewAction,
} from "@/lib/actions/interview";
import { uploadToSignedUrl } from "@/lib/storage/client";

type Phase = "connecting" | "active" | "wrapping-up" | "error";

const PREFERRED_MIME_TYPES = ["video/webm;codecs=vp8,opus", "video/webm", "video/mp4"];

function pickMimeType() {
  for (const type of PREFERRED_MIME_TYPES) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) return type;
  }
  return "video/webm";
}

function formatElapsed(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function LiveInterview({
  token,
  stream,
  jobTitle,
  companyName,
  onComplete,
}: {
  token: string;
  stream: MediaStream;
  jobTitle: string;
  companyName: string;
  onComplete: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("connecting");
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [captions, setCaptions] = useState<{ role: "agent" | "candidate"; text: string }[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordStartRef = useRef(0);
  const conversationRef = useRef<Conversation | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  const mixNodesRef = useRef<{
    micSource: MediaStreamAudioSourceNode;
    mixDestination: MediaStreamAudioDestinationNode;
  } | null>(null);

  const cleanupMixNodes = useCallback(() => {
    if (mixNodesRef.current) {
      mixNodesRef.current.micSource.disconnect();
      mixNodesRef.current.mixDestination.disconnect();
      mixNodesRef.current = null;
    }
  }, []);

  const finishRecording = useCallback((): Promise<Blob> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        cleanupMixNodes();
        resolve(new Blob(chunksRef.current, { type: pickMimeType() }));
        return;
      }
      recorder.onstop = () => {
        cleanupMixNodes();
        resolve(new Blob(chunksRef.current, { type: recorder.mimeType }));
      };
      recorder.stop();
    });
  }, [cleanupMixNodes]);

  const handleNaturalEnd = useCallback(async () => {
    setPhase("wrapping-up");
    try {
      const blob = await finishRecording();
      const durationSeconds = Math.max(1, Math.round((Date.now() - recordStartRef.current) / 1000));

      let uploadInfo: { path: string; token: string; bucket: string } | undefined;
      try {
        uploadInfo = await requestRecordingUploadTicketAction(token, blob.type);
        await uploadToSignedUrl(uploadInfo.bucket, uploadInfo.path, uploadInfo.token, blob);
      } catch {
        uploadInfo = undefined;
      }

      await completeInterviewAction({
        token,
        conversationId: conversationIdRef.current ?? "unknown",
        storagePath: uploadInfo?.path,
        mimeType: blob.type,
        durationSeconds,
        sizeBytes: blob.size,
      });
      onComplete();
    } catch {
      onComplete();
    }
  }, [finishRecording, onComplete, token]);

  const handleFailure = useCallback(
    async (reason: string) => {
      setPhase("error");
      setErrorMessage(reason);
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
      cleanupMixNodes();
      await failInterviewAction(token, reason).catch(() => {});
    },
    [token, cleanupMixNodes],
  );

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;

    let cancelled = false;

    async function connect() {
      try {
        const { signedUrl, dynamicVariables } = await startLiveInterviewAction(token);
        if (cancelled) return;

        const conversation = await Conversation.startSession({
          signedUrl,
          dynamicVariables,
          onConnect: ({ conversationId }) => {
            conversationIdRef.current = conversationId;
            if (!cancelled) setPhase("active");
          },
          onDisconnect: (details) => {
            if (cancelled) return;
            if (details.reason === "error") {
              handleFailure(details.message || "The call disconnected unexpectedly.");
            } else {
              // "agent" = the interviewer wrapped up naturally; "user" = we called endSession() ourselves.
              handleNaturalEnd();
            }
          },
          onError: (message) => {
            if (!cancelled) handleFailure(message || "Something went wrong during the interview.");
          },
          onModeChange: ({ mode }) => {
            if (!cancelled) setAgentSpeaking(mode === "speaking");
          },
          onMessage: ({ role, message }) => {
            if (cancelled) return;
            setCaptions((prev) => [...prev.slice(-4), { role: role === "agent" ? "agent" : "candidate", text: message }]);
          },
        });

        if (cancelled) {
          conversation.endSession();
          return;
        }
        conversationRef.current = conversation;

        // The SDK plays the agent's voice through its own internal AudioContext graph,
        // which MediaRecorder can't see. Tap the SDK's output AnalyserNode (an undocumented
        // but stable part of its playback graph) and mix it with the candidate's mic into a
        // single track so the recording captures both sides of the conversation.
        let recordingStream = stream;
        try {
          const analyser = (
            conversation as unknown as { output?: { getAnalyser?: () => AnalyserNode } }
          ).output?.getAnalyser?.();
          if (analyser) {
            const ctx = analyser.context as AudioContext;
            const micSource = ctx.createMediaStreamSource(stream);
            const mixDestination = ctx.createMediaStreamDestination();
            micSource.connect(mixDestination);
            analyser.connect(mixDestination);
            mixNodesRef.current = { micSource, mixDestination };
            recordingStream = new MediaStream([...stream.getVideoTracks(), ...mixDestination.stream.getAudioTracks()]);
          }
        } catch {
          // Fall back to candidate-only audio if the SDK's internal graph isn't reachable.
        }

        const mimeType = pickMimeType();
        const recorder = new MediaRecorder(recordingStream, { mimeType });
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.start();
        recorderRef.current = recorder;
        recordStartRef.current = Date.now();
      } catch {
        if (!cancelled) handleFailure("Couldn't connect to the interviewer. Check your connection and try again.");
      }
    }

    connect();

    return () => {
      cancelled = true;
      cleanupMixNodes();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream, token]);

  useEffect(() => {
    if (phase !== "active") return;
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [phase]);

  function handleEndEarly() {
    conversationRef.current?.endSession();
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-6">
      <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
        <span className="truncate">
          {jobTitle} · {companyName}
        </span>
        {phase === "active" && (
          <span className="flex shrink-0 items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-destructive" />
            REC {formatElapsed(elapsedSeconds)}
          </span>
        )}
      </div>

      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-navy">
        <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />

        {phase === "connecting" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-navy/80 text-white">
            <Mic className="h-6 w-6 animate-pulse" />
            <p className="text-sm">Connecting you with your interviewer…</p>
          </div>
        )}

        {(phase === "active" || phase === "wrapping-up") && (
          <div className="absolute bottom-3 right-3 flex w-32 flex-col items-center gap-1.5 rounded-xl bg-black/60 px-3 py-3 text-white backdrop-blur-sm">
            <div className="relative flex h-10 w-10 items-center justify-center">
              {agentSpeaking && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />}
              <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Sparkles className="h-4 w-4" />
              </span>
            </div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-white/70">AI Interviewer</p>
            <p className="text-center text-[11px] text-white">{agentSpeaking ? "Speaking…" : "Listening…"}</p>
          </div>
        )}

        {phase === "wrapping-up" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-navy/80 text-white">
            <p className="text-sm">Wrapping up…</p>
          </div>
        )}
      </div>

      {captions.length > 0 && phase === "active" && (
        <p className="min-h-10 text-center text-sm text-muted-foreground">{captions[captions.length - 1]?.text}</p>
      )}

      {phase === "error" && (
        <p className="text-center text-sm text-destructive">
          {errorMessage ?? "Something went wrong."} Please reach out to the team that invited you.
        </p>
      )}

      {phase === "active" && (
        <Button variant="outline" onClick={handleEndEarly}>
          <PhoneOff className="h-4 w-4" /> End interview
        </Button>
      )}
    </div>
  );
}
