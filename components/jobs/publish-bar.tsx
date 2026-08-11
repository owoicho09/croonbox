"use client";

import { useActionState, useTransition } from "react";
import { toast } from "sonner";
import { publishJobAction, archiveJobAction, closeJobAction } from "@/lib/actions/jobs";
import { SubmitButton } from "@/components/ui/submit-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useActionToast } from "@/lib/hooks/use-action-toast";
import type { ActionState } from "@/lib/actions/auth";

const statusVariant = {
  draft: "outline",
  published: "success",
  closed: "secondary",
  archived: "secondary",
} as const;

export function PublishBar({ jobId, status }: { jobId: string; status: "draft" | "published" | "closed" | "archived" }) {
  const publishAction = publishJobAction.bind(null, jobId);
  const [publishState, publishFormAction] = useActionState<ActionState, FormData>(publishAction, undefined);
  useActionToast(publishState, "Job published.");

  const [isPending, startTransition] = useTransition();

  function handleClose() {
    startTransition(async () => {
      await closeJobAction(jobId);
      toast.success("Job closed to new invitations.");
    });
  }

  function handleArchive() {
    startTransition(async () => {
      await archiveJobAction(jobId);
      toast.success("Job archived.");
    });
  }

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
            <>
              <Button type="button" variant="outline" className="w-auto" disabled={isPending} onClick={handleClose}>
                Close job
              </Button>
              <Button type="button" variant="outline" className="w-auto" disabled={isPending} onClick={handleArchive}>
                Archive job
              </Button>
            </>
          )}
          {status === "closed" && (
            <Button type="button" variant="outline" className="w-auto" disabled={isPending} onClick={handleArchive}>
              Archive job
            </Button>
          )}
        </div>
      </div>

      {publishState?.error && <p className="mt-3 text-sm text-destructive">{publishState.error}</p>}
    </div>
  );
}
