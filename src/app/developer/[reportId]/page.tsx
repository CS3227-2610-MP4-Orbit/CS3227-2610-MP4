import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { CalendarDays, ChevronRight, NotebookPen } from "lucide-react";

import { CodeBlock, DetailField } from "@/components/app/code-block";
import { PageContainer, PageHeader } from "@/components/app/page-header";
import { StatusBadge, StatusStepper } from "@/components/app/status";
import { TopBar } from "@/components/app/top-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { getAssignedDeveloperReportDetail } from "@/lib/developer/detail";
import { formatDateTime } from "@/lib/format";

import { DeveloperAiAssistant } from "./ai-assistant";
import { DeveloperCodeImprovement } from "./ai-code-improvement";
import { CodeDiff } from "./code-diff";
import { FixForm } from "./fix-form";
import { AddNoteForm, EditNoteForm, StartWorkForm } from "./note-form";
import { QaFeedback } from "./qa-feedback";
import { QaHandoff } from "./qa-handoff";

export const metadata: Metadata = { title: "Assigned bug" };

const NEXT_STEP: Record<string, string> = {
  open: "Start the investigation to begin work on this report.",
  in_progress: "Record what you find, then submit a corrected version to QA.",
  awaiting_qa: "QA is testing your latest version.",
  closed: "QA approved the fix. This report is closed.",
};

export default function DeveloperReportPage({ params }: { params: Promise<{ reportId: string }> }) {
  return (
    <Suspense fallback={<><TopBar crumbs={[{ label: "Developer" }, { label: "Assigned bugs", href: "/developer" }, { label: "Report" }]} /><PageContainer wide><p className="sr-only">Loading report…</p><Skeleton className="h-16 w-2/3" /><Skeleton className="h-96 w-full" /></PageContainer></>}>
      <DeveloperReport params={params} />
    </Suspense>
  );
}

// Reading the session uses the current time, so this renders at request time.
async function DeveloperReport({ params }: { params: Promise<{ reportId: string }> }) {
  await connection();
  const { reportId } = await params;
  const detail = await getAssignedDeveloperReportDetail(reportId);
  if (!detail) notFound();
  const { report, notes, revisions, decisions } = detail;
  const canEditNotes = report.status === "open" || report.status === "in_progress";
  const latest = revisions.at(-1);
  const rejections = decisions.filter((decision) => decision.verdict === "reject");

  return (
    <>
      <TopBar crumbs={[{ label: "Developer" }, { label: "Assigned bugs", href: "/developer" }, { label: report.title }]} />
      <PageContainer wide>
        <PageHeader eyebrow="Assigned bug" title={report.title} meta={<>
          <StatusBadge status={report.status} />
          <span className="flex items-center gap-1.5"><CalendarDays className="size-3.5" aria-hidden="true" />Reported {formatDateTime(report.created_at)}</span>
          {revisions.length > 0 && <span>{revisions.length} version{revisions.length === 1 ? "" : "s"} submitted</span>}
        </>} />

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0 space-y-6">
            {rejections.map((decision) => {
              const revision = revisions.find((item) => item.id === decision.revision_id);
              return revision ? <QaFeedback key={decision.revision_id} feedback={decision.feedback} revisionNumber={revision.revision_number} /> : null;
            })}

            <section aria-labelledby="bug-report-heading" className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
              <div className="border-b px-5 py-4"><h2 id="bug-report-heading" className="font-semibold">Bug report</h2></div>
              <div className="space-y-6 p-5">
                <div className="min-w-0"><h3 className="sr-only">Original Python code</h3><CodeBlock code={report.code} label="Original Python code" /></div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <DetailField label="Error message" value={report.error_message || "Not provided"} mono />
                  <DetailField label="Expected behaviour" value={report.expected_behavior} />
                  <DetailField label="Actual behaviour" value={report.actual_behavior || "Not provided"} />
                  <DetailField label="Reproduction steps" value={report.reproduction_steps} />
                </div>
              </div>
            </section>

            {revisions.length > 0 && (
              <section aria-labelledby="revisions-heading" className="rounded-xl bg-card ring-1 ring-foreground/10">
                <div className="border-b px-5 py-4">
                  <h2 id="revisions-heading" className="font-semibold">Revision history and comparison</h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">Each version compared with the original code. The latest is expanded.</p>
                </div>
                <div className="divide-y">
                  {[...revisions].reverse().map((revision) => {
                    const decision = decisions.find((item) => item.revision_id === revision.id);
                    return (
                      <details key={revision.id} open={revision.id === latest?.id} className="group px-5 py-3.5">
                        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm">
                          <ChevronRight aria-hidden="true" className="size-4 text-muted-foreground transition-transform group-open:rotate-90" />
                          <span className="font-medium">Revision {revision.revision_number}</span>
                          <span className="text-muted-foreground">· {formatDateTime(revision.created_at)}</span>
                          {decision && <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${decision.verdict === "approve" ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : "bg-rose-50 text-rose-800 ring-rose-200"}`}>{decision.verdict === "approve" ? "Approved by QA" : "Sent back by QA"}</span>}
                        </summary>
                        <p className="mt-3 text-sm whitespace-pre-wrap text-muted-foreground">{revision.note || "No submission note."}</p>
                        <CodeDiff original={report.code} revised={revision.code} />
                      </details>
                    );
                  })}
                </div>
              </section>
            )}

            {report.status === "in_progress" && <FixForm reportId={report.id} />}
            <DeveloperCodeImprovement reportId={report.id} />
          </div>

          <aside aria-label="Status, notes and AI help" className="min-w-0 space-y-5 lg:sticky lg:top-20">
            <section aria-labelledby="progress-heading" className="space-y-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
              <div>
                <h2 id="progress-heading" className="text-sm font-semibold">Progress</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">{NEXT_STEP[report.status] ?? ""}</p>
              </div>
              <StatusStepper status={report.status} vertical />
              {report.status === "open" && <StartWorkForm reportId={report.id} />}
              <QaHandoff status={report.status} revisionNumber={latest?.revision_number} submittedBy={latest?.author_name} submittedAt={latest?.created_at} />
            </section>

            <DeveloperAiAssistant reportId={report.id} />

            <section aria-labelledby="notes-heading" className="space-y-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
              <div className="flex items-center gap-2"><NotebookPen className="size-4 text-muted-foreground" aria-hidden="true" /><h2 id="notes-heading" className="text-sm font-semibold">Investigation notes</h2><span className="ml-auto text-xs text-muted-foreground tabular-nums">{notes.length}</span></div>
              {notes.length === 0 ? <p className="text-sm text-muted-foreground">No investigation notes yet.</p> : (
                <ul className="space-y-3">
                  {notes.map((note) => (
                    <li key={note.id} className="rounded-lg border bg-muted/30 p-3">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{note.body}</p>
                      <p className="mt-2 text-xs text-muted-foreground">Created {formatDateTime(note.created_at)}{note.updated_at !== note.created_at ? ` · Updated ${formatDateTime(note.updated_at)}` : ""}</p>
                      {canEditNotes && <EditNoteForm reportId={report.id} noteId={note.id} body={note.body} />}
                    </li>
                  ))}
                </ul>
              )}
              {canEditNotes && <AddNoteForm reportId={report.id} />}
            </section>
          </aside>
        </div>
      </PageContainer>
    </>
  );
}
