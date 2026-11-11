import { describe, expect, it } from "vitest";

import { parseCodeImprovement } from "./code-improvement";

const valid = JSON.stringify({
  summary: "The function can be clearer.",
  suggestions: [{
    category: "readability",
    title: "Name the intermediate value",
    rationale: "The expression currently hides the calculation's purpose.",
    benefit: "A named value makes review easier.",
    tradeoff: "Adds one local variable.",
    illustrativeCode: "average = total / count",
  }],
});

describe("AI code improvement response", () => {
  it("accepts the bounded structured response", () => {
    expect(parseCodeImprovement(valid)).toMatchObject({ suggestions: [{ category: "readability" }] });
  });

  it("accepts a fenced JSON response but keeps it structured", () => {
    expect(parseCodeImprovement(["```json", valid, "```"].join("\n"))).not.toBeNull();
  });

  it("rejects malformed, empty, unknown-category, and oversized fields", () => {
    expect(parseCodeImprovement("not json")).toBeNull();
    expect(parseCodeImprovement(" ")).toBeNull();
    expect(parseCodeImprovement(JSON.stringify({ summary: "", suggestions: [{ ...JSON.parse(valid).suggestions[0], category: "security" }] }))).toBeNull();
    expect(parseCodeImprovement(JSON.stringify({ summary: "x", suggestions: [{ ...JSON.parse(valid).suggestions[0], rationale: "x".repeat(801) }] }))).toBeNull();
  });
});
