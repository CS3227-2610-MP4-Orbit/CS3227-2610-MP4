import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { CalendarDays } from "lucide-react";

import { CodeBlock, DetailField } from "@/components/app/code-block";
import { Notice } from "@/components/app/notice";
import { PageContainer, PageHeader } from "@/components/app/page-header";
import { StatusBadge, StatusStepper } from "@/components/app/status";
import { TopBar } from "@/components/app/top-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format";
import { canUseLegacyLocalReports } from "@/lib/reports/legacy-local";
import type { ReportValues } from "@/lib/reports/validation";
import { createClient } from "@/lib/supabase/server";

import { ReportForm } from "../report-form";
import { updateReport } from "./actions";
import { explainReport } from "./ai-actions";
import { AiExplanation } from "./ai-explanation";
import { FixComparison, type FixRevision } from "./comparison";
import { FeedbackSection, type FeedbackEntry } from "./feedback-section";

export const metadata: Metadata = { title: "Report" };

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SECTIONS = [["#report-details", "Details"], ["#report-ai", "AI explanation"], ["#report-feedback", "Feedback"], ["#report-comparison", "Fix comparison"]] as const;

export default function ReportPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  return (
    <Suspense fallback={<><TopBar crumbs={[{ label: "Reporter" }, { label: "My reports", href: "/reports" }, { label: "Report" }]} /><PageContainer wide><p className="sr-only">Loading report…</p><Skeleton className="h-20 w-2/3" /><Skeleton className="h-12 w-full" /><Skeleton className="h-96 w-full" /></PageContainer></>}>
      <ReporterReport params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ReporterReport({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  await connection();
  const { id } = await params;
  if (!uuid.test(id)) notFound();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "reporter") notFound();
  const primary = await supabase.from("bug_reports")
    .select("id,reporter_id,title,python_code:code,error_message,expected_behavior,actual_behavior,reproduction_steps,status,created_at")
    .eq("id", id).eq("reporter_id", user.id).maybeSingle();
  const legacy = canUseLegacyLocalReports(primary.error);
  const result = legacy ? await supabase.from("bug_reports")
    .select("id,reporter_id,title,python_code,error_message,expected_behavior,actual_behavior,reproduction_steps,status,created_at")
    .eq("id", id).eq("reporter_id", user.id).maybeSingle() : primary;
  if (result.error) return <PageContainer><Notice tone="error">Could not load this report. Please try again.</Notice></PageContainer>;
  const report = result.data;
  if (!report) notFound();
  const values: ReportValues = {
    title: report.title, python_code: report.python_code, error_message: report.error_message,
    expected_behavior: report.expected_behavior, actual_behavior: report.actual_behavior,
    reproduction_steps: report.reproduction_steps,
  };
  const { data: revisions, error: revisionError } = legacy ? { data: [], error: null } : await supabase.from("fix_revisions")
    .select("id,report_id,revision_number,author_id,code,note,created_at")
    .eq("report_id", report.id)
    .order("revision_number", { ascending: false });
  const { data: feedback, error: feedbackError } = await supabase.from("bug_feedback")
    .select("id,author_role,body,created_at")
    .eq("report_id", report.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });
  const { saved } = await searchParams;
  const editable = report.status === "open";

  return (
    <>
      <TopBar crumbs={[{ label: "Reporter" }, { label: "My reports", href: "/reports" }, { label: report.title }]} />
      <PageContainer wide>
        <PageHeader
          eyebrow="Bug report"
          title={report.title}
          meta={<>
            <StatusBadge status={report.status} />
            <span className="flex items-center gap-1.5"><CalendarDays className="size-3.5" aria-hidden="true" />Created {formatDateTime(report.created_at)}</span>
          </>}
        />
        <div className="rounded-xl bg-card px-4 py-3.5 ring-1 ring-foreground/10"><StatusStepper status={report.status} /></div>
        <nav aria-label="Report sections" className="-mb-2 flex gap-1 overflow-x-auto border-b">
          {SECTIONS.map(([href, label]) => (
            <a key={href} href={href} className="-mb-px border-b-2 border-transparent px-3 py-2.5 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground focus-visible:border-ring focus-visible:text-foreground focus-visible:outline-none">{label}</a>
          ))}
        </nav>
        {saved === "1" && <Notice tone="success">Report saved.</Notice>}
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(20rem,1fr)]">
          <section id="report-details" aria-label="Report details" className="min-w-0 space-y-3">
            {editable ? (
              <>
                <Notice tone="info">You can still edit this report. Editing locks once a Developer starts work.</Notice>
                <ReportForm action={updateReport.bind(null, id)} initialValues={values} submitLabel="Save changes" />
              </>
            ) : (
              <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
                <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
                  <h2 className="font-semibold">Your report</h2>
                  <span className="text-xs text-muted-foreground">Read-only once work starts</span>
                </div>
                <div className="space-y-6 p-5">
                  <section className="min-w-0"><h3 className="sr-only">Python code</h3><CodeBlock code={values.python_code} label="Python code" /></section>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <DetailField label="Error message" value={values.error_message} mono />
                    <DetailField label="Expected behavior" value={values.expected_behavior} />
                    <DetailField label="Actual behavior" value={values.actual_behavior} />
                    <DetailField label="Reproduction steps" value={values.reproduction_steps} />
                  </div>
                </div>
              </div>
            )}
          </section>
          <aside aria-label="Report guidance and feedback" className="min-w-0 space-y-5 lg:sticky lg:top-20">
            <AiExplanation action={explainReport.bind(null, id)} />
            <FeedbackSection entries={feedbackError ? [] : (feedback ?? []) as FeedbackEntry[]} loadError={!!feedbackError} />
          </aside>
        </div>
        <div id="report-comparison">
          <FixComparison original={values.python_code} revisions={revisionError ? [] : (revisions ?? []) as FixRevision[]} loadError={!!revisionError} />
        </div>
      </PageContainer>
    </>
  );
}
