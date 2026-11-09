import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";

import { FixComparison } from "@/app/reports/[id]/comparison";
import { getQaReview, type QaReview, type StatusEvent } from "@/lib/qa/queries";
import { idSchema } from "@/lib/qa/validation";

import { StatusBadge } from "../status-badge";
import { decideFix, draftFeedback, recordTestCase, suggestTests } from "./actions";
import { DecisionForm, TestCaseForm, TestSuggestions } from "./qa-forms";

// Shown after a decision redirect, only when the report's status agrees with the URL.
const decidedMessage: Record<string, { status: string; text: string }> = {
  approve: { status: "closed", text: "Fix approved. The report is closed." },
  reject: { status: "in_progress", text: "Fix rejected. The report is back with the Developer." },
};

export default function QaReviewPage({ params, searchParams }: PageProps<"/qa/[reportId]">) {
  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-8 sm:px-8">
      <Link href="/qa" className="text-sm font-medium text-blue-700 hover:underline">← QA queue</Link>
      <Suspense fallback={<p className="mt-6">Loading report…</p>}><Review params={params} searchParams={searchParams} /></Suspense>
    </main>
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
      <div className="mt-5 flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{report.title}</h1>
        <StatusBadge status={report.status} />
      </div>
      {confirmation && (
        <p role="status" className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-green-800">{confirmation}</p>
      )}
      <p className="mt-2 text-sm text-slate-600">Reported <time dateTime={report.created_at}>{new Date(report.created_at).toLocaleString()}</time></p>

      <section aria-labelledby="bug-heading" className="mt-8 grid gap-4 sm:grid-cols-2">
        <h2 id="bug-heading" className="sr-only">Bug details</h2>
        {([
          ["Error message", report.error_message], ["Reproduction steps", report.reproduction_steps],
          ["Expected behavior", report.expected_behavior], ["Actual behavior", report.actual_behavior],
        ] as const).map(([label, value]) => (
          <div key={label}>
            <h3 className="text-sm font-semibold text-slate-700">{label}</h3>
            <pre className="mt-1 whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-white p-3 text-sm">{value || "—"}</pre>
          </div>
        ))}
      </section>

      <FixComparison
        original={report.code}
        revisions={revisions.map((revision) => ({ ...revision, report_id: report.id, author_name: names[revision.author_id] }))}
      />

      <section aria-labelledby="verify-heading" className="mt-10 space-y-4 border-t pt-6">
        <h2 id="verify-heading" className="text-xl font-semibold">Verify the latest fix</h2>
        {awaiting ? (
          <>
            <TestList tests={latestTests} />
            <TestSuggestions action={suggestTests.bind(null, report.id)} />
            <TestCaseForm action={recordTestCase.bind(null, report.id)} revisionId={latest.id} />
            <DecisionForm action={decideFix.bind(null, report.id)} draftAction={draftFeedback.bind(null, report.id)}
              revisionId={latest.id} revisionNumber={latest.revision_number} testsKey={latestTests.map((test) => test.id).join(",")} />
          </>
        ) : (
          <p className="text-slate-600">{report.status === "closed" ? "This report is closed." : "No fix is awaiting QA. It is with the Developer."}</p>
        )}
      </section>

      <History review={review} named={named} />
    </>
  );
}

function TestList({ tests }: { tests: QaReview["testCases"] }) {
  if (!tests.length) return <p className="text-sm text-slate-600">No tests recorded for this version yet.</p>;
  return (
    <ul className="space-y-2">
      {tests.map((test) => (
        <li key={test.id} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
          <div className="flex items-start justify-between gap-3">
            <p className="font-medium whitespace-pre-wrap break-words">{test.description}</p>
            <span className={test.outcome === "pass" ? "font-semibold text-emerald-700" : "font-semibold text-rose-700"}>{test.outcome === "pass" ? "Pass" : "Fail"}</span>
          </div>
          <p className="mt-1 whitespace-pre-wrap break-words text-slate-700"><span className="font-medium">Expected:</span> {test.expected_result}</p>
          <p className="whitespace-pre-wrap break-words text-slate-700"><span className="font-medium">Actual:</span> {test.actual_result}</p>
        </li>
      ))}
    </ul>
  );
}

const statusLabel: Record<string, string> = { open: "Open", in_progress: "In progress", awaiting_qa: "Awaiting QA", closed: "Closed" };

function eventText(event: StatusEvent) {
  return event.from_status ? `${statusLabel[event.from_status]} → ${statusLabel[event.to_status]}` : `Reported (${statusLabel[event.to_status]})`;
}

function History({ review, named }: { review: QaReview; named: (id: string | null) => string }) {
  const { revisions, testCases, decisions, events } = review;
  return (
    <section aria-labelledby="history-heading" className="mt-10 space-y-6 border-t pt-6">
      <h2 id="history-heading" className="text-xl font-semibold">History</h2>
      {revisions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700">Decisions by version</h3>
          <ul className="mt-2 space-y-2 text-sm">
            {revisions.map((revision) => {
              const decision = decisions.find((d) => d.revision_id === revision.id);
              const tests = testCases.filter((test) => test.revision_id === revision.id);
              const passed = tests.filter((test) => test.outcome === "pass").length;
              return (
                <li key={revision.id} className="rounded-lg border border-slate-200 bg-white p-3">
                  <p>
                    <span className="font-medium">Version {revision.revision_number}</span> · {tests.length} test{tests.length === 1 ? "" : "s"} ({passed} passed) ·{" "}
                    {decision ? <span className={decision.verdict === "approve" ? "text-emerald-700" : "text-rose-700"}>{decision.verdict === "approve" ? "Approved" : "Rejected"}</span> : "Not decided"}
                  </p>
                  {decision?.feedback && <p className="mt-1 whitespace-pre-wrap break-words text-slate-700">Feedback: {decision.feedback}</p>}
                  {tests.length > 0 && <div className="mt-2"><TestList tests={tests} /></div>}
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <div>
        <h3 className="text-sm font-semibold text-slate-700">Status changes</h3>
        <ol className="mt-2 space-y-1 text-sm text-slate-700">
          {events.map((event) => (
            <li key={event.id}>
              <time dateTime={event.created_at} className="text-slate-500">{new Date(event.created_at).toLocaleString()}</time> · {eventText(event)} · {named(event.actor_id)}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
