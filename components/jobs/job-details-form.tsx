"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";
import type { ActionState } from "@/lib/actions/auth";

type Defaults = {
  title: string;
  candidateInstructions: string;
  defaultPrepSeconds: number;
  defaultResponseSeconds: number;
  retakesAllowed: number;
  deadlineAt: string;
};

export function JobDetailsForm({
  action,
  defaults,
  submitLabel,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  defaults: Defaults;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, undefined);

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-destructive">{state.error}</p>}

      <div className="space-y-1.5">
        <Label htmlFor="title">Job title</Label>
        <Input id="title" name="title" defaultValue={defaults.title} required placeholder="e.g. Senior Backend Engineer" />
        {state?.fieldErrors?.title && <p className="text-xs text-destructive">{state.fieldErrors.title}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="candidateInstructions">Candidate instructions</Label>
        <Textarea
          id="candidateInstructions"
          name="candidateInstructions"
          defaultValue={defaults.candidateInstructions}
          placeholder="What should candidates know before they start? Tone, expectations, anything role-specific."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="defaultPrepSeconds">Prep time (seconds)</Label>
          <Input
            id="defaultPrepSeconds"
            name="defaultPrepSeconds"
            type="number"
            min={0}
            max={600}
            defaultValue={defaults.defaultPrepSeconds}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="defaultResponseSeconds">Response limit (seconds)</Label>
          <Input
            id="defaultResponseSeconds"
            name="defaultResponseSeconds"
            type="number"
            min={15}
            max={900}
            defaultValue={defaults.defaultResponseSeconds}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="retakesAllowed">Retakes allowed</Label>
          <Input
            id="retakesAllowed"
            name="retakesAllowed"
            type="number"
            min={0}
            max={5}
            defaultValue={defaults.retakesAllowed}
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="deadlineAt">Interview deadline (optional)</Label>
        <Input id="deadlineAt" name="deadlineAt" type="datetime-local" defaultValue={defaults.deadlineAt} />
      </div>

      <SubmitButton className="w-auto">{submitLabel}</SubmitButton>
    </form>
  );
}
