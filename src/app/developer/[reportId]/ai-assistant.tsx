"use client";
import { useActionState } from "react";
import { requestDeveloperDebuggingAdvice, type AiActionState } from "../../ai/actions";
const initialState: AiActionState = { ok: false, message: "", advice: undefined };
export function DeveloperAiAssistant({ reportId }: { reportId: string }) {
  const [state, action, pending] = useActionState(requestDeveloperDebuggingAdvice, initialState);
  return <section className="rounded-xl border border-purple-200 bg-purple-50 p-5"><h2 className="font-semibold">AI debugging advisor</h2><p className="mt-1 text-sm">Advisory text only. It does not run or apply code and treats report content as untrusted data.</p><form action={action} className="mt-3"><input type="hidden" name="reportId" value={reportId} /><button disabled={pending} className="rounded bg-purple-800 px-4 py-2 text-white">{pending ? "Thinking…" : "Get debugging guidance"}</button></form>{state.message && <p role="status" className="mt-3 text-sm">{state.message}</p>}{state.advice && <pre className="mt-3 whitespace-pre-wrap rounded bg-white p-3 text-sm">{state.advice}</pre>}</section>;
}
