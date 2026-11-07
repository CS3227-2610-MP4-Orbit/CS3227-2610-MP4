import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("../../lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("../../lib/ai/gateway", () => ({ runAiFeature: vi.fn() }));

import { runAiFeature } from "../../lib/ai/gateway";
import { createClient } from "../../lib/supabase/server";

import { requestDeveloperDebuggingAdvice } from "./actions";

const reportId = "00000000-0000-4000-8000-000000000001";
const userId = "00000000-0000-4000-8000-0000000000b1";
const previous = { ok: false, message: "" };

function form(id = reportId) {
  const value = new FormData();
  value.set("reportId", id);
  return value;
}

function client(overrides: Record<string, unknown> = {}) {
  const maybeSingle = vi.fn().mockResolvedValue(overrides.report ?? {
    data: {
      id: reportId,
      developer_id: userId,
      code: "def avg(xs):\n    return sum(xs) / len(xs)",
      error_message: "ZeroDivisionError",
      expected_behavior: "Return zero for an empty list",
      actual_behavior: "The function divides by zero",
      reproduction_steps: "Call avg([])",
    },
    error: null,
  });
  const profileMaybeSingle = vi.fn().mockResolvedValue(overrides.profile ?? { data: { role: "developer" }, error: null });
  const notesLimit = vi.fn().mockResolvedValue({ data: [{ body: "The empty branch needs a guard." }], error: null });
  const profiles = { select: () => ({ eq: () => ({ maybeSingle: profileMaybeSingle }) }) };
  const reports = { select: () => ({ eq: () => ({ eq: () => ({ maybeSingle }) }) }) };
  const notes = { select: () => ({ eq: () => ({ order: () => ({ limit: notesLimit }) }) }) };
  const supabase = {
    auth: { getClaims: vi.fn().mockResolvedValue(overrides.claims ?? { data: { claims: { sub: userId } } }) },
    from: vi.fn((table: string) => table === "profiles" ? profiles : table === "bug_reports" ? reports : notes),
  };
  return supabase;
}

describe("Developer AI action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(runAiFeature).mockResolvedValue({ ok: true, text: "Check the empty-list branch." });
  });

  it("rejects malformed report IDs before reading the session", async () => {
    await expect(requestDeveloperDebuggingAdvice(previous, form("not-a-uuid"))).resolves.toEqual({
      ok: false,
      message: "The report identifier is invalid.",
    });
    expect(createClient).not.toHaveBeenCalled();
  });

  it("requires an authenticated session and the Developer role", async () => {
    vi.mocked(createClient).mockResolvedValue(client({ claims: { data: { claims: {} } } }) as never);
    await expect(requestDeveloperDebuggingAdvice(previous, form())).resolves.toEqual({
      ok: false,
      message: "You must be signed in.",
    });

    vi.mocked(createClient).mockResolvedValue(client({ profile: { data: { role: "reporter" }, error: null } }) as never);
    await expect(requestDeveloperDebuggingAdvice(previous, form())).resolves.toEqual({
      ok: false,
      message: "Developer AI assistance is unavailable for this account.",
    });
    expect(runAiFeature).not.toHaveBeenCalled();
  });

  it("does not disclose an unassigned report", async () => {
    vi.mocked(createClient).mockResolvedValue(client({ report: { data: null, error: null } }) as never);
    await expect(requestDeveloperDebuggingAdvice(previous, form())).resolves.toEqual({
      ok: false,
      message: "This report is not available.",
    });
    expect(runAiFeature).not.toHaveBeenCalled();
  });

  it("sends only the assigned report context and labels the response advisory", async () => {
    vi.mocked(createClient).mockResolvedValue(client() as never);
    await expect(requestDeveloperDebuggingAdvice(previous, form())).resolves.toEqual({
      ok: true,
      message: "Advisory guidance generated.",
      advice: "ADVISORY GUIDANCE — review manually; no code was run or applied.\n\nCheck the empty-list branch.",
    });
    expect(runAiFeature).toHaveBeenCalledWith(expect.objectContaining({
      feature: "developer_debugging",
      userId,
      role: "developer",
      reportId,
      context: [
        { label: "Original Python code", value: expect.stringContaining("def avg") },
        { label: "Developer report context", value: expect.stringContaining("ZeroDivisionError") },
      ],
    }));
  });

  it("returns a safe provider failure without exposing provider details", async () => {
    vi.mocked(createClient).mockResolvedValue(client() as never);
    vi.mocked(runAiFeature).mockResolvedValue({
      ok: false,
      reason: "provider_error",
      message: "The AI could not produce a suggestion. Try again later.",
    });
    await expect(requestDeveloperDebuggingAdvice(previous, form())).resolves.toEqual({
      ok: false,
      message: "The AI could not produce a suggestion. Try again later.",
    });
  });
});
