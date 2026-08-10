"use client";

import { useActionState } from "react";
import { publishJobAction, archiveJobAction } from "@/lib/actions/jobs";
import { SubmitButton } from "@/components/ui/submit-button";
import { Badge } from "@/components/ui/badge";
import type { ActionState } from "@/lib/actions/auth";

const statusVariant = {
  draft: "outline",
  published: "success",
  archived: "secondary",
} as const;

export function PublishBar({ jobId, status }: { jobId: string; status: "draft" | "published" | "archived" }) {
  const publishAction = publishJobAction.bind(null, jobId);
  const [publishState, publishFormAction] = useActionState<ActionState, FormData>(publishAction, undefined);

  return (
    <div className="rounded-xl border border-border bg-card px-5 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status</span>
          <Badge variant={statusVariant[status]} className="capitalize">
            {status}
          </Badge>
        </div>

        <div className="flex gap-2">
          {status === "draft" && (
            <form action={publishFormAction}>
              <SubmitButton className="w-auto">Publish job</SubmitButton>
            </form>
          )}
          {status === "published" && (
            <form action={archiveJobAction.bind(null, jobId)}>
              <SubmitButton className="w-auto" variant="outline">
                Archive job
              </SubmitButton>
            </form>
          )}
        </div>
      </div>

      {publishState?.error && <p className="mt-3 text-sm text-destructive">{publishState.error}</p>}
    </div>
  );
}
