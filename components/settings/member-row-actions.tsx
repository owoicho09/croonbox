"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { UserMinus, XCircle } from "lucide-react";
import { removeMemberAction, revokeTeamInvitationAction } from "@/lib/actions/team";

export function RemoveMemberButton({ membershipId }: { membershipId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await removeMemberAction(membershipId);
          toast.success("Member removed.");
        })
      }
      className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-red-50 hover:text-destructive disabled:opacity-50"
    >
      <UserMinus className="h-3.5 w-3.5" /> Remove
    </button>
  );
}

export function RevokeInviteButton({ invitationId }: { invitationId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await revokeTeamInvitationAction(invitationId);
          toast.success("Invite revoked.");
        })
      }
      className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-red-50 hover:text-destructive disabled:opacity-50"
    >
      <XCircle className="h-3.5 w-3.5" /> Revoke
    </button>
  );
}
