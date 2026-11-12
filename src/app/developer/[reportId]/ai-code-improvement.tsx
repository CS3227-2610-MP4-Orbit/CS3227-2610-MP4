"use client";

import { useActionState } from "react";

import { requestDeveloperCodeImprovement, type AiActionState } from "../../ai/actions";

const initialState: AiActionState = { ok: false, message: "" };

export function ImprovementReviewContent({ review }: { review: NonNullable<AiActionState["review"]> }) {
  return <div className="mt-4 grid gap-4">
    <p className="whitespace-pre-wrap text-sm">{review.summary || "No summary provided."}</p>
    {review.suggestions.length === 0 ? <p className="text-sm">No clear improvement was identified.</p> : review.suggestions.map((item, index) => (
      <article key={`${item.category}-${index}`} className="rounded border border-blue-200 bg-white p-4">
        <h3 className="font-medium">{item.title}</h3>
        <p className="mt-1 text-xs font-semibold uppercase text-blue-800">{item.category}</p>
        <p className="mt-2 whitespace-pre-wrap text-sm"><strong>Why:</strong> {item.rationale}</p>
        <p className="mt-2 whitespace-pre-wrap text-sm"><strong>Benefit:</strong> {item.benefit}</p>
        {item.tradeoff && <p className="mt-2 whitespace-pre-wrap text-sm"><strong>Trade-off:</strong> {item.tradeoff}</p>}
        {item.illustrativeCode && <pre className="mt-2 overflow-x-auto rounded bg-gray-100 p-3 text-sm">Suggested text only — review before applying.{"\n\n"}{item.illustrativeCode}</pre>}
      </article>
    ))}
  </div>;
}

export function DeveloperCodeImprovement({ reportId }: { reportId: string }) {
  const [state, action, pending] = useActionState(requestDeveloperCodeImprovement, initialState);
  return <section className="rounded-xl border border-blue-200 bg-blue-50 p-5">
    <h2 className="font-semibold">AI code improvement advisor</h2>
    <p className="mt-1 text-sm">ADVISORY GUIDANCE — review manually; no code was run or applied. Nothing is saved as a revision.</p>
    <form action={action} className="mt-3">
      <input type="hidden" name="reportId" value={reportId} />
      <button disabled={pending} className="rounded bg-blue-800 px-4 py-2 text-white">{pending ? "Reviewing…" : "Suggest code improvements"}</button>
    </form>
    {state.message && <p role="status" className="mt-3 text-sm">{state.message}</p>}
    {state.review && <ImprovementReviewContent review={state.review} />}
  </section>;
}
