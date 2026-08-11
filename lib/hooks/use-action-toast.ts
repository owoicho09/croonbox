"use client";

import { useEffect } from "react";
import { toast } from "sonner";

type ToastableState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

// Fires a toast whenever a useActionState-driven server action completes. Skips the very first
// render (initial state) and skips toasting pure field-validation errors — those already render
// inline next to the offending input, so a toast on top would just be noise.
export function useActionToast(state: ToastableState, successMessage: string) {
  useEffect(() => {
    if (state === undefined) return;
    if (state.error) {
      toast.error(state.error);
      return;
    }
    if (state.fieldErrors && Object.keys(state.fieldErrors).length > 0) return;
    toast.success(successMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
}
