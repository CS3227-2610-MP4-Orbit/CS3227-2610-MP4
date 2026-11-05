import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ReportForm } from "../report-form";
import { createReport } from "./actions";

export default function NewReportPage() {
  return (
    <Suspense fallback={<main className="mx-auto w-full max-w-4xl p-6">Loading report form…</main>}>
      <AuthenticatedReportForm />
    </Suspense>
  );
}

async function AuthenticatedReportForm() {
  // Supabase auth checks the current time while creating/refreshing a session.
  // Keep that work out of the prerendered shell.
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return <main className="mx-auto w-full max-w-4xl px-5 py-8 sm:px-8"><p className="text-sm font-semibold uppercase tracking-widest text-blue-700">New report</p><h1 className="mb-2 mt-1 text-3xl font-semibold tracking-tight">Submit a Python bug</h1><p className="mb-6 max-w-2xl text-sm text-slate-600">Describe the issue and paste a small Python example. Code is stored as text and is never run.</p><ReportForm action={createReport} submitLabel="Submit report" /></main>;
}
