"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Video, AlertTriangle, RotateCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-background px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive text-destructive-foreground">
        <AlertTriangle className="h-6 w-6" />
      </span>
      <p className="mt-6 flex items-center gap-1.5 text-sm font-semibold text-primary">
        <Video className="h-4 w-4" /> Croonbox
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-foreground">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        An unexpected error occurred. Try again, or head back to your dashboard — if this keeps happening, let us know.
      </p>
      {error.digest && <p className="mt-2 text-xs text-muted-foreground">Error reference: {error.digest}</p>}
      <div className="mt-8 flex gap-3">
        <Button variant="outline" onClick={() => reset()}>
          <RotateCw className="h-4 w-4" /> Try again
        </Button>
        <Button asChild>
          <Link href="/dashboard">
            <Home className="h-4 w-4" /> Go to dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
