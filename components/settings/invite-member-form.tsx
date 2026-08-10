"use client";

import { useActionState } from "react";
import { inviteTeamMemberAction } from "@/lib/actions/team";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import type { ActionState } from "@/lib/actions/auth";

export function InviteMemberForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(inviteTeamMemberAction, undefined);

  return (
    <form action={formAction} className="flex items-end gap-3">
      <div className="flex-1 space-y-1.5">
        <Input name="email" type="email" placeholder="teammate@company.com" required />
        {state?.fieldErrors?.email && <p className="text-xs text-destructive">{state.fieldErrors.email}</p>}
      </div>
      <SubmitButton className="w-auto" variant="outline">
        Invite
      </SubmitButton>
    </form>
  );
}
