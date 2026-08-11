"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Eye } from "lucide-react";
import { previewInterviewAction } from "@/lib/actions/jobs";

export function PreviewInterviewButton({ jobId }: { jobId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    // Open the tab synchronously on the click, before the async action resolves, or popup
    // blockers will swallow it — we point it at the real interview URL once we have the token.
    const previewTab = window.open("", "_blank");

    startTransition(async () => {
      const result = await previewInterviewAction(jobId);
      if ("error" in result) {
        previewTab?.close();
        toast.error(result.error);
        return;
      }
      if (previewTab) {
        previewTab.location.href = `${window.location.origin}/interview/${result.token}`;
      } else {
        toast.error("Your browser blocked the preview tab. Allow pop-ups for this site and try again.");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
    >
      <Eye className="h-4 w-4" /> {isPending ? "Opening…" : "Preview Interview"}
    </button>
  );
}
