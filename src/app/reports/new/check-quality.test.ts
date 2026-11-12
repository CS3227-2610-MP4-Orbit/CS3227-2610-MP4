import { beforeEach, describe, expect, it, vi } from "vitest";
import { blankDraft, completeDraft, draftForm, instructionInCodeDraft, oversizedDraft, partialDraft } from "./quality-check.fixtures";

vi.mock("../../../lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("../../../lib/ai/gateway", () => ({ runAiFeature: vi.fn() }));

import { createClient } from "../../../lib/supabase/server";
import { runAiFeature } from "../../../lib/ai/gateway";
import { checkReportQuality } from "./check-quality";

function session(role: string | null) {
  const profile = { select: vi.fn(), eq: vi.fn(), single: vi.fn().mockResolvedValue({ data: { role }, error: null }) };
  profile.select.mockReturnValue(profile);
  profile.eq.mockReturnValue(profile);
  const from = vi.fn().mockReturnValue(profile);
  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: role === null ? null : { id: "user-1" } }, error: null }) },
    from,
  } as never);
  return { from };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(runAiFeature).mockResolvedValue({ ok: true, text: "Reproduction steps: Name the exact input." });
});

describe("checkReportQuality", () => {
  it("refuses anonymous, Developer, and QA requests before the AI gateway", async () => {
    for (const role of [null, "developer", "qa"]) {
      session(role);
      expect((await checkReportQuality(draftForm(completeDraft))).ok).toBe(false);
      expect(runAiFeature).not.toHaveBeenCalled();
    }
  });
  it("sends exactly six current fields with explicit blanks and no forged extras", async () => {
    const { from } = session("reporter");
    const form = draftForm(partialDraft);
    form.set("report_id", "other-user-report");
    form.set("secret", "private");
    expect(await checkReportQuality(form)).toEqual({ ok: true, text: "Reproduction steps: Name the exact input.", message: "" });
    expect(from).toHaveBeenCalledWith("profiles");
    const request = vi.mocked(runAiFeature).mock.calls[0][0];
    expect(request).toMatchObject({ feature: "reporter_quality_check", role: "reporter", userId: "user-1", reportId: null });
    expect(request.context).toHaveLength(6);
    expect(request.context).toContainEqual({ label: "Error message", value: "[Not provided]" });
    expect(JSON.stringify(request.context)).not.toMatch(/other-user-report|private/);
    expect(from).not.toHaveBeenCalledWith("bug_reports");
  });
  it("refuses blank and oversized drafts before gateway or report mutation", async () => {
    const { from } = session("reporter");
    expect((await checkReportQuality(draftForm(blankDraft))).ok).toBe(false);
    expect((await checkReportQuality(draftForm(oversizedDraft))).ok).toBe(false);
    expect(runAiFeature).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalledWith("bug_reports");
  });
  it("passes instruction-like code as data without executing or logging it", async () => {
    session("reporter");
    await checkReportQuality(draftForm(instructionInCodeDraft));
    expect(vi.mocked(runAiFeature).mock.calls[0][0].context).toContainEqual({ label: "Python code", value: instructionInCodeDraft.python_code });
  });
  it.each(["rate_limited", "timeout", "provider_error", "unavailable"] as const)("returns the safe gateway message for %s", async (reason) => {
    session("reporter");
    vi.mocked(runAiFeature).mockResolvedValue({ ok: false, reason, message: "Please try again later." });
    expect(await checkReportQuality(draftForm(completeDraft))).toEqual({ ok: false, text: "", message: "Please try again later." });
  });
  it("hides unexpected infrastructure failures", async () => {
    vi.mocked(createClient).mockRejectedValue(new Error("database password"));
    expect(await checkReportQuality(draftForm(completeDraft))).toEqual({
      ok: false, text: "", message: "The quality check is unavailable right now. Try again later.",
    });
  });
});
