import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function EmptyState({ icon, title, description, action, className, headingId }: {
  icon: ReactNode; title: string; description: ReactNode; action?: ReactNode; className?: string; headingId?: string;
}) {
  return (
    <section aria-labelledby={headingId} className={cn("flex flex-col items-center rounded-xl border border-dashed bg-card/60 px-6 py-14 text-center", className)}>
      <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground ring-1 ring-border [&_svg]:size-5">{icon}</span>
      <h2 id={headingId} className="mt-4 text-sm font-semibold">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </section>
  );
}
