"use client";

import { useActionState } from "react";

import type { ExplanationState } from "./ai-actions";

const initialState: ExplanationState = { ok: false, text: "", message: "" };

export function AiExplanation({ action }: { action: (previous: ExplanationState) => Promise<ExplanationState> }) {
  const [state, formAction, pending] = useActionState(action, initialState);
  return (
    <section id="report-ai" aria-labelledby="report-ai-heading" className="space-y-3 rounded-xl border border-violet-200 bg-violet-50/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="report-ai-heading" className="font-semibold">AI code explanation</h2>
        <form action={formAction}>
          <button disabled={pending} className="rounded-lg border border-violet-300 bg-white px-4 py-2 text-sm font-medium text-violet-900 hover:bg-violet-100 disabled:opacity-60">
            {pending ? "Thinking…" : state.ok ? "Explain again" : "Explain this bug"}
          </button>
        </form>
      </div>
      <p className="text-sm text-slate-600">Uses this report to explain the Python code and a possible cause. Check the suggestion yourself; it does not change your report or run the code.</p>
      {state.message && <p role="alert" className="text-sm text-red-700">{state.message}</p>}
      {state.ok && (
        <div role="status" aria-live="polite">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-800">AI suggestion · not verified</p>
          <div className="mt-1 whitespace-pre-wrap break-words rounded-lg border border-violet-200 bg-white p-3 text-sm">{state.text}</div>
        </div>
      )}
    </section>
  );
}
