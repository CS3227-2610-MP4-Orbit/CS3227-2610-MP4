import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ReportForm } from "../report-form";
import { updateReport } from "./actions";
import type { ReportValues } from "@/lib/reports/validation";

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
  const { data: report, error } = await supabase.from("bug_reports")
    .select("id,reporter_id,title,python_code:code,error_message,expected_behavior,actual_behavior,reproduction_steps,status,created_at")
    .eq("id", id).eq("reporter_id", user.id).maybeSingle();
  if (error || !report) notFound();
  const values: ReportValues = {
    title: report.title, python_code: report.python_code, error_message: report.error_message,
    expected_behavior: report.expected_behavior, actual_behavior: report.actual_behavior,
    reproduction_steps: report.reproduction_steps,
  };
  const { saved } = await searchParams;
  return (
    <main className="mx-auto w-full max-w-4xl p-6">
      <Link href="/reports" className="text-sm underline">← My reports</Link>
      <h1 className="mt-4 text-2xl font-semibold">{report.title}</h1>
      <p className="mb-6 text-sm text-gray-600">Status: {report.status} · Created {new Date(report.created_at).toLocaleString()}</p>
      {saved === "1" && <p role="status" className="mb-4 text-green-700">Report saved.</p>}
      {report.status === "open" ? <ReportForm action={updateReport.bind(null, id)} initialValues={values} submitLabel="Save changes" /> : (
        <div className="space-y-4">{([
          ["Python code", "python_code"], ["Error message", "error_message"],
          ["Expected behavior", "expected_behavior"], ["Actual behavior", "actual_behavior"],
          ["Reproduction steps", "reproduction_steps"],
        ] as const).map(([label, key]) => <section key={key}><h2 className="font-semibold">{label}</h2><pre className="whitespace-pre-wrap break-words rounded border p-3">{values[key]}</pre></section>)}</div>
      )}
    </main>
  );
}
