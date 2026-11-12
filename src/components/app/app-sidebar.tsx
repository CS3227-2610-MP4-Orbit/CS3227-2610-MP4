"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardCheck, FilePlus2, Inbox, LogOut, Wrench } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail, SidebarSeparator,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { activeRoute, type NavLink } from "@/lib/roles";

import { Logo, LogoMark } from "./logo";

const ICONS: Record<string, ComponentType<{ className?: string }>> = {
  "/reports": Inbox,
  "/reports/new": FilePlus2,
  "/developer": Wrench,
  "/qa": ClipboardCheck,
};

export type SidebarUser = { name: string; email: string; roleLabel: string };

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts.length > 1 ? parts.at(-1)![0] : "")).toUpperCase();
}

export function AppSidebar({ workspace, links, label, user, signOut }: {
  workspace: string; links: readonly NavLink[]; label: string; user: SidebarUser; signOut: () => Promise<void>;
}) {
  const pathname = usePathname();
  const active = activeRoute(pathname, links);
  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="BugFlow">
              <Link href="/"><Logo subtitle={workspace} /></Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <nav aria-label={label}>
              <SidebarMenu>
                {links.map(({ href, label: text }) => {
                  const Icon = ICONS[href] ?? Inbox;
                  return (
                    <SidebarMenuItem key={href}>
                      <SidebarMenuButton asChild isActive={active === href} tooltip={text}>
                        <Link href={href} aria-current={active === href ? "page" : undefined}><Icon /><span>{text}</span></Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </nav>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="mt-auto group-data-[collapsible=icon]:hidden">
          <div className="rounded-lg border border-sidebar-border bg-card p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">How a bug moves</p>
            <ol className="mt-2 space-y-1.5">
              {[["bg-zinc-400", "Reporter files it"], ["bg-sky-500", "Developer fixes it"], ["bg-amber-500", "QA verifies the fix"], ["bg-emerald-500", "Closed when approved"]].map(([dot, text]) => (
                <li key={text} className="flex items-center gap-2"><span aria-hidden="true" className={`size-1.5 rounded-full ${dot}`} />{text}</li>
              ))}
            </ol>
          </div>
        </SidebarGroup>
      </SidebarContent>
      <SidebarSeparator className="mx-0" />
      <SidebarFooter>
        <div className="flex items-center gap-2 rounded-lg p-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0">
          <Avatar className="size-8 rounded-lg"><AvatarFallback className="rounded-lg bg-primary text-xs font-semibold text-primary-foreground">{initials(user.name)}</AvatarFallback></Avatar>
          <div className="grid min-w-0 flex-1 leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-medium">{user.name}</span>
            <span className="truncate text-xs text-muted-foreground">{user.roleLabel} · {user.email}</span>
          </div>
          <form action={signOut} className="group-data-[collapsible=icon]:hidden">
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="submit" aria-label="Sign out" className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"><LogOut className="size-4" /></button>
              </TooltipTrigger>
              <TooltipContent side="top">Sign out</TooltipContent>
            </Tooltip>
          </form>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

/** Same footprint as the sidebar, shown while the session loads. */
export function AppSidebarSkeleton() {
  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader><div className="flex items-center gap-2.5 p-2"><LogoMark /><Skeleton className="h-4 w-24" /></div></SidebarHeader>
      <SidebarContent className="gap-2 p-4">{[0, 1].map((i) => <Skeleton key={i} className="h-8 w-full" />)}</SidebarContent>
    </Sidebar>
  );
}
