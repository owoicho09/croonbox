"use client";

import { useActionState, useEffect, useRef } from "react";
import { changePasswordAction, type ChangePasswordState } from "@/lib/actions/account";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { useActionToast } from "@/lib/hooks/use-action-toast";

export function ChangePasswordForm() {
  const [state, formAction] = useActionState<ChangePasswordState, FormData>(changePasswordAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  useActionToast(state, "Password updated.");

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state?.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      {state?.success && (
        <p className="rounded-lg bg-primary-subtle px-3 py-2 text-sm text-primary">
          Password updated. You&apos;ve been signed out of your other devices.
        </p>
      )}
      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-destructive">{state.error}</p>}

      <div className="space-y-1.5">
        <Label htmlFor="currentPassword">Current password</Label>
        <Input id="currentPassword" name="currentPassword" type="password" required />
        {state?.fieldErrors?.currentPassword && <p className="text-xs text-destructive">{state.fieldErrors.currentPassword}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="newPassword">New password</Label>
        <Input id="newPassword" name="newPassword" type="password" required minLength={8} />
        {state?.fieldErrors?.newPassword && <p className="text-xs text-destructive">{state.fieldErrors.newPassword}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirmNewPassword">Confirm new password</Label>
        <Input id="confirmNewPassword" name="confirmNewPassword" type="password" required minLength={8} />
        {state?.fieldErrors?.confirmNewPassword && (
          <p className="text-xs text-destructive">{state.fieldErrors.confirmNewPassword}</p>
        )}
      </div>

      <SubmitButton className="w-auto" variant="outline">
        Update password
      </SubmitButton>
    </form>
  );
}
