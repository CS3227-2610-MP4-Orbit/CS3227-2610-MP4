"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { AiPanel, aiButton } from "@/components/app/ai-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { requestDeveloperCodeImprovement, type AiActionState } from "../../ai/actions";

const initialState: AiActionState = { ok: false, message: "" };

export function ImprovementReviewContent({ review }: { review: NonNullable<AiActionState["review"]> }) {
  return <div role="status" aria-live="polite" className="grid gap-3">
    <p className="text-[11px] font-semibold tracking-wide text-violet-700 uppercase">AI suggestions · not verified</p>
    <p className="text-sm leading-relaxed whitespace-pre-wrap">{review.summary || "No summary provided."}</p>
    {review.suggestions.length === 0 ? <p className="text-sm text-muted-foreground">No clear improvement was identified.</p> : review.suggestions.map((item, index) => (
      <article key={`${item.category}-${index}`} className="min-w-0 space-y-2 rounded-lg border border-violet-200 bg-card p-4 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-violet-200 bg-violet-50 text-violet-800">{item.category}</Badge>
          <h3 className="font-medium">{item.title}</h3>
        </div>
        <p className="whitespace-pre-wrap"><span className="font-medium">Why:</span> {item.rationale}</p>
        <p className="whitespace-pre-wrap"><span className="font-medium">Benefit:</span> {item.benefit}</p>
        {item.tradeoff && <p className="whitespace-pre-wrap text-muted-foreground"><span className="font-medium text-foreground">Trade-off:</span> {item.tradeoff}</p>}
        {item.illustrativeCode && (
          <div>
            <p className="text-xs text-violet-800">Suggested text only — review before applying.</p>
            <pre className="mt-1.5 overflow-x-auto rounded-lg bg-zinc-950 p-3 font-mono text-[13px] leading-6 text-zinc-100">{item.illustrativeCode}</pre>
          </div>
        )}
      </article>
    ))}
  </div>;
}

export function DeveloperCodeImprovement({ reportId }: { reportId: string }) {
  const [state, action, pending] = useActionState(requestDeveloperCodeImprovement, initialState);
  return (
    <AiPanel headingId="code-improvement-heading" title="AI code improvement advisor"
      description="Advisory guidance on readability, maintainability, performance, SRP and DRY. No code is run or applied, and nothing is saved as a revision."
      action={<form action={action}><input type="hidden" name="reportId" value={reportId} /><Button variant="outline" size="sm" disabled={pending} className={aiButton}>{pending && <Loader2 className="animate-spin" aria-hidden="true" />}{pending ? "Reviewing…" : "Suggest code improvements"}</Button></form>}>
      {state.message && <p role="status" className="text-sm text-violet-950/80">{state.message}</p>}
      {state.review && <ImprovementReviewContent review={state.review} />}
    </AiPanel>
  );
}
