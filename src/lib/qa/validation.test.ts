import { describe, expect, it } from "vitest";

import { decisionSchema, FEEDBACK_MAX, fieldErrors, formFields, testCaseSchema } from "./validation";

const revisionId = "00000000-0000-4000-8000-000000000001";
const test = { revisionId, description: "avg([])", expectedResult: "0.0", actualResult: "0.0", outcome: "pass" };

describe("testCaseSchema", () => {
  it("accepts a complete test and trims its text", () => {
    expect(testCaseSchema.parse({ ...test, description: "  avg([])  " }).description).toBe("avg([])");
  });

  it("requires every field and a known outcome", () => {
    const result = testCaseSchema.safeParse({ ...test, description: "   ", outcome: "maybe" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(fieldErrors(result.error)).toMatchObject({
        description: "Test description is required",
        outcome: "Choose pass or fail",
      });
    }
  });

  it("rejects a forged revision id and oversized text", () => {
    expect(testCaseSchema.safeParse({ ...test, revisionId: "1 or 1=1" }).success).toBe(false);
    expect(testCaseSchema.safeParse({ ...test, actualResult: "x".repeat(5001) }).success).toBe(false);
  });
});

describe("decisionSchema", () => {
  it("allows approving without feedback", () => {
    expect(decisionSchema.safeParse({ revisionId, verdict: "approve", feedback: "" }).success).toBe(true);
  });

  it("requires feedback to reject, ignoring whitespace", () => {
    const result = decisionSchema.safeParse({ revisionId, verdict: "reject", feedback: "   " });
    expect(result.success).toBe(false);
    if (!result.success) expect(fieldErrors(result.error).feedback).toMatch(/what to fix/);
  });

  it("caps feedback at the Reporter feedback limit", () => {
    const at = decisionSchema.safeParse({ revisionId, verdict: "reject", feedback: "x".repeat(FEEDBACK_MAX) });
    const over = decisionSchema.safeParse({ revisionId, verdict: "reject", feedback: "x".repeat(FEEDBACK_MAX + 1) });
    expect(at.success).toBe(true);
    expect(over.success).toBe(false);
  });

  it("refuses an unknown verdict", () => {
    expect(decisionSchema.safeParse({ revisionId, verdict: "close", feedback: "" }).success).toBe(false);
  });
});

describe("formFields", () => {
  it("reads only the named text fields, defaulting to empty", () => {
    const form = new FormData();
    form.set("verdict", "approve");
    form.set("extra", "ignored");
    form.set("feedback", new Blob(["file"]));
    expect(formFields(form, ["verdict", "feedback", "revisionId"] as const)).toEqual({ verdict: "approve", feedback: "", revisionId: "" });
  });
});
