import { cn } from "@/lib/utils";

/** Read-only Python with line numbers. Rendered as text, so code is never interpreted. */
export function CodeBlock({ code, className, label }: { code: string; className?: string; label?: string }) {
  const lines = code.replace(/\n$/, "").split("\n");
  return (
    <div className={cn("overflow-hidden rounded-lg border bg-zinc-950 text-zinc-100", className)}>
      {label && <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-xs text-zinc-400"><span>{label}</span><span>Python</span></div>}
      <pre className="max-h-[28rem] overflow-auto py-3 font-mono text-[13px] leading-6"><code>{lines.map((line, index) => (
        <span key={index} className="flex">
          <span aria-hidden="true" className="w-10 shrink-0 pr-3 text-right text-zinc-500 select-none">{index + 1}</span>
          <span className="pr-4 whitespace-pre">{line || " "}</span>
        </span>
      ))}</code></pre>
    </div>
  );
}

/** A labelled block of reporter-written text, shown exactly as written. */
export function DetailField({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</h3>
      <p className={cn("mt-1.5 text-sm leading-relaxed break-words whitespace-pre-wrap text-foreground", mono && "rounded-md bg-muted px-2.5 py-2 font-mono text-[13px]")}>{value || "—"}</p>
    </div>
  );
}
