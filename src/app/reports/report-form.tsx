"use client";

import { useActionState } from "react";
import type { ReportState } from "./new/actions";
import { emptyReport, type ReportField, type ReportValues } from "@/lib/reports/validation";

const fields: { name: ReportField; label: string; maxLength: number; rows?: number }[] = [
  { name: "title", label: "Title", maxLength: 120 },
  { name: "python_code", label: "Python code", maxLength: 20000, rows: 12 },
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
    <form action={formAction} className="flex max-w-3xl flex-col gap-5">
      {fields.map(({ name, label, maxLength, rows }) => (
        <label key={name} className="flex flex-col gap-1 text-sm font-medium">
          {label}
          {rows ? (
            <textarea name={name} defaultValue={state.values[name]} maxLength={maxLength} rows={rows} required aria-invalid={!!state.errors[name]} className="rounded border px-3 py-2 font-normal" />
          ) : (
            <input name={name} defaultValue={state.values[name]} maxLength={maxLength} required aria-invalid={!!state.errors[name]} className="rounded border px-3 py-2 font-normal" />
          )}
          {state.errors[name] && <span role="alert" className="text-red-700">{state.errors[name]}</span>}
        </label>
      ))}
      {state.error && <p role="alert" className="text-red-700">{state.error}</p>}
      <button disabled={pending} className="self-start rounded bg-black px-4 py-2 text-white disabled:opacity-50">{pending ? "Saving…" : submitLabel}</button>
    </form>
  );
}
