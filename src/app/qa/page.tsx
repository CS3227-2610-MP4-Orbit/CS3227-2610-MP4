import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { getQaQueue } from "@/lib/qa/queries";
import { orderQaQueue } from "@/lib/qa/queue";

import { StatusBadge } from "./status-badge";

export default function QaPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-8 sm:px-8">
      <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">QA workspace</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">Fixes to verify</h1>
      <p className="mt-2 text-slate-600">Reports assigned to you. Fixes awaiting QA need a test and a decision.</p>
      <Suspense fallback={<p className="mt-6">Loading your queue…</p>}><Queue /></Suspense>
    </main>
  );
}

async function Queue() {
  await connection();
  const result = await getQaQueue();
  if (result.kind === "denied") {
    if (result.reason === "unauthenticated") redirect("/login");
    return <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-red-900">The QA workspace is only for QA tester accounts.</p>;
  }
  const reports = orderQaQueue(result.reports);
  if (!reports.length) return <p className="mt-6 text-slate-600">No reports are assigned to you yet.</p>;
  return (
    <ul className="mt-6 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {reports.map((report) => (
        <li key={report.id} className="flex flex-wrap items-center justify-between gap-3 p-5 hover:bg-slate-50">
          <div>
            <Link href={`/qa/${report.id}`} className="font-semibold text-blue-700 hover:underline">{report.title}</Link>
            <p className="mt-1 text-sm text-slate-600">Updated <time dateTime={report.updated_at}>{new Date(report.updated_at).toLocaleString()}</time></p>
          </div>
          <StatusBadge status={report.status} />
        </li>
      ))}
    </ul>
  );
}
