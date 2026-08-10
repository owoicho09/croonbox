"use client";

import { useRef } from "react";
import { addReviewNoteAction } from "@/lib/actions/review";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function NoteForm({ sessionId }: { sessionId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const action = addReviewNoteAction.bind(null, sessionId);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await action(formData);
        formRef.current?.reset();
      }}
      className="space-y-2"
    >
      <Textarea name="note" placeholder="Add a note for your team…" rows={2} required />
      <Button type="submit" size="sm" variant="outline" className="w-auto">
        Add note
      </Button>
    </form>
  );
}
