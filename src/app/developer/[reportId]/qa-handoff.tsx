export function QaHandoff({ status, revisionNumber, submittedBy, submittedAt }: { status: string; revisionNumber?: number; submittedBy?: string; submittedAt?: string }) {
  if (status !== "awaiting_qa") return null;
  return <section className="rounded-xl border border-blue-200 bg-blue-50 p-5"><h2 className="font-semibold">Awaiting QA</h2><p className="mt-1 text-sm">Revision {revisionNumber ?? "selected"} has been handed to QA. Approval and rejection are performed by QA.</p>{submittedBy && <p className="mt-2 text-xs text-blue-900">Submitted by {submittedBy}{submittedAt ? ` on ${new Date(submittedAt).toLocaleString()}` : ""}.</p>}</section>;
}
