import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * One colour per lifecycle stage, used everywhere a status appears:
 * grey = not started, blue = being fixed, amber = waiting on QA, green = closed.
 */
export const STATUS = {
  open: { label: "Open", dot: "bg-zinc-400", badge: "bg-zinc-100 text-zinc-700 ring-zinc-200" },
  in_progress: { label: "In progress", dot: "bg-sky-500", badge: "bg-sky-50 text-sky-800 ring-sky-200" },
  awaiting_qa: { label: "Awaiting QA", dot: "bg-amber-500", badge: "bg-amber-50 text-amber-800 ring-amber-200" },
  closed: { label: "Closed", dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
} as const;

export type Status = keyof typeof STATUS;

const meta = (status: string) => STATUS[status as Status] ?? STATUS.open;

export function statusLabel(status: string) {
  return STATUS[status as Status]?.label ?? status.replaceAll("_", " ");
}

/** A status pill. `label` lets a role phrase the stage its own way (QA says "With Developer"). */
export function StatusBadge({ status, label, className }: { status: string; label?: string; className?: string }) {
  const m = meta(status);
  return (
    <span className={cn("inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset", m.badge, className)}>
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", m.dot)} />
      {label ?? m.label}
    </span>
  );
}

export function StatusDot({ status, className }: { status: string; className?: string }) {
  return <span aria-hidden="true" className={cn("inline-block size-2 rounded-full", meta(status).dot, className)} />;
}

const STAGES: { status: Status; label: string }[] = [
  { status: "open", label: "Reported" },
  { status: "in_progress", label: "In progress" },
  { status: "awaiting_qa", label: "QA review" },
  { status: "closed", label: "Closed" },
];

/** Where the report is in Report → Fix → Verify → Closed. */
export function StatusStepper({ status, className, vertical = false }: { status: string; className?: string; vertical?: boolean }) {
  const current = Math.max(0, STAGES.findIndex((stage) => stage.status === status));
  return (
    <ol aria-label="Report progress" className={cn("flex w-full text-xs", vertical ? "flex-col gap-2.5" : "items-center gap-2", className)}>
      {STAGES.map((stage, index) => {
        const done = index < current || status === "closed";
        const active = index === current && status !== "closed";
        return (
          <li key={stage.status} aria-current={active ? "step" : undefined} className={cn("flex min-w-0 items-center gap-2", !vertical && "flex-1")}>
            <span className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ring-1 ring-inset",
              done && "bg-primary text-primary-foreground ring-primary",
              active && cn("bg-card ring-2", status === "awaiting_qa" ? "text-amber-700 ring-amber-400" : status === "in_progress" ? "text-sky-700 ring-sky-400" : "text-foreground ring-zinc-400"),
              !done && !active && "bg-card text-muted-foreground ring-border",
            )}>
              {done ? <Check className="size-3" strokeWidth={3} /> : index + 1}
            </span>
            <span className={cn("truncate", vertical && "text-sm", active ? "font-medium text-foreground" : done ? "text-foreground" : "text-muted-foreground")}>{stage.label}</span>
            {!vertical && index < STAGES.length - 1 && <span aria-hidden="true" className={cn("h-px min-w-3 flex-1", index < current || status === "closed" ? "bg-primary/60" : "bg-border")} />}
          </li>
        );
      })}
    </ol>
  );
}
