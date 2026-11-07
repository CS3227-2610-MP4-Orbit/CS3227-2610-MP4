"use client";

import { useActionState } from "react";

import { addInvestigationNote, editInvestigationNote, startWork } from "./actions";

const initialState = { ok: false, message: "" };

export function StartWorkForm({ reportId }: { reportId: string }) {
  const [state, action, pending] = useActionState(startWork, initialState);
  return (
    <form action={action} className="grid gap-2">
      <input type="hidden" name="reportId" value={reportId} />
      <button disabled={pending} className="w-fit rounded bg-black px-4 py-2 text-white">{pending ? "Starting…" : "Start investigation"}</button>
      {state.message && <p role="status" className="text-sm text-gray-600">{state.message}</p>}
    </form>
  );
}

export function AddNoteForm({ reportId }: { reportId: string }) {
  const [state, action, pending] = useActionState(addInvestigationNote, initialState);
  return (
    <form action={action} className="mt-4 grid gap-3">
      <input type="hidden" name="reportId" value={reportId} />
      <label htmlFor="new-note" className="font-medium">Add investigation note</label>
      <textarea id="new-note" name="body" required maxLength={5000} rows={4} className="rounded border p-3" />
      <button disabled={pending} className="w-fit rounded border px-4 py-2">{pending ? "Saving…" : "Add note"}</button>
      {state.message && <p role="status" className="text-sm text-gray-600">{state.message}</p>}
    </form>
  );
}

export function EditNoteForm({ reportId, noteId, body }: { reportId: string; noteId: string; body: string }) {
  const [state, action, pending] = useActionState(editInvestigationNote, initialState);
  return (
    <form action={action} className="mt-2 grid gap-2">
      <input type="hidden" name="reportId" value={reportId} />
      <input type="hidden" name="noteId" value={noteId} />
      <textarea name="body" defaultValue={body} required maxLength={5000} rows={3} className="rounded border p-3" />
      <button disabled={pending} className="w-fit rounded border px-3 py-1 text-sm">{pending ? "Saving…" : "Save edit"}</button>
      {state.message && <p role="status" className="text-sm text-gray-600">{state.message}</p>}
    </form>
  );
}
