"use client";
import { useActionState } from "react";
import { Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { submitFix } from "./actions";

const initialState = { ok: false, message: "" };

export function FixForm({ reportId, code = "", note = "" }: { reportId: string; code?: string; note?: string }) {
  const [state, action, pending] = useActionState(submitFix, initialState);
  return <form action={action} className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
    <div className="border-b px-5 py-4">
      <h2 className="font-semibold">Submit corrected Python to QA</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">Each submission becomes a new version that QA tests and decides on.</p>
    </div>
    <div className="grid gap-4 p-5">
      <input type="hidden" name="reportId" value={reportId} />
      <div className="grid gap-2"><Label htmlFor="fixed-code">Corrected code</Label>
        <Textarea id="fixed-code" name="code" defaultValue={code} required maxLength={20000} rows={12} spellCheck={false} className="min-h-64 bg-zinc-950 font-mono text-[13px] leading-6 text-zinc-100 placeholder:text-zinc-500 md:text-[13px]" placeholder="def fixed_function(...):" /></div>
      <div className="grid gap-2"><Label htmlFor="submission-note">Submission note</Label>
        <Textarea id="submission-note" name="note" defaultValue={note} maxLength={5000} rows={3} className="min-h-20" placeholder="What changed and why" /></div>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/40 px-5 py-3.5">
      {state.message ? <p role="status" className="text-sm text-muted-foreground">{state.message}</p> : <span className="text-xs text-muted-foreground">QA will compare this with the original code.</span>}
      <Button disabled={pending} size="lg">{pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}{pending ? "Submitting…" : "Submit to QA"}</Button>
    </div>
  </form>;
}
