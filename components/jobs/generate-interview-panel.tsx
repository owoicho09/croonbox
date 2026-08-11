"use client";

import { useActionState } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { generateInterviewConfigAction, type GenerateState } from "@/lib/actions/jobs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { GeneratingState } from "@/components/jobs/generating-state";
import { InterviewPreview, type InterviewConfigView } from "@/components/jobs/interview-preview";
import { useActionToast } from "@/lib/hooks/use-action-toast";

export function GenerateInterviewPanel({ jobId, config }: { jobId: string; config: InterviewConfigView | null }) {
  const action = generateInterviewConfigAction.bind(null, jobId);
  const [state, formAction, isPending] = useActionState<GenerateState, FormData>(action, undefined);
  useActionToast(state, config ? "Interview regenerated." : "Interview generated.");

  if (isPending) {
    return <GeneratingState />;
  }

  return (
    <div className="space-y-4">
      {config && <InterviewPreview config={config} />}

      <form action={formAction} className="space-y-3 rounded-xl border border-dashed border-border p-4">
        {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-destructive">{state.error}</p>}

        <div className="space-y-1.5">
          <Label htmlFor="guidanceNote">
            {config ? "Guidance for regenerating (optional)" : "Guidance (optional)"}
          </Label>
          <Textarea
            id="guidanceNote"
            name="guidanceNote"
            rows={2}
            placeholder='e.g. "Make it more focused on customer support experience" or "Ask more scenario-based questions."'
          />
        </div>

        <Button type="submit" variant={config ? "outline" : "default"} className="w-auto">
          {config ? (
            <>
              <RefreshCw className="h-4 w-4" /> Regenerate
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Generate Interview
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
