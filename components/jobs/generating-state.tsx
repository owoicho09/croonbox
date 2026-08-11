"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

const STEPS = [
  "Understanding the role…",
  "Extracting key requirements…",
  "Creating focus areas…",
  "Drafting interview questions…",
  "Preparing the interview flow…",
];

export function GeneratingState() {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
    }, 1400);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card px-6 py-14 text-center">
      <span className="flex h-12 w-12 animate-pulse items-center justify-center rounded-full bg-primary-subtle text-primary">
        <Sparkles className="h-6 w-6" />
      </span>
      <div>
        <p className="font-medium text-foreground">Croonbox is preparing your AI interviewer</p>
        <p className="mt-1 text-sm text-muted-foreground">{STEPS[stepIndex]}</p>
      </div>
      <div className="flex gap-1.5">
        {STEPS.map((step, i) => (
          <span
            key={step}
            className={`h-1.5 w-6 rounded-full transition-colors ${i <= stepIndex ? "bg-primary" : "bg-secondary"}`}
          />
        ))}
      </div>
    </div>
  );
}
