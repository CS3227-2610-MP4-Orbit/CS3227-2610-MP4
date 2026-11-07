export function QaHandoff({ status, revisionNumber }: { status: string; revisionNumber?: number }) {
  if (status !== "awaiting_qa") return null;
  return <section className="rounded-xl border border-blue-200 bg-blue-50 p-5"><h2 className="font-semibold">Awaiting QA</h2><p className="mt-1 text-sm">Revision {revisionNumber ?? "selected"} has been handed to QA. Approval and rejection are performed by QA.</p></section>;
}
