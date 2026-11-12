import { Hourglass } from "lucide-react";

import { formatDateTime } from "@/lib/format";

export function QaHandoff({ status, revisionNumber, submittedBy, submittedAt }: { status: string; revisionNumber?: number; submittedBy?: string; submittedAt?: string }) {
  if (status !== "awaiting_qa") return null;
  return <section className="rounded-lg border border-amber-200 bg-amber-50/70 p-3.5">
    <div className="flex items-center gap-2 text-amber-900"><Hourglass className="size-4" aria-hidden="true" /><h2 className="text-sm font-semibold">Awaiting QA</h2></div>
    <p className="mt-1 text-sm text-amber-950/80">Revision {revisionNumber ?? "selected"} has been handed to QA. Approval and rejection are performed by QA.</p>
    {submittedBy && <p className="mt-2 text-xs text-amber-900/70">Submitted by {submittedBy}{submittedAt ? ` on ${formatDateTime(submittedAt)}` : ""}.</p>}
  </section>;
}
