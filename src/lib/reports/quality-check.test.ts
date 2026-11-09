import { describe, expect, it } from "vitest";
import { blankDraft, completeDraft, draftForm, oversizedDraft, partialDraft } from "../../app/reports/new/quality-check.fixtures";
import { parseDraftForQualityCheck } from "./quality-check";

describe("draft quality-check parsing", () => {
  it("accepts complete and partial drafts without requiring submission fields", () => {
    expect(parseDraftForQualityCheck(draftForm(completeDraft))).toEqual({ ok: true, values: completeDraft });
    expect(parseDraftForQualityCheck(draftForm(partialDraft))).toEqual({ ok: true, values: partialDraft });
  });
  it("refuses blank, oversized, and non-string fields", () => {
    expect(parseDraftForQualityCheck(draftForm(blankDraft)).ok).toBe(false);
    expect(parseDraftForQualityCheck(draftForm(oversizedDraft)).ok).toBe(false);
    const form = draftForm(completeDraft);
    form.set("title", new File(["bytes"], "title.txt"));
    expect(parseDraftForQualityCheck(form).ok).toBe(false);
  });
  it("ignores forged extra fields", () => {
    const form = draftForm(completeDraft);
    form.set("report_id", "someone-else");
    expect(parseDraftForQualityCheck(form)).toEqual({ ok: true, values: completeDraft });
  });
});
