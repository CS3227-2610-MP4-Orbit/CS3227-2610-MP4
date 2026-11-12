import { describe, expect, it } from "vitest";

import { QaFeedback } from "./qa-feedback";

describe("Developer QA rejection feedback", () => {
  it("links feedback to the rejected revision without exposing decision controls", () => {
    const element = QaFeedback({ revisionNumber: 1, feedback: "Handle empty input before indexing." });
    const serialized = JSON.stringify(element);

    expect(serialized).toContain("QA feedback for revision ");
    expect(serialized).toContain('revision ",1');
    expect(serialized).toContain("Handle empty input before indexing.");
    expect(serialized).not.toContain("approve");
    expect(serialized).not.toContain("reject");
  });
});
