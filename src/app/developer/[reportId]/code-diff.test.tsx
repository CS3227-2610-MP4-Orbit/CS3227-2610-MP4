import { describe, expect, it } from "vitest";
import { CodeDiff } from "./code-diff";

describe("CodeDiff", () => {
  it("marks unchanged, added, and removed lines without executing code", () => {
    const result = CodeDiff({ original: "same\nremoved", revised: "same\nadded\nnew" });
    expect(result).toBeTruthy();
    const rendered = JSON.stringify(result);
    expect(rendered).toContain("same");
    expect(rendered).toContain("removed");
    expect(rendered).toContain("added");
    expect(rendered).toContain("new");
    expect(rendered).toContain('"-"');
    expect(rendered).toContain('"+"');
  });

  it("renders an empty comparison safely", () => {
    expect(CodeDiff({ original: "", revised: "" })).toBeTruthy();
  });

  it("renders one-sided text as inert comparison data", () => {
    expect(CodeDiff({ original: "", revised: "added" })).toBeTruthy();
    expect(CodeDiff({ original: "removed", revised: "" })).toBeTruthy();
  });

  it("keeps unchanged lines aligned when a line is inserted", () => {
    const rendered = JSON.stringify(CodeDiff({ original: "first\nlast", revised: "first\ninserted\nlast" }));
    expect(rendered).toContain("inserted");
    expect(rendered).toContain("last");
    expect(rendered.match(/last/g)?.length).toBe(1);
  });
});
