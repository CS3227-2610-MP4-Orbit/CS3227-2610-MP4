"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { AiOutput, AiPanel, aiButton } from "@/components/app/ai-panel";
import { Notice } from "@/components/app/notice";
import { Button } from "@/components/ui/button";

import type { ExplanationState } from "./ai-actions";

const initialState: ExplanationState = { ok: false, text: "", message: "" };

export function AiExplanation({ action }: { action: (previous: ExplanationState) => Promise<ExplanationState> }) {
  const [state, formAction, pending] = useActionState(action, initialState);
  return (
    <AiPanel id="report-ai" headingId="report-ai-heading" title="AI code explanation"
      description="Uses this report to explain the Python code and a possible cause. Check the suggestion yourself; it does not change your report or run the code."
      action={<form action={formAction}><Button variant="outline" size="sm" disabled={pending} className={aiButton}>{pending && <Loader2 className="animate-spin" aria-hidden="true" />}{pending ? "Thinking…" : state.ok ? "Explain again" : "Explain this bug"}</Button></form>}>
      {state.message && <Notice tone="error">{state.message}</Notice>}
      {state.ok && <AiOutput label="AI suggestion · not verified">{state.text}</AiOutput>}
    </AiPanel>
  );
}
