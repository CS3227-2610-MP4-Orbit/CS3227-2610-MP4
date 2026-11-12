import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { PageContainer, PageHeader } from "@/components/app/page-header";
import { TopBar } from "@/components/app/top-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/server";

import { ReportForm } from "../report-form";
import { createReport } from "./actions";
import { checkReportQuality } from "./check-quality";

export const metadata: Metadata = { title: "New report" };

export default function NewReportPage() {
  return (
    <>
      <TopBar crumbs={[{ label: "Reporter" }, { label: "My reports", href: "/reports" }, { label: "New report" }]} />
      <Suspense fallback={<PageContainer><p className="sr-only">Loading report form…</p><Skeleton className="h-16 w-80" /><Skeleton className="h-[32rem] w-full" /></PageContainer>}>
        <AuthenticatedReportForm />
      </Suspense>
    </>
  );
}

async function AuthenticatedReportForm() {
  // Supabase auth checks the current time while creating/refreshing a session.
  // Keep that work out of the prerendered shell.
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile, error: profileError } = await supabase.from("profiles")
    .select("role").eq("id", user.id).single();
  if (profileError || profile?.role !== "reporter") redirect("/reports");
  return (
    <PageContainer>
      <PageHeader eyebrow="New report" title="Submit a Python bug" description="Describe the issue and paste a small Python example. Code is stored as text and is never run." />
      <ReportForm action={createReport} qualityCheck={checkReportQuality} submitLabel="Submit report" />
    </PageContainer>
  );
}
