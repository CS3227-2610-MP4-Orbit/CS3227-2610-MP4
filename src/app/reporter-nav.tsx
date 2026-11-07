"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { activeRoute, type NavLink, WORKSPACES } from "../lib/roles";

/** The Reporter link to highlight for a path (kept for the Reporter navigation tests). */
export function activeReporterRoute(pathname: string): string | null {
  return activeRoute(pathname, WORKSPACES.reporter.links);
}

/** Navigation for the signed-in role; the links come from the server, which knows the role. */
export function RoleNav({ links, label }: { links: readonly NavLink[]; label: string }) {
  const pathname = usePathname();
  if (pathname === "/login") return null;
  return <NavLinks links={links} label={label} active={activeRoute(pathname, links)} />;
}

export function RoleNavFallback() {
  return <NavLinks links={[]} label="Navigation" active={null} />;
}

function NavLinks({ links, label, active }: { links: readonly NavLink[]; label: string; active: string | null }) {
  return (
    <header className="border-b border-slate-200 bg-white/95">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8">
        <Link href="/" className="text-base font-bold tracking-tight text-slate-900">Python Bug Workflow</Link>
        {links.length > 0 && (
          <nav aria-label={label} className="flex max-w-full gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 text-sm font-medium">
            {links.map(({ href, label: text }) => <Link key={href} href={href} aria-current={active === href ? "page" : undefined} className="whitespace-nowrap rounded-lg px-3 py-2 text-slate-600 transition-colors hover:bg-white hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 aria-[current=page]:bg-white aria-[current=page]:text-blue-700 aria-[current=page]:shadow-sm">{text}</Link>)}
          </nav>
        )}
      </div>
    </header>
  );
}
