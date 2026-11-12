"use client";

import { useActionState, useRef, useState } from "react";
import { Check, CircleCheck, CircleX, Loader2, Undo2 } from "lucide-react";

import { AiOutput, AiPanel, aiButton } from "@/components/app/ai-panel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { draftView } from "@/lib/qa/feedback-draft";
import { FEEDBACK_MAX } from "@/lib/qa/validation";
import { cn } from "@/lib/utils";

import { type AiSuggestionState, emptyState, emptySuggestion, type QaActionState } from "./state";

type Action = (previous: QaActionState, form: FormData) => Promise<QaActionState>;
type SuggestAction = (previous: AiSuggestionState) => Promise<AiSuggestionState>;

function Field({ name, label, state, rows = 2, placeholder }: { name: string; label: string; state: QaActionState; rows?: number; placeholder?: string }) {
  const error = state.errors[name];
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      {label}
      <Textarea name={name} rows={rows} defaultValue={state.values[name] ?? ""} aria-invalid={!!error} placeholder={placeholder}
        aria-describedby={error ? `${name}-error` : undefined} className="min-h-16 font-normal" />
      {error && <span id={`${name}-error`} className="text-xs font-normal text-destructive">{error}</span>}
    </label>
  );
}

function Status({ state }: { state: QaActionState }) {
  if (!state.message) return null;
  return <p role={state.ok ? "status" : "alert"} className={cn("flex items-center gap-1.5 text-sm", state.ok ? "text-emerald-700" : "text-destructive")}>{state.ok && <Check className="size-4" aria-hidden="true" />}{state.message}</p>;
}

const OUTCOME_STYLE = {
  pass: { icon: CircleCheck, checked: "has-checked:border-emerald-300 has-checked:bg-emerald-50 has-checked:text-emerald-800" },
  fail: { icon: CircleX, checked: "has-checked:border-rose-300 has-checked:bg-rose-50 has-checked:text-rose-800" },
} as const;

export function TestCaseForm({ action, revisionId }: { action: Action; revisionId: string }) {
  const [state, formAction, pending] = useActionState(action, emptyState);
  return (
    // React resets an action form to its defaultValues after submitting: blank after a save,
    // the typed values after an error (the action returns them).
    <form action={formAction} className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      <div className="border-b px-4 py-3">
        <h3 className="text-sm font-semibold">Record a test case</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">What you ran against this version, and what happened.</p>
      </div>
      <div className="grid gap-4 p-4">
        <input type="hidden" name="revisionId" value={revisionId} />
        <Field name="description" label="What you tested" state={state} placeholder="e.g. Even-length list [1, 2, 3, 4]" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="expectedResult" label="Expected result" state={state} />
          <Field name="actualResult" label="Actual result" state={state} />
        </div>
        <fieldset>
          <legend className="text-sm font-medium">Outcome</legend>
          <div className="mt-1.5 flex gap-2 text-sm">
            {(["pass", "fail"] as const).map((outcome) => {
              const { icon: Icon, checked } = OUTCOME_STYLE[outcome];
              return (
                <label key={outcome} className={cn("flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 font-medium text-muted-foreground capitalize transition-colors hover:bg-muted has-focus-visible:ring-3 has-focus-visible:ring-ring/50", checked)}>
                  <input type="radio" name="outcome" value={outcome} defaultChecked={state.values.outcome === outcome} className="sr-only" />
                  <Icon className="size-4" aria-hidden="true" /> {outcome}
                </label>
              );
            })}
          </div>
          {state.errors.outcome && <p className="mt-1.5 text-xs text-destructive">{state.errors.outcome}</p>}
        </fieldset>
      </div>
      <div className="flex items-center gap-3 border-t bg-muted/40 px-4 py-3">
        <Button disabled={pending}>{pending && <Loader2 className="animate-spin" aria-hidden="true" />}{pending ? "Saving…" : "Save test"}</Button>
        <Status state={state} />
      </div>
    </form>
  );
}

