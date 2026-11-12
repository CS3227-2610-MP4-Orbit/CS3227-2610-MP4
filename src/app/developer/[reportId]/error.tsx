"use client";

import { RotateCw, TriangleAlert } from "lucide-react";

import { PageContainer } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  void error;
  return (
    <PageContainer>
      <div className="flex flex-col items-center rounded-xl border border-dashed bg-card px-6 py-16 text-center">
        <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-lg bg-rose-50 text-rose-600 ring-1 ring-rose-200"><TriangleAlert className="size-5" /></span>
        <h1 className="mt-4 text-lg font-semibold">Report unavailable</h1>
        <p className="mt-1 text-sm text-muted-foreground">The report could not be loaded.</p>
        <Button variant="outline" className="mt-5" onClick={() => reset()}><RotateCw aria-hidden="true" />Retry</Button>
      </div>
    </PageContainer>
  );
}
