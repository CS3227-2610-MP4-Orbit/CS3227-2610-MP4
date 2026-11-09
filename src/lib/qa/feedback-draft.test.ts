import { describe, expect, it } from "vitest";

import { DRAFT_SHORTENED, feedbackDraftContext, fitFeedback } from "./feedback-draft";
import type { TestCase } from "./queries";
import { FEEDBACK_MAX } from "./validation";

const report = { expected_behavior: "Returns 0 for []" };
const latest = { id: "rev-2", revision_number: 2, note: "Guarded the empty list" };

const test = (id: string, revision: string, outcome: "pass" | "fail", description = `test ${id}`): TestCase => ({
  id, revision_id: revision, description, expected_result: `expected ${id}`, actual_result: `actual ${id}`,
  outcome, created_at: "2026-11-09T00:00:00Z",
});

const valueOf = (fields: { label: string; value: string }[], label: string) =>
  fields.find((field) => field.label.startsWith(label))?.value;

describe("feedbackDraftContext", () => {
  it("returns null without tests on the latest version, so no AI request is made", () => {
    expect(feedbackDraftContext(report, latest, [])).toBeNull();
    expect(feedbackDraftContext(report, latest, [test("a", "rev-1", "fail")])).toBeNull();
  });

  it("uses only the latest version's tests, with their expected and actual results", () => {
    const fields = feedbackDraftContext(report, latest, [
      test("old", "rev-1", "fail", "an earlier version's test"),
      test("a", "rev-2", "pass"),
      test("b", "rev-2", "fail"),
    ]);
    const results = valueOf(fields!, "Test results") ?? "";
    expect(results).toContain("PASS: test a");
    expect(results).toContain("FAIL: test b");
    expect(results).toContain("Expected: expected b");
    expect(results).toContain("Actual: actual b");
    expect(results).not.toContain("earlier version");
  });

  it("counts failures so the draft matches what the tests found", () => {
    const failing = feedbackDraftContext(report, latest, [test("a", "rev-2", "pass"), test("b", "rev-2", "fail")]);
    expect(valueOf(failing!, "Outcome")).toBe("1 of 2 tests failed");
    const passing = feedbackDraftContext(report, latest, [test("a", "rev-2", "pass")]);
    expect(valueOf(passing!, "Outcome")).toBe("All 1 test passed");
  });

  it("sends only the expectation, the developer's note and the results: no title, reported failure or code", () => {
    const fields = feedbackDraftContext(report, latest, [test("a", "rev-2", "pass")])!;
    expect(fields.map((field) => field.label)).toEqual(["Expected behavior", "Developer note on version 2", "Outcome", "Test results"]);
  });
});

describe("fitFeedback", () => {
  it("trims and keeps a draft that fits, up to exactly the limit", () => {
    expect(fitFeedback("  Looks good.  ")).toBe("Looks good.");
    const exact = "x".repeat(FEEDBACK_MAX);
    expect(fitFeedback(exact)).toBe(exact);
  });

  it("cuts a long draft to the feedback limit and says so", () => {
    const fitted = fitFeedback("x".repeat(FEEDBACK_MAX + 1));
    expect(fitted.length).toBe(FEEDBACK_MAX);
    expect(fitted.endsWith(DRAFT_SHORTENED)).toBe(true);
  });

  it("removes links, which never come from test results", () => {
    expect(fitFeedback("Test 2 failed. See https://evil.example/x?a=1 and www.evil.example now."))
      .toBe("Test 2 failed. See [link removed] and [link removed] now.");
  });

  it("marks a draft the provider cut short as a shortened draft", () => {
    expect(fitFeedback("Test 2 failed because\n[Suggestion shortened]")).toBe(`Test 2 failed because${DRAFT_SHORTENED}`);
  });
});