export function DecisionForm({ action, draftAction, revisionId, revisionNumber, testsKey }: {
  action: Action; draftAction: SuggestAction; revisionId: string; revisionNumber: number;
  /** Changes whenever the recorded tests change, so a draft based on older results is hidden. */
  testsKey: string;
}) {
  const [state, formAction, pending] = useActionState(action, emptyState);
  // Controlled, so a draft can be placed in it and the form reset after an error keeps the text.
  const [feedback, setFeedback] = useState("");
  const [notice, setNotice] = useState("");
  const box = useRef<HTMLTextAreaElement>(null);

  // A draft never silently replaces what the tester wrote: it fills an empty box, or is added below.
  function applyDraft(text: string) {
    const kept = feedback.trim();
    setFeedback(kept ? `${kept}\n\n${text}` : text);
    setNotice(kept ? "Draft added below your feedback." : "Draft placed in the feedback box.");
    box.current?.focus();
  }

  return (
    <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      <div className="border-b px-4 py-3">
        <h3 className="text-sm font-semibold">Decide version {revisionNumber}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">Approving closes the report. Sending it back reopens it for the Developer with your feedback.</p>
      </div>
      <div className="p-4 pb-0"><FeedbackDraft action={draftAction} testsKey={testsKey} onUse={applyDraft} /></div>
      <form action={formAction}>
        <div className="space-y-2 p-4">
          <input type="hidden" name="revisionId" value={revisionId} />
          <label className="grid gap-1.5 text-sm font-medium">
            <span>Feedback for the Developer and Reporter <span className="font-normal text-muted-foreground">(required when rejecting)</span></span>
            <Textarea ref={box} name="feedback" rows={5} maxLength={FEEDBACK_MAX} value={feedback}
              onChange={(event) => { setFeedback(event.target.value); setNotice(""); }}
              aria-invalid={!!state.errors.feedback} aria-describedby={state.errors.feedback ? "feedback-error" : undefined} className="min-h-28 font-normal" />
            {state.errors.feedback && <span id="feedback-error" className="text-xs font-normal text-destructive">{state.errors.feedback}</span>}
          </label>
          <div className="flex justify-between gap-3 text-xs text-muted-foreground">
            <p role="status" className="text-violet-800">{notice}</p>
            <span className="tabular-nums">{feedback.length.toLocaleString()} / {FEEDBACK_MAX.toLocaleString()}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t bg-muted/40 px-4 py-3">
          <Button name="verdict" value="approve" disabled={pending} className="bg-emerald-600 text-white hover:bg-emerald-700">
            <CircleCheck aria-hidden="true" />Approve and close
          </Button>
          <Button name="verdict" value="reject" disabled={pending} variant="outline" className="border-rose-300 text-rose-700 hover:bg-rose-50 hover:text-rose-800">
            <Undo2 aria-hidden="true" />Reject and return to Developer
          </Button>
          <Status state={state} />
        </div>
      </form>
    </div>
  );
}

/**
 * QA's second AI feature: a feedback draft from the recorded tests. It stays a labelled
 * suggestion until the tester chooses "Use this draft", which only fills the box; the tester can
 * still edit it, and nothing is sent until they decide.
 */
function FeedbackDraft({ action, testsKey, onUse }: { action: SuggestAction; testsKey: string; onUse: (text: string) => void }) {
  const [state, formAction, pending] = useActionState(action, emptySuggestion);
  const view = draftView(state, testsKey);
  return (
    <AiPanel level={4} headingId="draft-heading" title="AI feedback draft" description="Uses only the tests recorded on this version. Check it against your results before you send it."
      action={<form action={formAction}><Button variant="outline" size="sm" disabled={pending} className={aiButton}>{pending && <Loader2 className="animate-spin" aria-hidden="true" />}{pending ? "Drafting…" : state.ok ? "Draft again" : "Draft from my test results"}</Button></form>}>
      {state.message && <p role="alert" className="text-sm text-destructive">{state.message}</p>}
      {view === "stale" && <p role="status" className="text-sm text-muted-foreground">Your recorded tests changed after this draft, so it is hidden. Draft again for one based on the current results.</p>}
      {view === "show" && (
        <div className="space-y-2.5">
          <AiOutput label="AI draft · not checked">{state.text}</AiOutput>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Button type="button" size="sm" onClick={() => onUse(state.text)} aria-describedby="draft-use-hint" className="bg-violet-600 text-white hover:bg-violet-700">Use this draft</Button>
            <span id="draft-use-hint" className="text-xs text-muted-foreground">Fills the feedback box, or adds below what you wrote. Read and edit it before deciding.</span>
          </div>
        </div>
      )}
    </AiPanel>
  );
}

/** QA's AI feature: suggestions are plain text, clearly labelled, and never recorded or run. */
export function TestSuggestions({ action }: { action: SuggestAction }) {
  const [state, formAction, pending] = useActionState(action, emptySuggestion);
  return (
    <AiPanel level={3} headingId="ai-heading" title="AI test ideas" description="Uses the report and the latest fix. Suggestions can be wrong: run the ones you choose and record your own results."
      action={<form action={formAction}><Button variant="outline" size="sm" disabled={pending} className={aiButton}>{pending && <Loader2 className="animate-spin" aria-hidden="true" />}{pending ? "Thinking…" : state.ok ? "Suggest again" : "Suggest test cases"}</Button></form>}>
      {state.message && <p role="alert" className="text-sm text-destructive">{state.message}</p>}
      {state.ok && <AiOutput label="AI suggestion · not checked">{state.text}</AiOutput>}
    </AiPanel>
  );
}
