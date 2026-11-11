import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { ArrowUpRight, Inbox, Plus } from "lucide-react";

import { EmptyState } from "@/components/app/empty-state";
import { Notice } from "@/components/app/notice";
import { PageContainer, PageHeader } from "@/components/app/page-header";
import { StatCard, StatGrid } from "@/components/app/stat-card";
import { StatusBadge } from "@/components/app/status";
import { TopBar } from "@/components/app/top-bar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "My reports" };

export default function ReportsPage({ searchParams }: { searchParams: Promise<{ submitted?: string }> }) {
  return (
    <>
      <TopBar crumbs={[{ label: "Reporter" }, { label: "My reports" }]} />
      <Suspense fallback={<PageContainer><p className="sr-only">Loading reports…</p><Skeleton className="h-16 w-72" /><Skeleton className="h-24 w-full" /><Skeleton className="h-64 w-full" /></PageContainer>}>
        <ReporterReports searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function ReporterReports({ searchParams }: { searchParams: Promise<{ submitted?: string }> }) {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "reporter") return <PageContainer><h1 className="text-xl font-semibold">Reporter access required</h1></PageContainer>;
  const { data: reports, error } = await supabase.from("bug_reports")
    .select("id,title,status,created_at").eq("reporter_id", user.id)
    .order("created_at", { ascending: false }).order("id", { ascending: false });
  const { submitted } = await searchParams;
  const count = (status: string) => reports?.filter((report) => report.status === status).length ?? 0;
  const newReport = <Button asChild size="lg"><Link href="/reports/new"><Plus aria-hidden="true" />New report</Link></Button>;

  return (
    <PageContainer>
      <PageHeader eyebrow="Reporter workspace" title="My bug reports" description="Everything you have reported, newest first. Open a report to follow the fix and read feedback." actions={newReport} />
      {submitted === "1" && (
        <Notice tone="success">Your bug report was submitted.</Notice>
      )}
      {error ? <Notice tone="error">Could not load reports. Please try again.</Notice> : reports?.length ? (
        <>
          <StatGrid>
            <StatCard label="All reports" value={reports.length} />
            <StatCard label="Being fixed" value={count("open") + count("in_progress")} status="in_progress" hint="Open or in progress" />
            <StatCard label="Awaiting QA" value={count("awaiting_qa")} status="awaiting_qa" />
            <StatCard label="Closed" value={count("closed")} status="closed" />
          </StatGrid>
          <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4">Report</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Created</TableHead>
                  <TableHead className="w-10 pr-4"><span className="sr-only">Open</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id} className="group relative">
                    <TableCell className="max-w-0 py-3.5 pl-4 sm:max-w-none">
                      <Link href={`/reports/${report.id}`} className="block truncate font-medium text-foreground after:absolute after:inset-0 focus-visible:underline focus-visible:outline-none">{report.title}</Link>
                      <span className="mt-0.5 block text-xs text-muted-foreground md:hidden">{formatDateTime(report.created_at)}</span>
                    </TableCell>
                    <TableCell><StatusBadge status={report.status} /></TableCell>
                    <TableCell className="hidden text-muted-foreground tabular-nums md:table-cell">{formatDateTime(report.created_at)}</TableCell>
                    <TableCell className="pr-4 text-right"><ArrowUpRight aria-hidden="true" className="ml-auto size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      ) : (
        <EmptyState icon={<Inbox />} title="You have no bug reports yet." description={<>Report a Python bug with a small snippet and the error you saw. <Link href="/reports/new" className="font-medium text-foreground underline underline-offset-4">Submit your first report</Link>.</>} />
      )}
    </PageContainer>
  );
}
