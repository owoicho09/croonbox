"use client";

import { useActionState } from "react";
import { updateNameAction } from "@/lib/actions/account";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { useActionToast } from "@/lib/hooks/use-action-toast";
import type { ActionState } from "@/lib/actions/auth";

export function ProfileNameForm({ name, email }: { name: string; email: string }) {
  const [state, formAction] = useActionState<ActionState, FormData>(updateNameAction, undefined);
  useActionToast(state, "Name updated.");

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="profile-name">Your name</Label>
        <Input id="profile-name" name="name" defaultValue={name} required />
        {state?.fieldErrors?.name && <p className="text-xs text-destructive">{state.fieldErrors.name}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="profile-email">Email</Label>
        <Input id="profile-email" value={email} disabled />
        <p className="text-xs text-muted-foreground">Contact support to change the email on your account.</p>
      </div>
      <SubmitButton className="w-auto" variant="outline">
        Save name
      </SubmitButton>
    </form>
  );
}
