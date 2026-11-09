import { connection } from "next/server";

import { WORKSPACES } from "@/lib/roles";
import { getSignedInRole } from "@/lib/session";

import { RoleNav } from "./reporter-nav";
import { signOut } from "./login/actions";

/** Reads the session, so the layout renders it inside a Suspense boundary. */
export async function SignedInNav() {
  await connection();
  const session = await getSignedInRole();
  if (!session) return <RoleNav links={[]} label="Navigation" />;
  const workspace = WORKSPACES[session.role];
  return <RoleNav links={workspace.links} label={`${workspace.label} navigation`} signOut={signOut} />;
}
