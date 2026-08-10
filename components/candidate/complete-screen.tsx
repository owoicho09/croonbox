import { CheckCircle2 } from "lucide-react";

export function CompleteScreen({ companyName }: { companyName: string }) {
  return (
    <div className="mx-auto max-w-md text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-subtle text-primary">
        <CheckCircle2 className="h-7 w-7" />
      </span>
      <h1 className="mt-6 text-2xl font-semibold text-foreground">You&apos;re all done!</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Thanks for completing your interview. {companyName} has received your responses and will be in touch.
      </p>
      <p className="mt-6 text-xs text-muted-foreground">You can safely close this window.</p>
    </div>
  );
}
