import Link from "next/link";
import { ArrowUpRight, Inbox } from "lucide-react";

import { EmptyState } from "@/components/app/empty-state";
import { StatCard, StatGrid } from "@/components/app/stat-card";
import { StatusBadge } from "@/components/app/status";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import type { DeveloperReport } from "@/lib/developer/report-model";

export function getDashboardState(reports: DeveloperReport[]) {
  return reports.length === 0 ? "empty" : "populated";
}

// Work the Developer can act on first: in progress, then new, then waiting on QA, then closed.
const ORDER: Record<string, number> = { in_progress: 0, open: 1, awaiting_qa: 2, closed: 3 };

export function DeveloperDashboard({ reports }: { reports: DeveloperReport[] }) {
  if (reports.length === 0) {
    return <EmptyState headingId="empty-heading" icon={<Inbox />} title="No assigned bug reports" description="Reports assigned to you will appear here." />;
  }
  const count = (status: string) => reports.filter((report) => report.status === status).length;
  const sorted = [...reports].sort((a, b) => (ORDER[a.status] ?? 9) - (ORDER[b.status] ?? 9) || b.updated_at.localeCompare(a.updated_at));

  return (
    <>
      <StatGrid>
        <StatCard label="New" value={count("open")} status="open" hint="Not started yet" />
        <StatCard label="In progress" value={count("in_progress")} status="in_progress" hint="Includes fixes sent back" />
        <StatCard label="With QA" value={count("awaiting_qa")} status="awaiting_qa" />
        <StatCard label="Closed" value={count("closed")} status="closed" />
      </StatGrid>
      <section aria-labelledby="assigned-heading" className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 id="assigned-heading" className="text-sm font-semibold">Assigned reports</h2>
          <span className="text-xs text-muted-foreground">{reports.length} total · actionable first</span>
        </div>
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">Report</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Last updated</TableHead>
              <TableHead className="w-24 pr-4 text-right"><span className="sr-only">Action</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((report) => (
              <TableRow key={report.id} className="group relative">
                <TableCell className="max-w-0 py-3.5 pl-4 sm:max-w-none">
                  <h3 className="truncate font-medium">{report.title}</h3>
                  <span className="mt-0.5 block text-xs text-muted-foreground md:hidden">Updated {formatDateTime(report.updated_at)}</span>
                </TableCell>
                <TableCell><StatusBadge status={report.status} /></TableCell>
                <TableCell className="hidden text-muted-foreground tabular-nums md:table-cell">{formatDateTime(report.updated_at)}</TableCell>
                <TableCell className="pr-4 text-right">
                  <Link href={`/developer/${report.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-foreground after:absolute after:inset-0 hover:underline focus-visible:underline focus-visible:outline-none">
                    Open report<ArrowUpRight aria-hidden="true" className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </>
  );
}
