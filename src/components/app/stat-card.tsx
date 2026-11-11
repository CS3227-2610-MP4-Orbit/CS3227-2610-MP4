import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { StatusDot } from "./status";

/** A count with its status colour, for the summary row on each queue. */
export function StatCard({ label, value, status, hint, className }: { label: string; value: number; status?: string; hint?: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl bg-card p-4 ring-1 ring-foreground/10", className)}>
      <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">{status && <StatusDot status={status} />}{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function StatGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{children}</div>;
}
