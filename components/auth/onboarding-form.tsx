"use client";

import { useActionState } from "react";
import { createWorkspaceAction } from "@/lib/actions/onboarding";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import type { ActionState } from "@/lib/actions/auth";

export function OnboardingForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(createWorkspaceAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="companyName">Company name</Label>
        <Input id="companyName" name="companyName" required />
        {state?.fieldErrors?.companyName && (
          <p className="text-xs text-destructive">{state.fieldErrors.companyName}</p>
        )}
      </div>
      <SubmitButton>Create workspace</SubmitButton>
    </form>
  );
}
