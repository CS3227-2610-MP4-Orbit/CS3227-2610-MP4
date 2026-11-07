"use client";

import { useActionState } from "react";

import { FEEDBACK_MAX } from "@/lib/qa/validation";

import { type AiSuggestionState, emptyState, emptySuggestion, type QaActionState } from "./state";

type Action = (previous: QaActionState, form: FormData) => Promise<QaActionState>;

const input = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-blue-600";

function Field({ name, label, state, rows = 2 }: { name: string; label: string; state: QaActionState; rows?: number }) {
  const error = state.errors[name];
  return (
    <label className="block text-sm font-medium text-slate-800">
      {label}
      <textarea name={name} rows={rows} defaultValue={state.values[name] ?? ""} aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined} className={input} />
      {error && <span id={`${name}-error`} className="mt-1 block text-sm text-red-700">{error}</span>}
    </label>
  );
}

function Status({ state }: { state: QaActionState }) {
  if (!state.message) return null;
  return <p role={state.ok ? "status" : "alert"} className={state.ok ? "text-sm text-green-700" : "text-sm text-red-700"}>{state.message}</p>;
}

export function TestCaseForm({ action, revisionId }: { action: Action; revisionId: string }) {
  const [state, formAction, pending] = useActionState(action, emptyState);
  return (
    // React resets an action form to its defaultValues after submitting: blank after a save,
    // the typed values after an error (the action returns them).
    <form action={formAction} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="font-semibold">Record a test case</h3>
      <input type="hidden" name="revisionId" value={revisionId} />
      <Field name="description" label="What you tested" state={state} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="expectedResult" label="Expected result" state={state} />
        <Field name="actualResult" label="Actual result" state={state} />
      </div>
      <fieldset>
        <legend className="text-sm font-medium text-slate-800">Outcome</legend>
        <div className="mt-1 flex gap-4 text-sm">
          {(["pass", "fail"] as const).map((outcome) => (
            <label key={outcome} className="flex items-center gap-2 capitalize">
              <input type="radio" name="outcome" value={outcome} defaultChecked={state.values.outcome === outcome} /> {outcome}
            </label>
          ))}
        </div>
        {state.errors.outcome && <p className="mt-1 text-sm text-red-700">{state.errors.outcome}</p>}
      </fieldset>
      <div className="flex items-center gap-3">
        <button disabled={pending} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60">
          {pending ? "Saving…" : "Save test"}
        </button>
        <Status state={state} />
      </div>
    </form>
  );
}

export function DecisionForm({ action, revisionId, revisionNumber }: { action: Action; revisionId: string; revisionNumber: number }) {
  const [state, formAction, pending] = useActionState(action, emptyState);
  return (
    <form action={formAction} className="space-y-3 rounded-xl border border-blue-200 bg-blue-50/40 p-4">
      <h3 className="font-semibold">Decide version {revisionNumber}</h3>
      <input type="hidden" name="revisionId" value={revisionId} />
      <label className="block text-sm font-medium text-slate-800">
        Feedback for the Developer and Reporter <span className="font-normal text-slate-600">(required when rejecting)</span>
        <textarea name="feedback" rows={3} maxLength={FEEDBACK_MAX} defaultValue={state.values.feedback ?? ""}
          aria-invalid={!!state.errors.feedback} aria-describedby={state.errors.feedback ? "feedback-error" : undefined} className={input} />
        {state.errors.feedback && <span id="feedback-error" className="mt-1 block text-sm text-red-700">{state.errors.feedback}</span>}
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button name="verdict" value="approve" disabled={pending} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60">
          Approve and close
        </button>
        <button name="verdict" value="reject" disabled={pending} className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-medium text-white hover:bg-rose-800 disabled:opacity-60">
          Reject and return to Developer
        </button>
        <Status state={state} />
      </div>
    </form>
  );
}

/** QA's AI feature: suggestions are plain text, clearly labelled, and never recorded or run. */
export function TestSuggestions({ action }: { action: (previous: AiSuggestionState) => Promise<AiSuggestionState> }) {
  const [state, formAction, pending] = useActionState(action, emptySuggestion);
  return (
    <section aria-labelledby="ai-heading" className="space-y-3 rounded-xl border border-violet-200 bg-violet-50/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id="ai-heading" className="font-semibold">AI test ideas</h3>
        <form action={formAction}>
          <button disabled={pending} className="rounded-lg border border-violet-300 bg-white px-4 py-2 text-sm font-medium text-violet-900 hover:bg-violet-100 disabled:opacity-60">
            {pending ? "Thinking…" : state.ok ? "Suggest again" : "Suggest test cases"}
          </button>
        </form>
      </div>
      <p className="text-sm text-slate-600">Uses the report and the latest fix. Suggestions can be wrong: run the ones you choose and record your own results.</p>
      {state.message && <p role="alert" className="text-sm text-red-700">{state.message}</p>}
      {state.ok && (
        <div role="status" aria-live="polite">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-800">AI suggestion · not checked</p>
          <div className="mt-1 whitespace-pre-wrap break-words rounded-lg border border-violet-200 bg-white p-3 text-sm">{state.text}</div>
        </div>
      )}
    </section>
  );
}
