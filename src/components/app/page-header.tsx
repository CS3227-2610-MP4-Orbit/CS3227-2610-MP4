import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** The top of every page: a small eyebrow, the title, a line of context and the main actions. */
export function PageHeader({ eyebrow, title, description, actions, meta, className }: {
  eyebrow?: ReactNode; title: ReactNode; description?: ReactNode; actions?: ReactNode; meta?: ReactNode; className?: string;
}) {
  return (
    <header className={cn("flex flex-wrap items-start justify-between gap-x-6 gap-y-4", className)}>
      <div className="min-w-0 space-y-1.5">
        {eyebrow && <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold tracking-tight text-balance text-foreground sm:text-[1.75rem]">{title}</h1>
        {description && <p className="max-w-2xl text-sm text-pretty text-muted-foreground">{description}</p>}
        {meta && <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-1 text-sm text-muted-foreground">{meta}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/** Page width and rhythm shared by every signed-in screen. */
export function PageContainer({ children, className, wide = false }: { children: ReactNode; className?: string; wide?: boolean }) {
  return <main className={cn("mx-auto flex w-full flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8", wide ? "max-w-[88rem]" : "max-w-6xl", className)}>{children}</main>;
}
