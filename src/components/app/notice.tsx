import type { ReactNode } from "react";
import { CircleAlert, CircleCheck, Info } from "lucide-react";

import { cn } from "@/lib/utils";

const TONES = {
  success: { icon: CircleCheck, className: "border-emerald-200 bg-emerald-50 text-emerald-900", role: "status" },
  error: { icon: CircleAlert, className: "border-destructive/25 bg-destructive/5 text-destructive", role: "alert" },
  info: { icon: Info, className: "border-sky-200 bg-sky-50 text-sky-900", role: "status" },
} as const;

/** A one-line message with the right live-region role for its tone. */
export function Notice({ tone, children, className, role }: { tone: keyof typeof TONES; children: ReactNode; className?: string; role?: "status" | "alert" }) {
  const { icon: Icon, className: toneClass, role: defaultRole } = TONES[tone];
  return (
    <p role={role ?? defaultRole} className={cn("flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm", toneClass, className)}>
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span className="min-w-0">{children}</span>
    </p>
  );
}
