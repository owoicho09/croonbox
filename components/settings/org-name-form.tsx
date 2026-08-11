"use client";

import { useActionState } from "react";
import { updateOrganizationNameAction } from "@/lib/actions/organization";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { useActionToast } from "@/lib/hooks/use-action-toast";
import type { ActionState } from "@/lib/actions/auth";

export function OrgNameForm({ name }: { name: string }) {
  const [state, formAction] = useActionState<ActionState, FormData>(updateOrganizationNameAction, undefined);
  useActionToast(state, "Workspace name updated.");

  return (
    <form action={formAction} className="flex items-end gap-3">
      <div className="flex-1 space-y-1.5">
        <Label htmlFor="name">Company name</Label>
        <Input id="name" name="name" defaultValue={name} required />
        {state?.fieldErrors?.name && <p className="text-xs text-destructive">{state.fieldErrors.name}</p>}
      </div>
      <SubmitButton className="w-auto" variant="outline">
        Save
      </SubmitButton>
    </form>
  );
}
