"use client";

import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";

const BAR_COUNT = 5;
const IDLE_SCALE = 0.28;

/** Avatar for the AI interviewer with bars that move with its real speech amplitude. */
export function AgentWaveform({ analyser, speaking }: { analyser: AnalyserNode | null; speaking: boolean }) {
  const barRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!analyser || !speaking) {
      for (const bar of barRefs.current) {
        if (bar) bar.style.transform = `scaleY(${IDLE_SCALE})`;
      }
      return;
    }

    const data = new Uint8Array(analyser.frequencyBinCount);
    const binStep = Math.max(1, Math.floor(data.length / (BAR_COUNT * 3)));

    function tick() {
      if (!analyser) return;
      analyser.getByteFrequencyData(data);
      for (let i = 0; i < BAR_COUNT; i++) {
        const sample = data[i * binStep] ?? 0;
        const scale = IDLE_SCALE + (sample / 255) * (1 - IDLE_SCALE);
        const bar = barRefs.current[i];
        if (bar) bar.style.transform = `scaleY(${scale})`;
      }
      frameRef.current = requestAnimationFrame(tick);
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [analyser, speaking]);

  return (
    <div className="relative flex h-10 w-10 items-center justify-center">
      <span
        className={`relative flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity ${speaking ? "opacity-0" : "opacity-100"}`}
      >
        <Sparkles className="h-4 w-4" />
      </span>
      <div
        className={`absolute inset-0 flex items-center justify-center gap-[3px] rounded-full bg-primary transition-opacity ${speaking ? "opacity-100" : "opacity-0"}`}
      >
        {Array.from({ length: BAR_COUNT }).map((_, i) => (
          <span
            key={i}
            ref={(el) => {
              barRefs.current[i] = el;
            }}
            className="h-5 w-[3px] origin-center rounded-full bg-primary-foreground transition-transform duration-75"
            style={{ transform: `scaleY(${IDLE_SCALE})` }}
          />
        ))}
      </div>
    </div>
  );
}
