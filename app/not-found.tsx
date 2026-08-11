import Link from "next/link";
import { Video, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-background px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <Video className="h-6 w-6" />
      </span>
      <p className="mt-6 text-sm font-semibold text-primary">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-foreground">This page doesn&apos;t exist</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        The page you&apos;re looking for isn&apos;t here. It may have been moved, or the link might be incorrect.
      </p>
      <Button asChild className="mt-8">
        <Link href="/dashboard">
          <Home className="h-4 w-4" /> Go to dashboard
        </Link>
      </Button>
    </div>
  );
}
