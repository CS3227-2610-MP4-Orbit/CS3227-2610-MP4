import type { ReactNode } from "react";

import { AppShell } from "@/components/app/app-shell";

import { SignedInNav } from "../signed-in-nav";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return <AppShell sidebar={<SignedInNav />}>{children}</AppShell>;
}
