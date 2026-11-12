import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { WORKSPACES } from "@/lib/roles";
import { getSignedInRole } from "@/lib/session";
export default function Home() {
  return <Suspense fallback={null}><WorkspaceRedirect /></Suspense>;
}

async function WorkspaceRedirect() {
  await connection();
  const session = await getSignedInRole();
  redirect(session ? WORKSPACES[session.role].home : "/login");
  return null;
}
