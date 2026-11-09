"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import type { ReportState } from "./new/actions";
import type { QualityCheckResult } from "./new/check-quality";
import { emptyReport, type ReportField, type ReportValues } from "../../lib/reports/validation";
import { PythonEditor } from "./python-editor";

const fields: { name: ReportField; label: string; maxLength: number; rows?: number }[] = [
  { name: "title", label: "Title", maxLength: 120 },
  { name: "error_message", label: "Error message", maxLength: 2000, rows: 4 },
  { name: "expected_behavior", label: "Expected behavior", maxLength: 2000, rows: 4 },
  { name: "actual_behavior", label: "Actual behavior", maxLength: 2000, rows: 4 },
  { name: "reproduction_steps", label: "Reproduction steps", maxLength: 2000, rows: 5 },
];

type ReportAction = (previous: ReportState, form: FormData) => Promise<ReportState>;

export function ReportForm({ action, initialValues = emptyReport, submitLabel, qualityCheck }: {
  action: ReportAction;
  initialValues?: ReportValues;
  submitLabel: string;
  qualityCheck?: (form: FormData) => Promise<QualityCheckResult>;
}) {
  const [state, formAction, pending] = useActionState(action, { values: initialValues, errors: {} });
  const formRef = useRef<HTMLFormElement>(null);
  const revision = useRef(0);
  const [checking, startChecking] = useTransition();
  const [suggestion, setSuggestion] = useState("");
  const [checkError, setCheckError] = useState("");
  const [stale, setStale] = useState(false);
  const markChanged = () => { revision.current += 1; if (suggestion) setStale(true); };
  const requestCheck = () => {
    if (!qualityCheck || !formRef.current) return;
    const form = new FormData(formRef.current);
    const requestedRevision = revision.current;
    setCheckError("");
    startChecking(async () => {
      try {
        const result = await qualityCheck(form);
        if (result.ok) {
          setSuggestion(result.text);
          setStale(revision.current !== requestedRevision);
          setCheckError("");
        } else {
          setCheckError(result.message);
        }
      } catch {
        setCheckError("The quality check is unavailable right now. Try again later.");
      }
    });
  };
  return (
    <form ref={formRef} action={formAction} onInput={markChanged} className="grid min-w-0 gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 xl:grid-cols-2 xl:items-start">
      <label className="flex flex-col gap-1 text-sm font-medium xl:col-span-2">
        Title
        <input name="title" defaultValue={state.values.title} maxLength={120} required aria-invalid={!!state.errors.title} className="rounded-xl border border-slate-300 px-3 py-2 font-normal" />
        {state.errors.title && <span role="alert" className="text-red-700">{state.errors.title}</span>}
      </label>
      <div className="min-w-0 space-y-1 text-sm font-medium">
        <label id="python-code-label" htmlFor="python-code">Python code</label>
        <PythonEditor id="python-code" value={state.values.python_code} maxLength={20000} invalid={!!state.errors.python_code} onValueChange={markChanged} />
        {state.errors.python_code && <span role="alert" className="text-red-700">{state.errors.python_code}</span>}
      </div>
      <div className="grid min-w-0 gap-4">
      {fields.filter((field) => field.name !== "title").map(({ name, label, maxLength, rows }) => (
        <label key={name} className="flex flex-col gap-1 text-sm font-medium">
          {label}
          {rows ? (
            <textarea name={name} defaultValue={state.values[name]} maxLength={maxLength} rows={rows} required aria-invalid={!!state.errors[name]} className="rounded-xl border border-slate-300 px-3 py-2 font-normal" />
          ) : (
            <input name={name} defaultValue={state.values[name]} maxLength={maxLength} required aria-invalid={!!state.errors[name]} className="rounded-xl border border-slate-300 px-3 py-2 font-normal" />
          )}
          {state.errors[name] && <span role="alert" className="text-red-700">{state.errors[name]}</span>}
        </label>
      ))}
      </div>
      {state.error && <p role="alert" className="text-red-700 xl:col-span-2">{state.error}</p>}
      {qualityCheck && <div className="space-y-3 xl:col-span-2">
        <button type="button" onClick={requestCheck} disabled={checking} className="rounded border border-blue-700 px-4 py-2 font-medium text-blue-700 disabled:opacity-50">{checking ? "Checking…" : "Check my report"}</button>
        <p className="text-sm text-slate-600">Optional AI feedback. Your draft stays as written until you edit or submit it.</p>
        {suggestion && <section aria-label="AI suggestion" className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm">
          <h2 className="font-semibold text-blue-950">AI suggestion</h2>
          {stale && <p className="mt-1 font-medium text-amber-800">This suggestion is based on an earlier draft. Check again for updated feedback.</p>}
          <p className="mt-2 whitespace-pre-wrap text-slate-800">{suggestion}</p>
        </section>}
        {checkError && <p role="alert" className="text-sm text-red-700">{checkError}</p>}
      </div>}
      <button type="submit" disabled={pending} className="w-fit rounded bg-black px-4 py-2 text-white disabled:opacity-50 xl:col-span-2">{pending ? "Saving…" : submitLabel}</button>
    </form>
  );
}
