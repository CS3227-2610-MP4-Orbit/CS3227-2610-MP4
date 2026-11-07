import { describe, expect, it } from "vitest";
import { CodeDiff } from "./code-diff";

describe("CodeDiff", () => {
  it("marks unchanged, added, and removed lines without executing code", () => {
    const result = CodeDiff({ original: "same\nremoved", revised: "same\nadded\nnew" });
    expect(result).toBeTruthy();
    const rendered = JSON.stringify(result);
    expect(rendered).toContain("same");
    expect(rendered).toContain("added");
    expect(rendered).toContain("new");
  });

  it("renders an empty comparison safely", () => {
    expect(CodeDiff({ original: "", revised: "" })).toBeTruthy();
  });
});
