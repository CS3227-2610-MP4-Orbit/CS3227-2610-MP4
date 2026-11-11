import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { ImprovementReviewContent } from "./ai-code-improvement";

describe("Developer AI Code Improvement panel", () => {
  it("renders categories, rationale, trade-offs, and inert suggested text", () => {
    const element = ImprovementReviewContent({ review: {
      summary: "Review manually.",
      suggestions: [{
        category: "DRY",
        title: "Extract duplicated validation",
        rationale: "The same validation appears twice.",
        benefit: "One source of truth is easier to maintain.",
        tradeoff: "The helper adds an indirection.",
        illustrativeCode: "def validate(value): ...",
      }],
    } });
    const serialized = JSON.stringify(element);
    expect(serialized).toContain("DRY");
    expect(serialized).toContain("The same validation appears twice.");
    expect(serialized).toContain("Suggested text only");
    expect(serialized).not.toContain("Apply");
    expect(serialized).not.toContain("Execute");
  });

  it("renders the no-suggestion outcome without inventing a finding", () => {
    const element = ImprovementReviewContent({ review: { summary: "No clear improvement.", suggestions: [] } });
    expect(JSON.stringify(element)).toContain("No clear improvement was identified.");
  });
});
