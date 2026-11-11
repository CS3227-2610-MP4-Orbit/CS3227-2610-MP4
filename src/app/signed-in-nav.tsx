import { connection } from "next/server";

import { AppSidebar, AppSidebarSkeleton } from "@/components/app/app-sidebar";
import { WORKSPACES } from "@/lib/roles";
import { getSignedInRole } from "@/lib/session";

import { signOut } from "./login/actions";

const ROLE_LABEL = { reporter: "Reporter", developer: "Developer", qa: "QA tester" } as const;

/** Reads the session, so the layout renders it inside a Suspense boundary. */
export async function SignedInNav() {
  await connection();
  const session = await getSignedInRole();
  if (!session) return <AppSidebarSkeleton />;
  const workspace = WORKSPACES[session.role];
  return (
    <AppSidebar
      workspace={workspace.label}
      links={workspace.links}
      label={`${workspace.label} navigation`}
      user={{ name: session.name, email: session.email, roleLabel: ROLE_LABEL[session.role] }}
      signOut={signOut}
    />
  );
}
