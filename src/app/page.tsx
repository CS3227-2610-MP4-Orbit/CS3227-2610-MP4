import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";

import { createClient } from "@/lib/supabase/server";

import { signOut } from "./login/actions";

// Placeholder home page; the role dashboards are future work.
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">Python Bug Workflow</h1>
      <Link href="/reports/new" className="rounded bg-black px-4 py-2 text-white">Submit a bug report</Link>
      <Link href="/reports" className="rounded border px-4 py-2">My reports</Link>
      <Suspense fallback={<p className="text-sm text-gray-600">Loading…</p>}>
        <SignedInAs />
      </Suspense>
      <form action={signOut}>
        <button className="rounded border px-4 py-2">Sign out</button>
      </form>
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
