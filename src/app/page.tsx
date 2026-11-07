import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { WORKSPACES } from "@/lib/roles";
import { getSignedInRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

import { signOut } from "./login/actions";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-8 px-5 py-12 sm:px-8">
      <Suspense fallback={<p>Loading your workspace…</p>}><RoleHome /></Suspense>
      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
        <Suspense fallback={<p>Loading account…</p>}><SignedInAs /></Suspense>
        <form action={signOut}><button className="font-medium text-blue-700 hover:underline">Sign out</button></form>
      </div>
    </main>
  );
}

// Reads the session, so it renders per request inside the Suspense boundary.
async function RoleHome() {
  await connection();
  const session = await getSignedInRole();
  if (!session) redirect("/login");
  const workspace = WORKSPACES[session.role];
  return (
    <>
      <div className="max-w-2xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-700">{workspace.label}</p>
        <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">{workspace.headline}</h1>
        <p className="mt-4 text-lg text-slate-600">{workspace.summary}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        {workspace.actions.map(({ href, label }, index) => (
          <Link key={href} href={href} className={index === 0
            ? "rounded-xl bg-blue-700 px-5 py-3 font-medium text-white hover:bg-blue-800"
            : "rounded-xl border border-slate-300 bg-white px-5 py-3 font-medium text-slate-900 hover:border-blue-500"}>{label}</Link>
        ))}
      </div>
    </>
  );
}

async function SignedInAs() {
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return <p className="text-sm text-gray-600">Signed in as {String(data?.claims?.email ?? "")}</p>;
}
