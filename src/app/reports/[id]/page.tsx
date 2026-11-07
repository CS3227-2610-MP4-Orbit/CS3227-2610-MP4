import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ReportForm } from "../report-form";
import { updateReport } from "./actions";
import { FixComparison, type FixRevision } from "./comparison";
import { FeedbackSection, type FeedbackEntry } from "./feedback-section";
import type { ReportValues } from "@/lib/reports/validation";
import { canUseLegacyLocalReports } from "@/lib/reports/legacy-local";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function ReportPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  return <Suspense fallback={<main className="mx-auto max-w-4xl p-6">Loading report…</main>}><ReporterReport params={params} searchParams={searchParams} /></Suspense>;
}

async function ReporterReport({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  await connection();
  const { id } = await params;
  if (!uuid.test(id)) notFound();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "reporter") notFound();
  const primary = await supabase.from("bug_reports")
    .select("id,reporter_id,title,python_code:code,error_message,expected_behavior,actual_behavior,reproduction_steps,status,created_at")
    .eq("id", id).eq("reporter_id", user.id).maybeSingle();
  const legacy = canUseLegacyLocalReports(primary.error);
  const result = legacy ? await supabase.from("bug_reports")
    .select("id,reporter_id,title,python_code,error_message,expected_behavior,actual_behavior,reproduction_steps,status,created_at")
    .eq("id", id).eq("reporter_id", user.id).maybeSingle() : primary;
  if (result.error) return <main className="mx-auto max-w-4xl p-6"><p role="alert">Could not load this report. Please try again.</p></main>;
  const report = result.data;
  if (!report) notFound();
  const values: ReportValues = {
    title: report.title, python_code: report.python_code, error_message: report.error_message,
    expected_behavior: report.expected_behavior, actual_behavior: report.actual_behavior,
    reproduction_steps: report.reproduction_steps,
  };
  const { data: revisions, error: revisionError } = legacy ? { data: [], error: null } : await supabase.from("fix_revisions")
    .select("id,report_id,revision_number,author_id,code,note,created_at")
    .eq("report_id", report.id)
    .order("revision_number", { ascending: false });
  const sample = process.env.NODE_ENV === "development" ? {
    original: "def average(values):\n    return sum(values) / len(values)\n",
    proposed: "def average(values):\n    if not values:\n        return 0\n    return sum(values) / len(values)\n",
    note: "Handle an empty list before dividing by its length.",
  } : undefined;
  const { data: feedback, error: feedbackError } = await supabase.from("bug_feedback")
    .select("id,author_role,body,created_at")
    .eq("report_id", report.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });
  const { saved } = await searchParams;
  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-8 sm:px-8">
      <Link href="/reports" className="text-sm font-medium text-blue-700 hover:underline">← My reports</Link>
      <div className="mt-5 flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{report.title}</h1>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium capitalize text-blue-800">{report.status.replaceAll("_", " ")}</span>
      </div>
      <p className="mb-6 mt-2 text-sm text-slate-600">Created {new Date(report.created_at).toLocaleString()}</p>
      <nav aria-label="Report sections" className="mb-6 flex gap-1 border-b border-slate-200">
        <a href="#report-details" className="border-b-2 border-transparent px-4 py-3 text-sm font-medium text-slate-700 hover:border-blue-600 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-blue-600">Details</a>
        <a href="#report-comparison" className="border-b-2 border-transparent px-4 py-3 text-sm font-medium text-slate-700 hover:border-blue-600 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-blue-600">Fix comparison</a>
        <a href="#report-feedback" className="border-b-2 border-transparent px-4 py-3 text-sm font-medium text-slate-700 hover:border-blue-600 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-blue-600">Feedback</a>
      </nav>
      {saved === "1" && <p role="status" className="mb-4 text-green-700">Report saved.</p>}
      <section id="report-details" aria-label="Report details">
      {report.status === "open" ? <ReportForm action={updateReport.bind(null, id)} initialValues={values} submitLabel="Save changes" /> : (
        <div className="space-y-4">{([
          ["Python code", "python_code"], ["Error message", "error_message"],
          ["Expected behavior", "expected_behavior"], ["Actual behavior", "actual_behavior"],
          ["Reproduction steps", "reproduction_steps"],
        ] as const).map(([label, key]) => <section key={key}><h2 className="font-semibold">{label}</h2><pre className="whitespace-pre-wrap break-words rounded border p-3">{values[key]}</pre></section>)}</div>
      )}
      </section>
      <div id="report-comparison">
        <FixComparison original={values.python_code} revisions={revisionError ? [] : (revisions ?? []) as FixRevision[]} loadError={!!revisionError} sample={sample} />
      </div>
      <div id="report-feedback">
      <FeedbackSection entries={feedbackError ? [] : (feedback ?? []) as FeedbackEntry[]} loadError={!!feedbackError} />
      </div>
    </main>
  );
}
