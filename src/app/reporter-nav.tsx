"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/reports", label: "My reports" },
  { href: "/reports/new", label: "New report" },
] as const;

export function activeReporterRoute(pathname: string): string | null {
  if (pathname === "/login") return null;
  if (pathname === "/reports/new") return "/reports/new";
  if (pathname === "/reports" || pathname.startsWith("/reports/")) return "/reports";
  return pathname === "/" ? "/" : null;
}

export function ReporterNav() {
  const pathname = usePathname();
  const active = activeReporterRoute(pathname);
  if (active === null) return null;
  return <NavLinks active={active} />;
}

export function ReporterNavFallback() {
  return <NavLinks active={null} />;
}

function NavLinks({ active }: { active: string | null }) {
  return (
    <header className="border-b border-slate-200 bg-white/95">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8">
        <Link href="/" className="text-base font-bold tracking-tight text-slate-900">Python Bug Workflow</Link>
        <nav aria-label="Reporter navigation" className="flex max-w-full gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 text-sm font-medium">
          {links.map(({ href, label }) => <Link key={href} href={href} aria-current={active === href ? "page" : undefined} className="whitespace-nowrap rounded-lg px-3 py-2 text-slate-600 transition-colors hover:bg-white hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 aria-[current=page]:bg-white aria-[current=page]:text-blue-700 aria-[current=page]:shadow-sm">{label}</Link>)}
        </nav>
      </div>
    </header>
  );
}
