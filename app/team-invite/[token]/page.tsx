import type { Metadata } from "next";
import Link from "next/link";
import { Video } from "lucide-react";
import { acceptTeamInvitationAction } from "@/lib/actions/team";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Team Invitation" };

export default async function TeamInvitePage({ params }: PageProps<"/team-invite/[token]">) {
  const { token } = await params;
  const result = await acceptTeamInvitationAction(token);

  return (
    <div className="flex min-h-full flex-col bg-background">
      <header className="px-6 py-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-foreground">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Video className="h-4 w-4" />
          </span>
          Croonbox
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-6 pb-16">
        <div className="w-full max-w-sm text-center">
          <p className="text-sm text-destructive">{result?.error}</p>
          <Button asChild className="mt-6">
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
