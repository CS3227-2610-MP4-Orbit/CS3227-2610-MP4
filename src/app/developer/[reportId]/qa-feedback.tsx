import { MessageSquareWarning } from "lucide-react";

export function QaFeedback({ feedback, revisionNumber }: { feedback: string; revisionNumber: number }) {
  return <section className="rounded-xl border border-rose-200 bg-rose-50/70 p-4">
    <div className="flex items-center gap-2 text-rose-900">
      <MessageSquareWarning className="size-4" aria-hidden="true" />
      <h2 className="text-sm font-semibold">QA feedback for revision {revisionNumber}</h2>
    </div>
    <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-rose-950">{feedback}</p>
  </section>;
}
