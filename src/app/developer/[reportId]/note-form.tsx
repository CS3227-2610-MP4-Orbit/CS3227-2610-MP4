"use client";

import { useActionState } from "react";
import { Loader2, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { addInvestigationNote, editInvestigationNote, startWork } from "./actions";

const initialState = { ok: false, message: "" };

export function StartWorkForm({ reportId }: { reportId: string }) {
  const [state, action, pending] = useActionState(startWork, initialState);
  return (
    <form action={action} className="grid gap-2">
      <input type="hidden" name="reportId" value={reportId} />
      <Button disabled={pending} size="lg" className="w-full">{pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Play aria-hidden="true" />}{pending ? "Starting…" : "Start investigation"}</Button>
      {state.message && <p role="status" className="text-sm text-muted-foreground">{state.message}</p>}
    </form>
  );
}

export function AddNoteForm({ reportId }: { reportId: string }) {
  const [state, action, pending] = useActionState(addInvestigationNote, initialState);
  return (
    <form action={action} className="grid gap-2 border-t pt-4">
      <input type="hidden" name="reportId" value={reportId} />
      <Label htmlFor="new-note">Add investigation note</Label>
      <Textarea id="new-note" name="body" required maxLength={5000} rows={3} className="min-h-20" placeholder="What you tried, what you found" />
      <div className="flex items-center gap-3">
        <Button disabled={pending} variant="outline" size="sm">{pending && <Loader2 className="animate-spin" aria-hidden="true" />}{pending ? "Saving…" : "Add note"}</Button>
        {state.message && <p role="status" className="text-sm text-muted-foreground">{state.message}</p>}
      </div>
    </form>
  );
}

export function EditNoteForm({ reportId, noteId, body }: { reportId: string; noteId: string; body: string }) {
  const [state, action, pending] = useActionState(editInvestigationNote, initialState);
  return (
    <details className="group mt-2">
      <summary className="w-fit cursor-pointer list-none text-xs font-medium text-muted-foreground hover:text-foreground group-open:text-foreground">Edit note</summary>
      <form action={action} className="mt-2 grid gap-2">
        <input type="hidden" name="reportId" value={reportId} />
        <input type="hidden" name="noteId" value={noteId} />
        <Textarea name="body" aria-label="Edit investigation note" defaultValue={body} required maxLength={5000} rows={3} className="min-h-20" />
        <div className="flex items-center gap-3">
          <Button disabled={pending} variant="outline" size="sm">{pending && <Loader2 className="animate-spin" aria-hidden="true" />}{pending ? "Saving…" : "Save edit"}</Button>
          {state.message && <p role="status" className="text-sm text-muted-foreground">{state.message}</p>}
        </div>
      </form>
    </details>
  );
}
