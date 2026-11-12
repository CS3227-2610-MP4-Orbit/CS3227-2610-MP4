"use client";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { AiOutput, AiPanel, aiButton } from "@/components/app/ai-panel";
import { Button } from "@/components/ui/button";

import { requestDeveloperDebuggingAdvice, type AiActionState } from "../../ai/actions";

const initialState: AiActionState = { ok: false, message: "", advice: undefined };

export function DeveloperAiAssistant({ reportId }: { reportId: string }) {
  const [state, action, pending] = useActionState(requestDeveloperDebuggingAdvice, initialState);
  return (
    <AiPanel headingId="debug-advisor-heading" title="AI debugging advisor" description="Advisory text only. It does not run or apply code and treats report content as untrusted data.">
      <form action={action}>
        <input type="hidden" name="reportId" value={reportId} />
        <Button variant="outline" size="sm" disabled={pending} className={aiButton}>{pending && <Loader2 className="animate-spin" aria-hidden="true" />}{pending ? "Thinking…" : "Get debugging guidance"}</Button>
      </form>
      {state.message && <p role="status" className="text-sm text-violet-950/80">{state.message}</p>}
      {state.advice && <AiOutput label="AI guidance · not verified">{state.advice}</AiOutput>}
    </AiPanel>
  );
}
