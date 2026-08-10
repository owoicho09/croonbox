"use client";

import { useActionState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";
import type { ActionState } from "@/lib/actions/auth";

export function AddQuestionForm({
  action,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state !== undefined && !state.error && !state.fieldErrors) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4 rounded-xl border border-dashed border-border p-4">
      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-destructive">{state.error}</p>}

      <div className="space-y-1.5">
        <Label htmlFor="prompt">Question</Label>
        <Textarea id="prompt" name="prompt" placeholder="e.g. Walk us through a time you disagreed with a decision at work." required />
        {state?.fieldErrors?.prompt && <p className="text-xs text-destructive">{state.fieldErrors.prompt}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="prepSeconds">Prep time override (seconds)</Label>
          <Input id="prepSeconds" name="prepSeconds" type="number" min={0} max={600} placeholder="Uses job default" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="responseSeconds">Response limit override (seconds)</Label>
          <Input id="responseSeconds" name="responseSeconds" type="number" min={15} max={900} placeholder="Uses job default" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="evaluationGuidance">Evaluation guidance (internal, optional)</Label>
        <Textarea
          id="evaluationGuidance"
          name="evaluationGuidance"
          placeholder="What should a strong answer include? Only used to guide AI insights and reviewers — never shown to candidates."
        />
      </div>

      <SubmitButton className="w-auto" variant="outline">
        Add question
      </SubmitButton>
    </form>
  );
}
