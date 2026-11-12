import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Every AI feature uses violet and a sparkle, so an AI suggestion never looks like a human
 * decision or a recorded result.
 */
export function AiPanel({ id, headingId, title, description, action, children, className, as: Tag = "section", level = 2 }: {
  level?: 2 | 3 | 4; id?: string; headingId: string; title: string; description: ReactNode; action?: ReactNode; children?: ReactNode; className?: string; as?: "section" | "div";
}) {
  const Heading = `h${level}` as "h2" | "h3" | "h4";
  return (
    <Tag id={id} aria-labelledby={headingId} className={cn("space-y-3 rounded-xl border border-violet-200/80 bg-linear-to-b from-violet-50/80 to-card p-4", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span aria-hidden="true" className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-violet-600 text-white shadow-sm shadow-violet-600/30"><Sparkles className="size-3.5" /></span>
          <div className="min-w-0">
            <Heading id={headingId} className="text-sm font-semibold text-violet-950">{title}</Heading>
            <p className="mt-0.5 text-xs text-pretty text-violet-900/70">{description}</p>
          </div>
        </div>
        {action}
      </div>
      {children}
    </Tag>
  );
}

/** The AI output itself, always labelled as unchecked. */
export function AiOutput({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="status" aria-live="polite">
      <p className="text-[11px] font-semibold tracking-wide text-violet-700 uppercase">{label}</p>
      <div className="mt-1.5 rounded-lg border border-violet-200 bg-card p-3 text-sm leading-relaxed break-words whitespace-pre-wrap text-foreground">{children}</div>
    </div>
  );
}

export const aiButton = "border-violet-300 bg-card text-violet-900 hover:bg-violet-100 hover:text-violet-950";
