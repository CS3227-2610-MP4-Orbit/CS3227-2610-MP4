"use client";

import { compareLines } from "../../../lib/reports/line-diff";

// Unified diff on a dark surface. No hooks, so it can render anywhere (and in tests).
const line = "flex px-3 whitespace-pre";
const mark = "mr-3 w-3 shrink-0 select-none text-zinc-500";

export function CodeDiff({ original, revised }: { original: string; revised: string }) {
  const comparison = compareLines(original, revised);
  return <div aria-label="Code comparison" className="mt-3 overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 py-2 font-mono text-[12.5px] leading-6 text-zinc-100">
    {comparison.kind === "fallback" ? <>
      <pre className="border-b border-zinc-800 px-3 pb-2 whitespace-pre-wrap">{original}</pre>
      <pre className="px-3 pt-2 whitespace-pre-wrap">{revised}</pre>
    </> : comparison.rows.flatMap((row, index) => {
      const rendered = [];
      if (row.original.kind === "same") {
        rendered.push(<div key={`${index}-same`} className={line}><span className={mark}> </span>{row.original.text}</div>);
      } else if (row.original.kind === "removed") {
        rendered.push(<div key={`${index}-removed`} className={`${line} bg-rose-500/15 text-rose-100`}><span className="mr-3 w-3 shrink-0 text-rose-400 select-none">-</span>{row.original.text}</div>);
      }
      if (row.proposed.kind === "added") {
        rendered.push(<div key={`${index}-added`} className={`${line} bg-emerald-500/15 text-emerald-100`}><span className="mr-3 w-3 shrink-0 text-emerald-400 select-none">+</span>{row.proposed.text}</div>);
      }
      return rendered;
    })}
  </div>;
}
