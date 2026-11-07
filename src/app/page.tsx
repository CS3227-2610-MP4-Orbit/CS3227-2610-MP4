import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";

import { createClient } from "@/lib/supabase/server";

import { signOut } from "./login/actions";

// Placeholder home page; the role dashboards are future work.
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-8 px-5 py-12 sm:px-8">
      <div className="max-w-2xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-700">Reporter workspace</p>
        <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">Track a Python bug from report to feedback.</h1>
        <p className="mt-4 text-lg text-slate-600">Share a reproducible snippet, follow its status, and read Developer or QA feedback in one place.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/reports/new" className="rounded-xl bg-blue-700 px-5 py-3 font-medium text-white hover:bg-blue-800">Submit a bug report</Link>
        <Link href="/reports" className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-medium text-slate-900 hover:border-blue-500">View my reports</Link>
      </div>
      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
        <Suspense fallback={<p>Loading account…</p>}><SignedInAs /></Suspense>
        <form action={signOut}><button className="font-medium text-blue-700 hover:underline">Sign out</button></form>
      </div>
    </main>
  );
}

// Reads the session cookie, so it renders per request inside the Suspense boundary.
async function SignedInAs() {
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return <p className="text-sm text-gray-600">Signed in as {String(data?.claims?.email ?? "")}</p>;
}
