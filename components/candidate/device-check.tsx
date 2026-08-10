"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Mic, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeviceCheck({ onReady }: { onReady: (stream: MediaStream) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    let active = true;
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((s) => {
        if (!active) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => {
        setError("We couldn't access your camera and microphone. Check your browser permissions and try again.");
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-md text-center">
      <h1 className="text-xl font-semibold text-foreground">Check your camera &amp; microphone</h1>
      <p className="mt-2 text-sm text-muted-foreground">Make sure you can see yourself and the video looks good.</p>

      <div className="mt-6 aspect-video overflow-hidden rounded-xl border border-border bg-secondary">
        {error ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : (
          <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
        )}
      </div>

      <div className="mt-4 flex items-center justify-center gap-6 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Camera className="h-4 w-4" /> Camera {stream ? "ready" : "…"}
        </span>
        <span className="flex items-center gap-1.5">
          <Mic className="h-4 w-4" /> Microphone {stream ? "ready" : "…"}
        </span>
      </div>

      <Button className="mt-8 w-full" size="lg" disabled={!stream} onClick={() => stream && onReady(stream)}>
        Start Interview
      </Button>
    </div>
  );
}
