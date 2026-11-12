import { describe, expect, it } from "vitest";

import {
  fixedPythonCodeSchema,
  investigationNoteSchema,
  reportIdSchema,
  submissionNoteSchema,
} from "./validation";

describe("Developer input validation", () => {
  it("accepts UUIDs and trims valid notes", () => {
    expect(reportIdSchema.safeParse("00000000-0000-4000-8000-000000000001").success).toBe(true);
    expect(investigationNoteSchema.parse("  found the empty-input branch  ")).toBe("found the empty-input branch");
  });

  it("rejects empty, oversized, and malformed values", () => {
    expect(reportIdSchema.safeParse("not-a-uuid").success).toBe(false);
    expect(investigationNoteSchema.safeParse(" ").success).toBe(false);
    expect(fixedPythonCodeSchema.safeParse("").success).toBe(false);
    expect(fixedPythonCodeSchema.safeParse("x".repeat(20001)).success).toBe(false);
    expect(submissionNoteSchema.safeParse("x".repeat(5001)).success).toBe(false);
  });
});
