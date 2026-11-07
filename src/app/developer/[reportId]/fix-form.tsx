"use client";
import { useActionState } from "react";
import { submitFix } from "./actions";
const initialState = { ok: false, message: "" };
export function FixForm({ reportId, code = "", note = "" }: { reportId: string; code?: string; note?: string }) {
  const [state, action, pending] = useActionState(submitFix, initialState);
  return <form action={action} className="grid gap-3 rounded-xl border p-5"><h2 className="text-xl font-semibold">Submit corrected Python to QA</h2>
    <input type="hidden" name="reportId" value={reportId} /><label htmlFor="fixed-code">Corrected code</label><textarea id="fixed-code" name="code" defaultValue={code} required maxLength={20000} rows={12} className="rounded border p-3 font-mono text-sm" />
    <label htmlFor="submission-note">Submission note</label><textarea id="submission-note" name="note" defaultValue={note} maxLength={5000} rows={3} className="rounded border p-3" />
    <button disabled={pending} className="w-fit rounded bg-black px-4 py-2 text-white">{pending ? "Submitting…" : "Submit to QA"}</button>{state.message && <p role="status">{state.message}</p>}
  </form>;
}
