import { describe, expect, it } from "vitest";
import { compareLines } from "./line-diff";

describe("compareLines", () => {
  it("marks replaced, added and unchanged Python lines with aligned numbers", () => {
    const result = compareLines("def run():\n    return 1\n", "def run():\n    return 2\n    # safe\n");
    expect(result.kind).toBe("rows");
    if (result.kind !== "rows") return;
    expect(result.rows[0]).toEqual({
      original: { number: 1, text: "def run():", kind: "same" },
      proposed: { number: 1, text: "def run():", kind: "same" },
    });
    expect(result.rows[1].original.kind).toBe("removed");
    expect(result.rows[1].proposed.kind).toBe("added");
    expect(result.rows[2].original.kind).toBe("empty");
    expect(result.rows[2].proposed.text).toBe("    # safe");
  });

  it("keeps identical source unchanged and preserves a blank last line", () => {
    const result = compareLines("print(1)\n\n", "print(1)\n\n");
    expect(result.kind).toBe("rows");
    if (result.kind !== "rows") return;
    expect(result.rows.map((row) => row.original.text)).toEqual(["print(1)", ""]);
    expect(result.rows.every((row) => row.original.kind === "same")).toBe(true);
  });

  it("falls back for line-heavy code within the 20,000-character storage limit", () => {
    const source = "x\n".repeat(1600);
    expect(source.length).toBeLessThan(20000);
    expect(compareLines(source, source)).toEqual({ kind: "fallback" });
  });

  it("falls back deterministically for oversized source", () => {
    const source = "x".repeat(20001);
    expect(compareLines(source, source)).toEqual({ kind: "fallback" });
  });
});
