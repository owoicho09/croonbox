import Link from "next/link";
import { LogOut, Video } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import { Badge } from "@/components/ui/badge";

export function AppTopbar({
  userName,
  plan,
}: {
  userName: string;
  plan: string;
}) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4 sm:px-6">
      <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-foreground md:hidden">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Video className="h-4 w-4" />
        </span>
      </Link>
      <div className="hidden md:block" />

      <div className="flex items-center gap-2 sm:gap-4">
        <Badge variant="outline" className="hidden capitalize sm:inline-flex">
          {plan} plan
        </Badge>
        <span className="hidden text-sm text-muted-foreground sm:inline">{userName}</span>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </form>
      </div>
    </header>
  );
}
