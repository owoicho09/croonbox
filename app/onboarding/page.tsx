import type { Metadata } from "next";
import Link from "next/link";
import { Video } from "lucide-react";
import { requireUser } from "@/lib/actions/auth";
import { OnboardingForm } from "@/components/auth/onboarding-form";

export const metadata: Metadata = { title: "Create your workspace" };

export default async function OnboardingPage() {
  await requireUser();

  return (
    <div className="flex min-h-full flex-col bg-background">
      <header className="px-4 py-6 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-foreground">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Video className="h-4 w-4" />
          </span>
          Croonbox
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16 sm:px-6">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold text-foreground">Create your workspace</h1>
          <p className="mt-1 text-sm text-muted-foreground">One more step before you can create jobs.</p>
          <div className="mt-8">
            <OnboardingForm />
          </div>
        </div>
      </main>
    </div>
  );
}
