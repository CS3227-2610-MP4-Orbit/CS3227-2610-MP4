import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

export default function ReportsPage({ searchParams }: { searchParams: Promise<{ submitted?: string }> }) {
  return <Suspense fallback={<main className="mx-auto max-w-4xl p-6">Loading reports…</main>}><ReporterReports searchParams={searchParams} /></Suspense>;
}

async function ReporterReports({ searchParams }: { searchParams: Promise<{ submitted?: string }> }) {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "reporter") return <main className="mx-auto max-w-4xl p-6"><h1>Reporter access required</h1></main>;
  const { data: reports, error } = await supabase.from("bug_reports")
    .select("id,title,status,created_at").eq("reporter_id", user.id)
    .order("created_at", { ascending: false }).order("id", { ascending: false });
  const { submitted } = await searchParams;
  return (
    <main className="mx-auto w-full max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between gap-4"><h1 className="text-2xl font-semibold">My bug reports</h1><Link href="/reports/new" className="rounded bg-black px-4 py-2 text-white">New report</Link></div>
      {submitted === "1" && <p role="status" className="mb-4 text-green-700">Your bug report was submitted.</p>}
      {error ? <p role="alert">Could not load reports. Please try again.</p> : reports?.length ? (
        <ul className="divide-y rounded border">{reports.map((report) => <li key={report.id} className="p-4"><Link href={`/reports/${report.id}`} className="font-medium underline">{report.title}</Link><p className="text-sm text-gray-600">Status: {report.status} · Created {new Date(report.created_at).toLocaleString()}</p></li>)}</ul>
      ) : <p>You have no bug reports yet. <Link href="/reports/new" className="underline">Submit your first report</Link>.</p>}
    </main>
  );
}
