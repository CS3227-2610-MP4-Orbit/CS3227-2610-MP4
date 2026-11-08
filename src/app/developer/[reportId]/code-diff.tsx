"use client";

import { compareLines } from "../../../lib/reports/line-diff";

export function CodeDiff({ original, revised }: { original: string; revised: string }) {
  const comparison = compareLines(original, revised);
  return <div aria-label="Code comparison" className="overflow-x-auto rounded bg-gray-950 p-3 font-mono text-sm text-gray-100">
    {comparison.kind === "fallback" ? <>
      <pre className="border-b border-gray-700 whitespace-pre-wrap">{original}</pre>
      <pre className="whitespace-pre-wrap">{revised}</pre>
    </> : comparison.rows.flatMap((row, index) => {
      const rendered = [];
      if (row.original.kind === "same") {
        rendered.push(<div key={`${index}-same`}><span className="mr-3 select-none text-gray-400"> </span>{row.original.text}</div>);
      } else if (row.original.kind === "removed") {
        rendered.push(<div key={`${index}-removed`} className="bg-red-900/50"><span className="mr-3 select-none text-gray-400">-</span>{row.original.text}</div>);
      }
      if (row.proposed.kind === "added") {
        rendered.push(<div key={`${index}-added`} className="bg-green-900/50"><span className="mr-3 select-none text-gray-400">+</span>{row.proposed.text}</div>);
      }
      return rendered;
    })}
  </div>;
}
