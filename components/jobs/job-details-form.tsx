"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";
import { useActionToast } from "@/lib/hooks/use-action-toast";
import type { ActionState } from "@/lib/actions/auth";

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "", label: "Not specified" },
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
];

type Defaults = {
  title: string;
  department: string;
  location: string;
  employmentType: string;
  seniorityLevel: string;
  context: string;
  candidateInstructions: string;
  maxDurationMinutes: number;
  deadlineAt: string;
  cameraRequired: boolean;
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
  useActionToast(state, "Job details saved.");

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-destructive">{state.error}</p>}

      <div className="space-y-1.5">
        <Label htmlFor="title">Job title</Label>
        <Input id="title" name="title" defaultValue={defaults.title} required placeholder="e.g. Senior Backend Engineer" />
        {state?.fieldErrors?.title && <p className="text-xs text-destructive">{state.fieldErrors.title}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="department">Department (optional)</Label>
          <Input id="department" name="department" defaultValue={defaults.department} placeholder="e.g. Engineering" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="location">Location (optional)</Label>
          <Input id="location" name="location" defaultValue={defaults.location} placeholder="e.g. Remote, Lagos" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="employmentType">Employment type (optional)</Label>
          <select
            id="employmentType"
            name="employmentType"
            defaultValue={defaults.employmentType}
            className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {EMPLOYMENT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="seniorityLevel">Seniority level (optional)</Label>
          <Input id="seniorityLevel" name="seniorityLevel" defaultValue={defaults.seniorityLevel} placeholder="e.g. Mid-level" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="context">Job description &amp; interview context</Label>
        <Textarea
          id="context"
          name="context"
          rows={6}
          defaultValue={defaults.context}
          required
          placeholder="Paste the job description, key requirements, and anything the AI interviewer should know about this role. This is what the interview gets generated from."
        />
        {state?.fieldErrors?.context && <p className="text-xs text-destructive">{state.fieldErrors.context}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="candidateInstructions">Candidate instructions (optional)</Label>
        <Textarea
          id="candidateInstructions"
          name="candidateInstructions"
          defaultValue={defaults.candidateInstructions}
          placeholder="What should candidates know before they start? Shown on their intro screen — logistics, expectations, tone."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="maxDurationMinutes">Max interview length (minutes)</Label>
          <Input
            id="maxDurationMinutes"
            name="maxDurationMinutes"
            type="number"
            min={5}
            max={60}
            defaultValue={defaults.maxDurationMinutes}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="deadlineAt">Interview deadline (optional)</Label>
          <Input id="deadlineAt" name="deadlineAt" type="datetime-local" defaultValue={defaults.deadlineAt} />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          name="cameraRequired"
          defaultChecked={defaults.cameraRequired}
          className="h-4 w-4 rounded border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        Require camera during the interview
      </label>

      <SubmitButton className="w-auto">{submitLabel}</SubmitButton>
    </form>
  );
}
