"use client";

import { useTransition } from "react";
import { ThumbsUp, HelpCircle, ThumbsDown } from "lucide-react";
import { setDecisionAction } from "@/lib/actions/review";
import { cn } from "@/lib/utils";

type Decision = "none" | "shortlisted" | "maybe" | "rejected";

const options: { value: Exclude<Decision, "none">; label: string; icon: typeof ThumbsUp; activeClass: string }[] = [
  { value: "shortlisted", label: "Shortlist", icon: ThumbsUp, activeClass: "bg-success/10 text-success" },
  { value: "maybe", label: "Maybe", icon: HelpCircle, activeClass: "bg-amber-50 text-amber-700" },
  { value: "rejected", label: "Reject", icon: ThumbsDown, activeClass: "bg-red-50 text-destructive" },
];

export function QuickDecision({ sessionId, decision }: { sessionId: string; decision: Decision }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      {options.map((opt) => {
        const active = decision === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            title={opt.label}
            disabled={isPending}
            onClick={() => startTransition(() => setDecisionAction(sessionId, opt.value))}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-50",
              active && opt.activeClass,
            )}
          >
            <opt.icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}
