"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { ThumbsUp, HelpCircle, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setDecisionAction } from "@/lib/actions/review";
import { cn } from "@/lib/utils";

type Decision = "none" | "shortlisted" | "maybe" | "rejected";

const options: { value: Exclude<Decision, "none">; label: string; icon: typeof ThumbsUp }[] = [
  { value: "shortlisted", label: "Shortlist", icon: ThumbsUp },
  { value: "maybe", label: "Maybe", icon: HelpCircle },
  { value: "rejected", label: "Reject", icon: ThumbsDown },
];

export function DecisionButtons({ sessionId, decision }: { sessionId: string; decision: Decision }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = decision === opt.value;
        return (
          <Button
            key={opt.value}
            variant={active ? "default" : "outline"}
            size="sm"
            disabled={isPending}
            className={cn(active && opt.value === "rejected" && "bg-destructive hover:bg-destructive/90")}
            onClick={() =>
              startTransition(async () => {
                await setDecisionAction(sessionId, opt.value);
                toast.success(`Marked as ${opt.label}.`);
              })
            }
          >
            <opt.icon className="h-4 w-4" /> {opt.label}
          </Button>
        );
      })}
    </div>
  );
}
