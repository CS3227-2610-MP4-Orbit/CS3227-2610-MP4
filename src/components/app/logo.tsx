import { Bug } from "lucide-react";

import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn("brand-mark flex size-8 shrink-0 items-center justify-center rounded-lg text-white shadow-sm ring-1 ring-black/5", className)}>
      <Bug className="size-4" strokeWidth={2.25} />
    </span>
  );
}

export function Logo({ className, subtitle }: { className?: string; subtitle?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="grid leading-tight">
        <span className="text-sm font-semibold tracking-tight">BugFlow</span>
        {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
      </span>
    </span>
  );
}
