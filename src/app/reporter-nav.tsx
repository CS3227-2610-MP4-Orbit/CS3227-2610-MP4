"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { activeRoute, type NavLink, WORKSPACES } from "../lib/roles";

/** The Reporter link to highlight for a path (kept for the Reporter navigation tests). */
export function activeReporterRoute(pathname: string): string | null {
  return activeRoute(pathname, WORKSPACES.reporter.links);
}

/** Navigation for the signed-in role; the links come from the server, which knows the role. */
export function RoleNav({ links, label, signOut }: { links: readonly NavLink[]; label: string; signOut?: () => Promise<void> }) {
  const pathname = usePathname();
  if (pathname === "/login") return null;
  return <NavLinks links={links} label={label} active={activeRoute(pathname, links)} signOut={signOut} />;
}

/**
 * Shown while the role loads: nothing on sign-in, otherwise the header at its final height.
 * Reading the path needs its own boundary, because a fallback sits outside the one it fills.
 */
export function RoleNavFallback() {
  return <Suspense fallback={null}><PathAwareFallback /></Suspense>;
}

function PathAwareFallback() {
  const pathname = usePathname();
  if (pathname === "/login") return null;
  return <NavLinks links={[]} label="Navigation" active={null} />;
}

function NavLinks({ links, label, active, signOut }: { links: readonly NavLink[]; label: string; active: string | null; signOut?: () => Promise<void> }) {
  return (
    <header className="border-b border-slate-200 bg-white/95">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8">
        <Link href="/" className="text-base font-bold tracking-tight text-slate-900">Python Bug Workflow</Link>
        {links.length === 0 ? <div aria-hidden="true" className="h-11" /> : (
          <div className="flex max-w-full flex-wrap items-center gap-3">
          <nav aria-label={label} className="flex max-w-full gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 text-sm font-medium">
            {links.map(({ href, label: text }) => <Link key={href} href={href} aria-current={active === href ? "page" : undefined} className="whitespace-nowrap rounded-lg px-3 py-2 text-slate-600 transition-colors hover:bg-white hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 aria-[current=page]:bg-white aria-[current=page]:text-blue-700 aria-[current=page]:shadow-sm">{text}</Link>)}
          </nav>
          {signOut && <form action={signOut}><button className="rounded-lg px-2 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-blue-600">Sign out</button></form>}
          </div>
        )}
      </div>
    </header>
  );
}
