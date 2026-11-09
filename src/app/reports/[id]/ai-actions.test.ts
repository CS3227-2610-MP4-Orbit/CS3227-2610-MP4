import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/ai/gateway", () => ({ runAiFeature: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { runAiFeature } from "@/lib/ai/gateway";
import { explainReport } from "./ai-actions";

const id = "123e4567-e89b-12d3-a456-426614174000";
const previous = { ok: false, text: "", message: "" };
const report = {
  title: "Fails on empty list", code: "def average(xs): return sum(xs) / len(xs)",
  error_message: "ZeroDivisionError", expected_behavior: "Return zero", actual_behavior: "Raises",
  reproduction_steps: "Call average([])",
};

function session(role: string, ownedReport: typeof report | null = report) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: ownedReport, error: null });
  const reportQuery = { select: vi.fn(), eq: vi.fn(), maybeSingle };
  reportQuery.select.mockReturnValue(reportQuery);
  reportQuery.eq.mockReturnValue(reportQuery);
  const profileQuery = { select: vi.fn(), eq: vi.fn(), single: vi.fn().mockResolvedValue({ data: { role }, error: null }) };
  profileQuery.select.mockReturnValue(profileQuery);
  profileQuery.eq.mockReturnValue(profileQuery);
  vi.mocked(createClient).mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "reporter-id" } }, error: null }) },
    from: vi.fn((table: string) => table === "profiles" ? profileQuery : reportQuery),
  } as never);
  return { reportQuery };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(runAiFeature).mockResolvedValue({ ok: true, text: "A zero length causes division by zero." });
});

describe("Reporter AI explanation", () => {
  it("rejects an invalid report ID before reading data", async () => {
    expect((await explainReport("invalid", previous)).ok).toBe(false);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("refuses another role and a report not owned by the caller", async () => {
    session("developer");
    expect((await explainReport(id, previous)).ok).toBe(false);
    expect(runAiFeature).not.toHaveBeenCalled();

    session("reporter", null);
    expect((await explainReport(id, previous)).ok).toBe(false);
    expect(runAiFeature).not.toHaveBeenCalled();
  });

  it("uses only the owned report and shows the gateway's suggestion", async () => {
    const { reportQuery } = session("reporter");
    expect(await explainReport(id, previous)).toEqual({ ok: true, text: "A zero length causes division by zero.", message: "" });
    expect(reportQuery.eq).toHaveBeenCalledWith("reporter_id", "reporter-id");
    expect(runAiFeature).toHaveBeenCalledWith(expect.objectContaining({
      feature: "reporter_code_explanation", role: "reporter", userId: "reporter-id", reportId: id,
      context: expect.arrayContaining([{ label: "Reported Python code", value: report.code }]),
    }));
  });

  it("keeps the prior suggestion when the gateway refuses a new request", async () => {
    session("reporter");
    vi.mocked(runAiFeature).mockResolvedValue({ ok: false, reason: "rate_limited", message: "Try again later." });
    expect(await explainReport(id, { ok: true, text: "Earlier explanation", message: "" }))
      .toEqual({ ok: true, text: "Earlier explanation", message: "Try again later." });
  });
});
