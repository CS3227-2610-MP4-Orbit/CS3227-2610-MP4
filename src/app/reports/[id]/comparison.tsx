"use client";

import { useMemo, useState } from "react";
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
  const background = side.kind === "removed" ? "bg-rose-50" : side.kind === "added" ? "bg-emerald-50" : "bg-white";
  const prefix = side.kind === "removed" ? "−" : side.kind === "added" ? "+" : " ";
  return <div className={`flex min-w-0 border-b border-slate-100 font-mono text-xs ${background}`}>
    <span aria-hidden="true" className="w-12 shrink-0 select-none border-r border-slate-100 px-2 text-right text-slate-500">{side.number ?? ""}</span>
    <span className="min-w-0 px-2 whitespace-pre">
      {side.kind === "removed" && <span className="sr-only">Removed line: </span>}
      {side.kind === "added" && <span className="sr-only">Added line: </span>}
      <span aria-hidden="true" className="mr-2 select-none font-bold">{prefix}</span><code>{side.text || " "}</code>
    </span>
  </div>;
}

function CodeComparison({ original, proposed }: { original: string; proposed: string }) {
  const comparison = useMemo(() => compareLines(original, proposed), [original, proposed]);
  return <div className="overflow-x-auto rounded-lg border border-slate-200" aria-label="Original and proposed Python code comparison">
    <div className="min-w-[700px]">
      <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-100 text-sm font-semibold">
        <div className="px-3 py-2">Original code</div><div className="border-l border-slate-200 px-3 py-2">Proposed fix</div>
      </div>
      {comparison.kind === "fallback" ? <div>
        <p className="border-b border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">This snippet is too large to highlight line changes. Both versions are shown as text.</p>
        <div className="grid grid-cols-2 divide-x divide-slate-200">
          <pre className="overflow-x-auto p-3 text-xs whitespace-pre">{original}</pre>
          <pre className="overflow-x-auto p-3 text-xs whitespace-pre">{proposed}</pre>
        </div>
      </div> : <div className="max-h-[36rem] overflow-y-auto">
        {comparison.rows.map((row, index) => <div key={index} className="grid grid-cols-2 divide-x divide-slate-200">
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
  return <section id="comparison" aria-labelledby="comparison-heading" className="mt-10 space-y-4 border-t pt-6">
    <h2 id="comparison-heading" className="text-xl font-semibold">Original versus proposed fix</h2>
    {loadError ? <p role="alert" className="text-red-700">Could not load proposed fixes. Please try again later.</p> : selected ? <>
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="revision-select" className="text-sm font-medium">Revision</label>
        <select id="revision-select" value={selected.id} onChange={(event) => setSelectedId(event.target.value)} className="rounded border border-slate-300 bg-white px-3 py-2 text-sm">
          {ordered.map((revision) => <option key={revision.id} value={revision.id}>Version {revision.revision_number}</option>)}
        </select>
        <span className="text-sm text-slate-600">Latest version is selected first.</span>
      </div>
      <p className="text-sm text-slate-700">Version {selected.revision_number} by {selected.author_name?.trim() || `Developer account ${selected.author_id}`} · <time dateTime={selected.created_at}>{selected.created_at}</time></p>
      {selected.note && <p className="rounded border border-slate-200 bg-slate-50 p-3 text-sm whitespace-pre-wrap break-words">Developer note: {selected.note}</p>}
      <CodeComparison original={original} proposed={selected.code} />
    </> : <p className="text-slate-600">No proposed fix yet. A Developer revision will appear here when one is submitted.</p>}
  </section>;
}
