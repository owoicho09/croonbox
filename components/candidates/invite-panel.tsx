"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import {
  inviteSingleCandidateAction,
  inviteBulkCandidatesAction,
  inviteCsvCandidatesAction,
  type InviteState,
} from "@/lib/actions/candidates";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

function useInviteToast(state: InviteState) {
  useEffect(() => {
    if (!state) return;
    if (state.summary) toast.success(state.summary);
    else if (state.error) toast.error(state.error);
  }, [state]);
}

function ResultBanner({ state }: { state: InviteState }) {
  if (!state) return null;
  return (
    <div className="space-y-1">
      {state.summary && <p className="rounded-lg bg-primary-subtle px-3 py-2 text-sm text-primary">{state.summary}</p>}
      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-destructive">{state.error}</p>}
    </div>
  );
}

export function InvitePanel({ jobId }: { jobId: string }) {
  const singleAction = inviteSingleCandidateAction.bind(null, jobId);
  const bulkAction = inviteBulkCandidatesAction.bind(null, jobId);
  const csvAction = inviteCsvCandidatesAction.bind(null, jobId);

  const [singleState, singleFormAction] = useActionState<InviteState, FormData>(singleAction, undefined);
  const [bulkState, bulkFormAction] = useActionState<InviteState, FormData>(bulkAction, undefined);
  const [csvState, csvFormAction] = useActionState<InviteState, FormData>(csvAction, undefined);

  useInviteToast(singleState);
  useInviteToast(bulkState);
  useInviteToast(csvState);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Invite one candidate</CardTitle>
          <CardDescription>Send a single interview invitation.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={singleFormAction} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="single-name">Name</Label>
              <Input id="single-name" name="name" required />
              {singleState?.fieldErrors?.name && <p className="text-xs text-destructive">{singleState.fieldErrors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="single-email">Email</Label>
              <Input id="single-email" name="email" type="email" required />
              {singleState?.fieldErrors?.email && <p className="text-xs text-destructive">{singleState.fieldErrors.email}</p>}
            </div>
            <SubmitButton className="w-auto" size="sm">
              Send invite
            </SubmitButton>
            <ResultBanner state={singleState} />
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Paste multiple</CardTitle>
          <CardDescription>One candidate per line: email,name</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={bulkFormAction} className="space-y-3">
            <Textarea
              name="rows"
              rows={6}
              placeholder={"jane@company.com,Jane Doe\njohn@company.com,John Smith"}
              required
            />
            <SubmitButton className="w-auto" size="sm">
              Send invites
            </SubmitButton>
            <ResultBanner state={bulkState} />
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upload CSV</CardTitle>
          <CardDescription>Two columns, no header: email, name</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={csvFormAction} className="space-y-3">
            <input
              type="file"
              name="file"
              accept=".csv,text/csv"
              required
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground"
            />
            <SubmitButton className="w-auto" size="sm">
              Upload &amp; invite
            </SubmitButton>
            <ResultBanner state={csvState} />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
