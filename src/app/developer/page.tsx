import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";

import { Notice } from "@/components/app/notice";
import { PageContainer, PageHeader } from "@/components/app/page-header";
import { TopBar } from "@/components/app/top-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { getAssignedDeveloperReports } from "@/lib/developer/queries";

import { DeveloperDashboard } from "./developer-dashboard";

export const metadata: Metadata = { title: "Assigned bugs" };

const crumbs = [{ label: "Developer" }, { label: "Assigned bugs" }];

export default function DeveloperPage() {
  return (
    <Suspense fallback={<><TopBar crumbs={crumbs} /><PageContainer><p className="sr-only">Loading assigned bugs…</p><Skeleton className="h-16 w-72" /><Skeleton className="h-24 w-full" /><Skeleton className="h-64 w-full" /></PageContainer></>}>
      <AssignedBugs />
    </Suspense>
  );
}

// Reading the session uses the current time, so this renders at request time.
async function AssignedBugs() {
  await connection();
  const result = await getAssignedDeveloperReports();

  if (result.kind === "denied") {
    return (
      <>
        <TopBar crumbs={crumbs} />
        <PageContainer>
          <PageHeader title="Developer workspace" />
          <Notice tone="error">You do not have permission to access the Developer workspace.</Notice>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <TopBar crumbs={crumbs} />
      <PageContainer>
        <PageHeader eyebrow="Developer workspace" title="Assigned bugs" description="Review the bugs assigned to you and continue investigation. Rejected fixes come back here with QA feedback." />
        <DeveloperDashboard reports={result.reports} />
      </PageContainer>
    </>
  );
}
