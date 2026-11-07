"use client";

function lines(value: string) { return value ? value.split("\n") : []; }

export function CodeDiff({ original, revised }: { original: string; revised: string }) {
  const oldLines = lines(original); const newLines = lines(revised); const max = Math.max(oldLines.length, newLines.length);
  return <div aria-label="Code comparison" className="overflow-x-auto rounded bg-gray-950 p-3 font-mono text-sm text-gray-100">
    {Array.from({ length: max }, (_, index) => {
      const oldLine = oldLines[index]; const newLine = newLines[index];
      const kind = oldLine === newLine ? " " : oldLine === undefined ? "+" : newLine === undefined ? "-" : "~";
      return <div key={index} className={kind === "+" ? "bg-green-900/50" : kind === "-" ? "bg-red-900/50" : kind === "~" ? "bg-yellow-900/40" : ""}><span className="mr-3 select-none text-gray-400">{kind}</span>{kind === "-" ? oldLine : newLine}</div>;
    })}
  </div>;
}
