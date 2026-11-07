export function QaFeedback({ feedback, revisionNumber }: { feedback: string; revisionNumber: number }) {
  return <section className="rounded-xl border border-red-200 bg-red-50 p-5"><h2 className="font-semibold">QA feedback for revision {revisionNumber}</h2><p className="mt-2 whitespace-pre-wrap text-sm">{feedback}</p></section>;
}
