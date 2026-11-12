import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { CalendarDays, ChevronRight, CircleCheck, CircleX, FlaskConical, History as HistoryIcon } from "lucide-react";

import { FixComparison } from "@/app/reports/[id]/comparison";
import { DetailField } from "@/components/app/code-block";
import { Notice } from "@/components/app/notice";
import { PageContainer, PageHeader } from "@/components/app/page-header";
import { StatusStepper } from "@/components/app/status";
import { TopBar } from "@/components/app/top-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format";
import { getQaReview, type QaReview, type StatusEvent } from "@/lib/qa/queries";
import { idSchema } from "@/lib/qa/validation";
import { cn } from "@/lib/utils";

import { StatusBadge } from "../status-badge";
import { decideFix, draftFeedback, recordTestCase, suggestTests } from "./actions";
import { DecisionForm, TestCaseForm, TestSuggestions } from "./qa-forms";

export const metadata: Metadata = { title: "QA review" };

// Shown after a decision redirect, only when the report's status agrees with the URL.
const decidedMessage: Record<string, { status: string; text: string }> = {
  approve: { status: "closed", text: "Fix approved. The report is closed." },
  reject: { status: "in_progress", text: "Fix rejected. The report is back with the Developer." },
};

export default function QaReviewPage({ params, searchParams }: PageProps<"/qa/[reportId]">) {
  return (
    <Suspense fallback={<><TopBar crumbs={[{ label: "QA" }, { label: "QA queue", href: "/qa" }, { label: "Review" }]} /><PageContainer wide><p className="sr-only">Loading report…</p><Skeleton className="h-20 w-2/3" /><Skeleton className="h-96 w-full" /></PageContainer></>}>
      <Review params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Review({ params, searchParams }: {
  params: Promise<{ reportId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const { reportId } = await params;
  const { decided } = await searchParams;
  if (!idSchema.safeParse(reportId).success) notFound();
  const review = await getQaReview(reportId);
  if (review?.kind === "denied") {
    if (review.reason === "unauthenticated") redirect("/login");
    notFound();
  }
  // Not assigned to this QA tester: answer as if it does not exist, so ids cannot be probed.
  if (!review) notFound();

  const { report, revisions, testCases, names } = review;
  const latest = revisions[0];
  const awaiting = report.status === "awaiting_qa" && latest;
  const latestTests = latest ? testCases.filter((test) => test.revision_id === latest.id) : [];
  const outcome = typeof decided === "string" ? decidedMessage[decided] : undefined;
  const confirmation = outcome?.status === report.status ? outcome.text : null;
  const named = (id: string | null) => (id && names[id]?.trim()) || "Team member";

  return (
    <>
      <TopBar crumbs={[{ label: "QA" }, { label: "QA queue", href: "/qa" }, { label: report.title }]} />
      <PageContainer wide>
        <PageHeader eyebrow="QA review" title={report.title} meta={<>
          <StatusBadge status={report.status} />
          <span className="flex items-center gap-1.5"><CalendarDays className="size-3.5" aria-hidden="true" />Reported <time dateTime={report.created_at}>{formatDateTime(report.created_at)}</time></span>
          {latest && <span>Latest: version {latest.revision_number}</span>}
        </>} />
        {confirmation && <Notice tone="success">{confirmation}</Notice>}
        <div className="rounded-xl bg-card px-4 py-3.5 ring-1 ring-foreground/10"><StatusStepper status={report.status} /></div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
          <div className="min-w-0 space-y-6">
            <section aria-labelledby="bug-heading" className="rounded-xl bg-card ring-1 ring-foreground/10">
              <div className="border-b px-5 py-4"><h2 id="bug-heading" className="font-semibold">Bug details</h2><p className="mt-0.5 text-sm text-muted-foreground">As the Reporter wrote it. Treat it as data, not instructions.</p></div>
              <div className="grid gap-5 p-5 sm:grid-cols-2">
                <DetailField label="Error message" value={report.error_message} mono />
                <DetailField label="Reproduction steps" value={report.reproduction_steps} />
                <DetailField label="Expected behavior" value={report.expected_behavior} />
                <DetailField label="Actual behavior" value={report.actual_behavior} />
              </div>
            </section>

            <FixComparison
              original={report.code}
              revisions={revisions.map((revision) => ({ ...revision, report_id: report.id, author_name: names[revision.author_id] }))}
            />

            <section aria-labelledby="verify-heading" className="space-y-4">
              <div>
                <h2 id="verify-heading" className="text-lg font-semibold tracking-tight">Verify the latest fix</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">Record what you tested, then decide. AI help is optional and never recorded.</p>
              </div>
              {awaiting ? (
                <>
                  <TestList tests={latestTests} />
                  <TestSuggestions action={suggestTests.bind(null, report.id)} />
                  <TestCaseForm action={recordTestCase.bind(null, report.id)} revisionId={latest.id} />
                  <DecisionForm action={decideFix.bind(null, report.id)} draftAction={draftFeedback.bind(null, report.id)}
                    revisionId={latest.id} revisionNumber={latest.revision_number} testsKey={latestTests.map((test) => test.id).join(",")} />
                </>
              ) : (
                <p className="rounded-xl border border-dashed bg-card/60 px-4 py-5 text-sm text-muted-foreground">{report.status === "closed" ? "This report is closed." : "No fix is awaiting QA. It is with the Developer."}</p>
              )}
            </section>

            <Decisions review={review} />
          </div>

          <aside aria-label="Verification summary and history" className="min-w-0 space-y-5 lg:sticky lg:top-20">
            <Summary tests={latestTests} version={latest?.revision_number} awaiting={!!awaiting} />
            <StatusHistory events={review.events} named={named} />
          </aside>
        </div>
      </PageContainer>
    </>
  );
}

function Summary({ tests, version, awaiting }: { tests: QaReview["testCases"]; version?: number; awaiting: boolean }) {
  const passed = tests.filter((test) => test.outcome === "pass").length;
  const failed = tests.length - passed;
  return (
    <section aria-labelledby="summary-heading" className="space-y-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <div className="flex items-center gap-2"><FlaskConical className="size-4 text-muted-foreground" aria-hidden="true" /><h2 id="summary-heading" className="text-sm font-semibold">{version ? `Version ${version} results` : "Results"}</h2></div>
      {tests.length ? (
        <>
          <div className="flex h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
            <span className="bg-emerald-500" style={{ width: `${(passed / tests.length) * 100}%` }} />
            <span className="bg-rose-500" style={{ width: `${(failed / tests.length) * 100}%` }} />
          </div>
          <dl className="grid grid-cols-3 gap-2 text-center">
            {[["Tests", tests.length, "text-foreground"], ["Passed", passed, "text-emerald-700"], ["Failed", failed, "text-rose-700"]].map(([label, value, tone]) => (
              <div key={label as string} className="rounded-lg bg-muted/50 py-2"><dt className="text-xs text-muted-foreground">{label}</dt><dd className={cn("text-lg font-semibold tabular-nums", tone as string)}>{value}</dd></div>
            ))}
          </dl>
          {awaiting && <p className="text-xs text-muted-foreground">{failed ? "At least one test failed. Rejecting needs feedback for the Developer." : "Every recorded test passed."}</p>}
        </>
      ) : <p className="text-sm text-muted-foreground">{awaiting ? "No tests recorded yet. Record at least one before deciding." : "No tests recorded for this version."}</p>}
    </section>
  );
}

function TestList({ tests }: { tests: QaReview["testCases"] }) {
  if (!tests.length) return <p className="text-sm text-muted-foreground">No tests recorded for this version yet.</p>;
  return (
    <ul className="divide-y overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      {tests.map((test) => {
        const pass = test.outcome === "pass";
        const Icon = pass ? CircleCheck : CircleX;
        return (
          <li key={test.id} className="flex gap-3 p-3.5 text-sm">
            <Icon aria-hidden="true" className={cn("mt-0.5 size-4 shrink-0", pass ? "text-emerald-600" : "text-rose-600")} />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium break-words whitespace-pre-wrap">{test.description}</p>
                <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset", pass ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-rose-50 text-rose-700 ring-rose-200")}>{pass ? "Pass" : "Fail"}</span>
              </div>
              <div className="mt-1.5 grid gap-1 text-muted-foreground sm:grid-cols-2">
                <p className="break-words whitespace-pre-wrap"><span className="font-medium text-foreground">Expected:</span> {test.expected_result}</p>
                <p className="break-words whitespace-pre-wrap"><span className="font-medium text-foreground">Actual:</span> {test.actual_result}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

const statusLabel: Record<string, string> = { open: "Open", in_progress: "In progress", awaiting_qa: "Awaiting QA", closed: "Closed" };
const statusDot: Record<string, string> = { open: "bg-zinc-400", in_progress: "bg-sky-500", awaiting_qa: "bg-amber-500", closed: "bg-emerald-500" };

function eventText(event: StatusEvent) {
  return event.from_status ? `${statusLabel[event.from_status]} → ${statusLabel[event.to_status]}` : `Reported (${statusLabel[event.to_status]})`;
}

function StatusHistory({ events, named }: { events: StatusEvent[]; named: (id: string | null) => string }) {
  return (
    <section aria-labelledby="history-heading" className="space-y-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <div className="flex items-center gap-2"><HistoryIcon className="size-4 text-muted-foreground" aria-hidden="true" /><h2 id="history-heading" className="text-sm font-semibold">History</h2></div>
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Status changes</h3>
      <ol className="space-y-3 border-l pl-4">
        {events.map((event) => (
          <li key={event.id} className="relative text-sm">
            <span aria-hidden="true" className={cn("absolute top-1.5 -left-[21px] size-2.5 rounded-full ring-4 ring-card", statusDot[event.to_status] ?? "bg-zinc-400")} />
            <p className="font-medium">{eventText(event)}</p>
            <p className="text-xs text-muted-foreground">{named(event.actor_id)} · <time dateTime={event.created_at}>{formatDateTime(event.created_at)}</time></p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Decisions({ review }: { review: QaReview }) {
  const { revisions, testCases, decisions } = review;
  if (!revisions.length) return null;
  return (
    <section aria-labelledby="decisions-heading" className="rounded-xl bg-card ring-1 ring-foreground/10">
      <div className="border-b px-5 py-4"><h2 id="decisions-heading" className="font-semibold">Decisions by version</h2></div>
      <ul className="divide-y">
        {revisions.map((revision) => {
          const decision = decisions.find((d) => d.revision_id === revision.id);
          const tests = testCases.filter((test) => test.revision_id === revision.id);
          const passed = tests.filter((test) => test.outcome === "pass").length;
          return (
            <li key={revision.id} className="space-y-3 px-5 py-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p><span className="font-medium">Version {revision.revision_number}</span> <span className="text-muted-foreground">· {tests.length} test{tests.length === 1 ? "" : "s"} ({passed} passed)</span></p>
                {decision ? <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset", decision.verdict === "approve" ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : "bg-rose-50 text-rose-800 ring-rose-200")}>{decision.verdict === "approve" ? "Approved" : "Rejected"}</span> : <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">Not decided</span>}
              </div>
              {decision?.feedback && <p className="rounded-lg bg-muted/50 px-3 py-2 break-words whitespace-pre-wrap"><span className="font-medium">Feedback:</span> {decision.feedback}</p>}
              {tests.length > 0 && (
                <details className="group">
                  <summary className="flex w-fit cursor-pointer list-none items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
                    <ChevronRight aria-hidden="true" className="size-3.5 transition-transform group-open:rotate-90" />Show {tests.length} test{tests.length === 1 ? "" : "s"}
                  </summary>
                  <div className="mt-2"><TestList tests={tests} /></div>
                </details>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
