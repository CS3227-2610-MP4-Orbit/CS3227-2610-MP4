"use client";

import { useMemo, useState } from "react";
import { GitCompareArrows } from "lucide-react";

import { EmptyState } from "@/components/app/empty-state";
import { Notice } from "@/components/app/notice";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

import { compareLines, type LineSide } from "../../../lib/reports/line-diff";

export type FixRevision = {
  id: string;
  report_id: string;
  revision_number: number;
  author_id: string;
  author_name?: string;
  code: string;
  note: string;
  created_at: string;
};

type Props = {
  original: string;
  revisions: FixRevision[];
  loadError?: boolean;
};

export function selectRevision(revisions: FixRevision[], id?: string): FixRevision | undefined {
  const ordered = [...revisions].sort((a, b) => b.revision_number - a.revision_number);
  return ordered.find((revision) => revision.id === id) ?? ordered[0];
}

function SourceLine({ side }: { side: LineSide }) {
  const tone = side.kind === "removed" ? "bg-rose-500/10" : side.kind === "added" ? "bg-emerald-500/10" : "";
  const gutter = side.kind === "removed" ? "bg-rose-500/15 text-rose-700" : side.kind === "added" ? "bg-emerald-500/15 text-emerald-700" : "text-muted-foreground/70";
  const prefix = side.kind === "removed" ? "−" : side.kind === "added" ? "+" : " ";
  return <div className={cn("flex min-w-0 font-mono text-[12.5px] leading-6", tone)}>
    <span aria-hidden="true" className={cn("w-11 shrink-0 pr-2 text-right tabular-nums select-none", gutter)}>{side.number ?? ""}</span>
    <span className="min-w-0 px-2 whitespace-pre">
      {side.kind === "removed" && <span className="sr-only">Removed line: </span>}
      {side.kind === "added" && <span className="sr-only">Added line: </span>}
      <span aria-hidden="true" className={cn("mr-2 select-none", side.kind === "removed" ? "text-rose-600" : side.kind === "added" ? "text-emerald-600" : "text-transparent")}>{prefix}</span><code>{side.text || " "}</code>
    </span>
  </div>;
}

function CodeComparison({ original, proposed }: { original: string; proposed: string }) {
  const comparison = useMemo(() => compareLines(original, proposed), [original, proposed]);
  const counts = comparison.kind === "fallback" ? null : comparison.rows.reduce((total, row) => ({
    added: total.added + (row.proposed.kind === "added" ? 1 : 0),
    removed: total.removed + (row.original.kind === "removed" ? 1 : 0),
  }), { added: 0, removed: 0 });
  return <div className="relative overflow-x-auto rounded-lg border bg-card" aria-label="Original and proposed Python code comparison">
    <div className="min-w-[700px]">
      <div className="grid grid-cols-2 border-b bg-muted/60 text-xs font-medium text-muted-foreground">
        <div className="flex items-center gap-2 px-3 py-2"><span aria-hidden="true" className="size-2 rounded-full bg-rose-400" />Original code</div>
        <div className="flex items-center justify-between gap-2 border-l px-3 py-2">
          <span className="flex items-center gap-2"><span aria-hidden="true" className="size-2 rounded-full bg-emerald-500" />Proposed fix</span>
          {counts && <span className="font-mono tabular-nums"><span className="text-emerald-700">+{counts.added}</span> <span className="text-rose-700">−{counts.removed}</span></span>}
        </div>
      </div>
      {comparison.kind === "fallback" ? <div>
        <p className="border-b border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">This snippet is too large to highlight line changes. Both versions are shown as text.</p>
        <div className="grid grid-cols-2 divide-x">
          <pre className="overflow-x-auto p-3 font-mono text-xs whitespace-pre">{original}</pre>
          <pre className="overflow-x-auto p-3 font-mono text-xs whitespace-pre">{proposed}</pre>
        </div>
      </div> : <div className="max-h-[36rem] overflow-y-auto py-1">
        {comparison.rows.map((row, index) => <div key={index} className="grid grid-cols-2 divide-x">
          <SourceLine side={row.original} /><SourceLine side={row.proposed} />
        </div>)}
      </div>}
    </div>
  </div>;
}

export function FixComparison({ original, revisions, loadError = false }: Props) {
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const ordered = useMemo(() => [...revisions].sort((a, b) => b.revision_number - a.revision_number), [revisions]);
  const selected = selectRevision(ordered, selectedId);
  return <section id="comparison" aria-labelledby="comparison-heading" className="space-y-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 id="comparison-heading" className="font-semibold">Original versus proposed fix</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">Line-by-line changes between the reported code and the Developer&apos;s fix.</p>
      </div>
      {!loadError && selected && <div className="flex items-center gap-2">
        <label htmlFor="revision-select" className="text-sm font-medium">Revision</label>
        <NativeSelect id="revision-select" value={selected.id} onChange={(event) => setSelectedId(event.target.value)}>
          {ordered.map((revision) => <NativeSelectOption key={revision.id} value={revision.id}>Version {revision.revision_number}</NativeSelectOption>)}
        </NativeSelect>
      </div>}
    </div>
    {loadError ? <Notice tone="error">Could not load proposed fixes. Please try again later.</Notice> : selected ? <>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
        <p><span className="font-medium text-foreground">Version {selected.revision_number} by {selected.author_name?.trim() || "the Developer"}</span> · <time dateTime={selected.created_at}>{formatDateTime(selected.created_at)}</time></p>
        {ordered.length > 1 && <span className="text-xs">Latest version is selected first.</span>}
      </div>
      {selected.note && <p className="rounded-lg border-l-2 border-sky-400 bg-sky-50/60 px-3 py-2 text-sm break-words whitespace-pre-wrap text-foreground"><span className="font-medium">Developer note:</span> {selected.note}</p>}
      <CodeComparison original={original} proposed={selected.code} />
    </> : <EmptyState className="py-10" icon={<GitCompareArrows />} title="No proposed fix yet" description="A Developer revision will appear here when one is submitted." />}
  </section>;
}
