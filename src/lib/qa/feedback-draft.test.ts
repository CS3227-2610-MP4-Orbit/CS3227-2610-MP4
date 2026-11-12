import { describe, expect, it } from "vitest";

import { DRAFT_SHORTENED, draftView, feedbackDraftContext, fitFeedback, testsKey } from "./feedback-draft";
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

describe("testsKey", () => {
  it("identifies the latest version's recorded tests, ignoring other versions", () => {
    const tests = [test("a", "rev-1", "fail"), test("b", "rev-2", "fail"), test("c", "rev-2", "pass")];
    expect(testsKey(tests, "rev-2")).toBe("b,c");
    expect(testsKey(tests, "rev-3")).toBe("");
  });

  it("changes when a test is recorded", () => {
    const before = [test("b", "rev-2", "fail")];
    expect(testsKey([...before, test("c", "rev-2", "pass")], "rev-2")).not.toBe(testsKey(before, "rev-2"));
  });
});

describe("draftView", () => {
  const draft = { ok: true, basedOn: "b,c" };

  // Server actions run one at a time, so a draft requested while "Save test" is still saving runs
  // after the save and is based on the new test too. Its basedOn then matches the refreshed page.
  it("shows a draft that was based on the tests now on screen", () => {
    expect(draftView(draft, "b,c")).toBe("show");
  });

  it("marks a draft stale once the tests change, so it cannot contradict the results", () => {
    expect(draftView(draft, "b,c,d")).toBe("stale");
  });

  it("shows nothing when there is no successful draft", () => {
    expect(draftView({ ok: false }, "b,c")).toBe("none");
    expect(draftView({ ok: true }, "b,c")).toBe("stale");
  });
});
