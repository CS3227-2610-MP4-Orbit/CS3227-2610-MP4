import type { ReactNode } from "react";
import { Suspense } from "react";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { AppSidebarSkeleton } from "./app-sidebar";

/**
 * Signed-in pages sit in an inset panel beside the sidebar. Each workspace layout renders this,
 * so sign-in stays a full-screen page without reading the URL here.
 */
export function AppShell({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
  return (
    <SidebarProvider>
      <Suspense fallback={<AppSidebarSkeleton />}>{sidebar}</Suspense>
      <SidebarInset className="min-w-0">{children}</SidebarInset>
    </SidebarProvider>
  );
}
