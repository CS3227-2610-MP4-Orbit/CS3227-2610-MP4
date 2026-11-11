import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { ArrowRight, ArrowUpRight, ClipboardCheck, Inbox } from "lucide-react";

import { EmptyState } from "@/components/app/empty-state";
import { Notice } from "@/components/app/notice";
import { PageContainer, PageHeader } from "@/components/app/page-header";
import { StatCard, StatGrid } from "@/components/app/stat-card";
import { TopBar } from "@/components/app/top-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import { getQaQueue } from "@/lib/qa/queries";
import { orderQaQueue, type QueueReport } from "@/lib/qa/queue";

import { StatusBadge } from "./status-badge";

export const metadata: Metadata = { title: "QA queue" };

export default function QaPage() {
  return (
    <>
      <TopBar crumbs={[{ label: "QA" }, { label: "QA queue" }]} />
      <PageContainer>
        <PageHeader eyebrow="QA workspace" title="Fixes to verify" description="Reports assigned to you. Fixes awaiting QA need a test and a decision." />
        <Suspense fallback={<div className="space-y-4"><p className="sr-only">Loading your queue…</p><Skeleton className="h-24 w-full" /><Skeleton className="h-64 w-full" /></div>}><Queue /></Suspense>
      </PageContainer>
    </>
  );
}

async function Queue() {
  await connection();
  const result = await getQaQueue();
  if (result.kind === "denied") {
    if (result.reason === "unauthenticated") redirect("/login");
    return <Notice tone="error">The QA workspace is only for QA tester accounts.</Notice>;
  }
  const reports = orderQaQueue(result.reports);
  if (!reports.length) return <EmptyState icon={<Inbox />} title="Nothing assigned yet" description="No reports are assigned to you yet." />;
  const waiting = reports.filter((report) => report.status === "awaiting_qa");
  const rest = reports.filter((report) => report.status !== "awaiting_qa");
  const count = (status: string) => reports.filter((report) => report.status === status).length;

  return (
    <>
      <StatGrid>
        <StatCard label="Awaiting QA" value={waiting.length} status="awaiting_qa" hint="Needs your test and decision" />
        <StatCard label="With Developer" value={count("in_progress")} status="in_progress" />
        <StatCard label="Not started" value={count("open")} status="open" />
        <StatCard label="Closed" value={count("closed")} status="closed" />
      </StatGrid>

      <section aria-labelledby="waiting-heading" className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="waiting-heading" className="text-sm font-semibold">Needs your review</h2>
          <span className="text-xs text-muted-foreground">Oldest hand-off first</span>
        </div>
        {waiting.length ? (
          <ul className="grid gap-3 md:grid-cols-2">
            {waiting.map((report) => (
              <li key={report.id} className="group relative flex flex-col justify-between gap-4 rounded-xl border-l-[3px] border-l-amber-400 bg-card p-4 ring-1 ring-foreground/10 transition-shadow hover:shadow-md hover:shadow-foreground/5">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/qa/${report.id}`} className="font-medium text-foreground after:absolute after:inset-0 focus-visible:underline focus-visible:outline-none">{report.title}</Link>
                  <StatusBadge status={report.status} />
                </div>
                <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span>Handed to QA <time dateTime={report.updated_at}>{formatDateTime(report.updated_at)}</time></span>
                  <span className="inline-flex items-center gap-1 font-medium text-foreground">Review fix<ArrowRight aria-hidden="true" className="size-3.5 transition-transform group-hover:translate-x-0.5" /></span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-dashed bg-card/60 px-4 py-5 text-sm text-muted-foreground"><ClipboardCheck className="size-4" aria-hidden="true" />No fixes are waiting for you right now.</div>
        )}
      </section>

      {rest.length > 0 && <OtherReports reports={rest} />}
    </>
  );
}

function OtherReports({ reports }: { reports: QueueReport[] }) {
  return (
    <section aria-labelledby="other-heading" className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      <div className="border-b px-4 py-3"><h2 id="other-heading" className="text-sm font-semibold">Other assigned reports</h2></div>
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-4">Report</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Updated</TableHead>
            <TableHead className="w-10 pr-4"><span className="sr-only">Open</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => (
            <TableRow key={report.id} className="group relative">
              <TableCell className="max-w-0 py-3.5 pl-4 sm:max-w-none"><Link href={`/qa/${report.id}`} className="block truncate font-medium after:absolute after:inset-0 focus-visible:underline focus-visible:outline-none">{report.title}</Link></TableCell>
              <TableCell><StatusBadge status={report.status} /></TableCell>
              <TableCell className="hidden text-muted-foreground tabular-nums md:table-cell"><time dateTime={report.updated_at}>{formatDateTime(report.updated_at)}</time></TableCell>
              <TableCell className="pr-4"><ArrowUpRight aria-hidden="true" className="ml-auto size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
