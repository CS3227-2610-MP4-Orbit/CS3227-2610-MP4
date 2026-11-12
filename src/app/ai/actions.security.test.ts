import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("../../lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("../../lib/ai/gateway", () => ({ runAiFeature: vi.fn() }));

import { runAiFeature } from "../../lib/ai/gateway";
import { createClient } from "../../lib/supabase/server";
import { requestDeveloperCodeImprovement } from "./actions";

const reportId = "00000000-0000-4000-8000-000000000001";
const userId = "00000000-0000-4000-8000-0000000000b1";
const previous = { ok: false, message: "" };

function client(report: unknown, role = "developer") {
  const maybeSingle = vi.fn().mockResolvedValue({ data: report, error: null });
  const profileMaybeSingle = vi.fn().mockResolvedValue({ data: { role }, error: null });
  const notesLimit = vi.fn().mockResolvedValue({ data: [{ body: "Investigate the empty branch." }], error: null });
  const profiles = { select: () => ({ eq: () => ({ maybeSingle: profileMaybeSingle }) }) };
  const reports = { select: () => ({ eq: () => ({ eq: () => ({ maybeSingle }) }) }) };
  const notes = { select: () => ({ eq: () => ({ order: () => ({ limit: notesLimit }) }) }) };
  return {
    auth: { getClaims: vi.fn().mockResolvedValue({ data: { claims: { sub: userId } } }) },
    from: vi.fn((table: string) => table === "profiles" ? profiles : table === "bug_reports" ? reports : notes),
  };
}

function form() {
  const value = new FormData();
  value.set("reportId", reportId);
  return value;
}

describe("Developer Code Improvement security boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(runAiFeature).mockResolvedValue({ ok: true, text: "{}" });
  });

  it("does not send an unassigned or closed report to the provider", async () => {
    vi.mocked(createClient).mockResolvedValue(client(null) as never);
    await requestDeveloperCodeImprovement(previous, form());
    expect(runAiFeature).not.toHaveBeenCalled();

    vi.mocked(createClient).mockResolvedValue(client({ id: reportId, developer_id: userId, status: "closed", code: "print(1)" }) as never);
    await requestDeveloperCodeImprovement(previous, form());
    expect(runAiFeature).not.toHaveBeenCalled();
  });

  it("does not send report context for a non-Developer role", async () => {
    vi.mocked(createClient).mockResolvedValue(client({ id: reportId, developer_id: userId, status: "open", code: "print(1)" }, "reporter") as never);
    await expect(requestDeveloperCodeImprovement(previous, form())).resolves.toEqual({
      ok: false,
      message: "Developer AI assistance is unavailable for this account.",
    });
    expect(runAiFeature).not.toHaveBeenCalled();
  });
});
