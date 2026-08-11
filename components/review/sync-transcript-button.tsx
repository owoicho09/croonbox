"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { syncTranscriptAction } from "@/lib/actions/transcript-sync";

export function SyncTranscriptButton({ sessionId }: { sessionId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await syncTranscriptAction(sessionId);
      if (result.error) toast.error(result.error);
      else toast.success("Transcript synced.");
    });
  }

  return (
    <Button type="button" variant="outline" size="sm" className="w-auto" disabled={isPending} onClick={handleClick}>
      <RefreshCw className="h-4 w-4" /> {isPending ? "Checking…" : "Check for transcript"}
    </Button>
  );
}
