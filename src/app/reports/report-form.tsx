"use client";

import { useActionState } from "react";
import type { ReportState } from "./new/actions";
import { emptyReport, type ReportField, type ReportValues } from "@/lib/reports/validation";
import { PythonEditor } from "./python-editor";

const fields: { name: ReportField; label: string; maxLength: number; rows?: number }[] = [
  { name: "title", label: "Title", maxLength: 120 },
  { name: "error_message", label: "Error message", maxLength: 2000, rows: 4 },
  { name: "expected_behavior", label: "Expected behavior", maxLength: 2000, rows: 4 },
  { name: "actual_behavior", label: "Actual behavior", maxLength: 2000, rows: 4 },
  { name: "reproduction_steps", label: "Reproduction steps", maxLength: 2000, rows: 5 },
];

type ReportAction = (previous: ReportState, form: FormData) => Promise<ReportState>;

export function ReportForm({ action, initialValues = emptyReport, submitLabel }: {
  action: ReportAction;
  initialValues?: ReportValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, { values: initialValues, errors: {} });
  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <label className="flex flex-col gap-1 text-sm font-medium">
        Title
        <input name="title" defaultValue={state.values.title} maxLength={120} required aria-invalid={!!state.errors.title} className="rounded-xl border border-slate-300 px-3 py-2 font-normal" />
        {state.errors.title && <span role="alert" className="text-red-700">{state.errors.title}</span>}
      </label>
      <div className="space-y-1 text-sm font-medium">
        <label id="python-code-label" htmlFor="python-code">Python code</label>
        <PythonEditor id="python-code" value={state.values.python_code} maxLength={20000} invalid={!!state.errors.python_code} />
        {state.errors.python_code && <span role="alert" className="text-red-700">{state.errors.python_code}</span>}
      </div>
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
      {state.error && <p role="alert" className="text-red-700">{state.error}</p>}
      <button disabled={pending} className="self-start rounded bg-black px-4 py-2 text-white disabled:opacity-50">{pending ? "Saving…" : submitLabel}</button>
    </form>
  );
}
