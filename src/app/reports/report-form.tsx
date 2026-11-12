"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { Loader2, TriangleAlert } from "lucide-react";

import { AiOutput, AiPanel, aiButton } from "@/components/app/ai-panel";
import { Notice } from "@/components/app/notice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import type { ReportState } from "./new/actions";
import type { QualityCheckResult } from "./new/check-quality";
import { emptyReport, type ReportField, type ReportValues } from "../../lib/reports/validation";
import { PythonEditor } from "./python-editor";

const fields: { name: ReportField; label: string; hint: string; maxLength: number; rows?: number }[] = [
  { name: "title", label: "Title", hint: "", maxLength: 120 },
  { name: "error_message", label: "Error message", hint: "Paste the traceback, or write “No error” if the result is just wrong.", maxLength: 2000, rows: 3 },
  { name: "expected_behavior", label: "Expected behavior", hint: "What should the code do?", maxLength: 2000, rows: 3 },
  { name: "actual_behavior", label: "Actual behavior", hint: "What does it do instead?", maxLength: 2000, rows: 3 },
  { name: "reproduction_steps", label: "Reproduction steps", hint: "Numbered steps someone else can follow.", maxLength: 2000, rows: 4 },
];

const fieldError = "text-xs font-normal text-destructive";

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
    <form ref={formRef} action={formAction} onInput={markChanged} className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      <div className="border-b p-5 sm:p-6">
        <label className="grid gap-2 text-sm font-medium">
          Title
          <Input name="title" defaultValue={state.values.title} maxLength={120} required aria-invalid={!!state.errors.title} placeholder="e.g. average() crashes on an empty list" className="h-10 text-base font-normal md:text-sm" />
          {state.errors.title && <span role="alert" className={fieldError}>{state.errors.title}</span>}
        </label>
      </div>
      <div className="grid min-w-0 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-2 border-b p-5 text-sm font-medium sm:p-6 xl:border-r xl:border-b-0">
          <div className="flex items-baseline justify-between gap-3">
            <label id="python-code-label" htmlFor="python-code">Python code</label>
            <span className="text-xs font-normal text-muted-foreground">Stored as text, never run</span>
          </div>
          <PythonEditor id="python-code" value={state.values.python_code} maxLength={20000} invalid={!!state.errors.python_code} onValueChange={markChanged} />
          {state.errors.python_code && <span role="alert" className={fieldError}>{state.errors.python_code}</span>}
        </div>
        <div className="grid min-w-0 content-start gap-5 p-5 sm:p-6">
          {fields.filter((field) => field.name !== "title").map(({ name, label, hint, maxLength, rows }) => (
            <label key={name} className="grid gap-1.5 text-sm font-medium">
              {label}
              <Textarea name={name} defaultValue={state.values[name]} maxLength={maxLength} rows={rows} required aria-invalid={!!state.errors[name]} className="min-h-20 font-normal" />
              {state.errors[name] ? <span role="alert" className={fieldError}>{state.errors[name]}</span> : <span className="text-xs font-normal text-muted-foreground">{hint}</span>}
            </label>
          ))}
        </div>
      </div>
      {qualityCheck && (
        <div className="border-t p-5 sm:p-6">
          <AiPanel as="div" headingId="quality-check-heading" title="Check my report with AI" description="Optional AI feedback. Your draft stays as written until you edit or submit it."
            action={<Button type="button" variant="outline" onClick={requestCheck} disabled={checking} className={aiButton}>{checking && <Loader2 className="animate-spin" aria-hidden="true" />}{checking ? "Checking…" : "Check my report"}</Button>}>
            {suggestion && (
              <section aria-label="AI suggestion" className="space-y-2">
                {stale && <p className="flex items-center gap-1.5 text-xs font-medium text-amber-800"><TriangleAlert className="size-3.5" aria-hidden="true" />This suggestion is based on an earlier draft. Check again for updated feedback.</p>}
                <AiOutput label="AI suggestion · not verified">{suggestion}</AiOutput>
              </section>
            )}
            {checkError && <Notice tone="error">{checkError}</Notice>}
          </AiPanel>
        </div>
      )}
      <div className={cn("flex flex-wrap items-center justify-between gap-3 border-t bg-muted/40 px-5 py-4 sm:px-6")}>
        <p className="text-xs text-muted-foreground">All fields are required. Keep the snippet small enough to reproduce the bug.</p>
        {state.error && <Notice tone="error" className="w-full">{state.error}</Notice>}
        <Button type="submit" disabled={pending} size="lg" className="ml-auto">{pending && <Loader2 className="animate-spin" aria-hidden="true" />}{pending ? "Saving…" : submitLabel}</Button>
      </div>
    </form>
  );
}
