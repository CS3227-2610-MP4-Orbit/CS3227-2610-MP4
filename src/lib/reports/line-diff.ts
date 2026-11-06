import { diffLines } from "diff";

export type LineSide = { number: number | null; text: string; kind: "same" | "added" | "removed" | "empty" };
export type LineRow = { original: LineSide; proposed: LineSide };
export type LineComparison = { kind: "rows"; rows: LineRow[] } | { kind: "fallback" };

function lines(value: string): string[] {
  if (!value) return [];
  const parts = value.split("\n");
  if (value.endsWith("\n")) parts.pop();
  return parts;
}

/** Fixed limits keep SSR and hydration identical while bounding diff work. */
export function compareLines(original: string, proposed: string, maxLines = 1500): LineComparison {
  if (original.length > 20000 || proposed.length > 20000 || lines(original).length > maxLines || lines(proposed).length > maxLines) return { kind: "fallback" };
  const chunks = diffLines(original, proposed, { maxEditLength: 1500 });
  if (!chunks) return { kind: "fallback" };

  const rows: LineRow[] = [];
  let oldNumber = 1;
  let newNumber = 1;
  let removed: string[] = [];
  let added: string[] = [];
  const flush = () => {
    for (let index = 0; index < Math.max(removed.length, added.length); index++) {
      const oldText = removed[index];
      const newText = added[index];
      rows.push({
        original: oldText === undefined ? { number: null, text: "", kind: "empty" } : { number: oldNumber++, text: oldText, kind: "removed" },
        proposed: newText === undefined ? { number: null, text: "", kind: "empty" } : { number: newNumber++, text: newText, kind: "added" },
      });
    }
    removed = [];
    added = [];
  };

  for (const chunk of chunks) {
    const chunkLines = lines(chunk.value);
    if (chunk.removed) removed.push(...chunkLines);
    else if (chunk.added) added.push(...chunkLines);
    else {
      flush();
      for (const text of chunkLines) rows.push({
        original: { number: oldNumber++, text, kind: "same" },
        proposed: { number: newNumber++, text, kind: "same" },
      });
    }
  }
  flush();
  return { kind: "rows", rows };
}
