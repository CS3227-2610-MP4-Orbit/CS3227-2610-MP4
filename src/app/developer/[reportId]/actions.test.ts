import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("../../../lib/supabase/server", () => ({ createClient: vi.fn() }));

import { createClient } from "../../../lib/supabase/server";

import { addInvestigationNote, editInvestigationNote, startWork, submitFix } from "./actions";

const initialState = { ok: false, message: "" };

describe("Developer investigation actions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects invalid report IDs before calling Supabase", async () => {
    const form = new FormData();
    form.set("reportId", "not-a-uuid");
    await startWork(initialState, form);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("returns a safe lifecycle error when the report cannot be started", async () => {
    const rpc = vi.fn().mockResolvedValue({ error: new Error("not available") });
    vi.mocked(createClient).mockResolvedValue({ rpc } as never);
    const form = new FormData();
    form.set("reportId", "00000000-0000-4000-8000-000000000001");

    await expect(startWork(initialState, form)).resolves.toEqual({
      ok: false,
      message: "This report is no longer available to start.",
    });
  });

  it("rejects empty and oversized investigation notes", async () => {
    const empty = new FormData();
    empty.set("reportId", "00000000-0000-4000-8000-000000000001");
    empty.set("body", " ");
    const oversized = new FormData();
    oversized.set("reportId", "00000000-0000-4000-8000-000000000001");
    oversized.set("body", "x".repeat(5001));

    expect((await addInvestigationNote(initialState, empty)).ok).toBe(false);
    expect((await addInvestigationNote(initialState, oversized)).ok).toBe(false);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("rejects invalid note edits before calling Supabase", async () => {
    const form = new FormData();
    form.set("reportId", "00000000-0000-4000-8000-000000000001");
    form.set("noteId", "00000000-0000-4000-8000-000000000002");
    form.set("body", "");

    expect((await editInvestigationNote(initialState, form)).ok).toBe(false);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("rejects empty or oversized corrected code before calling Supabase", async () => {
    const empty = new FormData();
    empty.set("reportId", "00000000-0000-4000-8000-000000000001");
    empty.set("code", "");
    const oversized = new FormData();
    oversized.set("reportId", "00000000-0000-4000-8000-000000000001");
    oversized.set("code", "x".repeat(20001));
    expect((await submitFix(initialState, empty)).ok).toBe(false);
    expect((await submitFix(initialState, oversized)).ok).toBe(false);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("uses the submit_fix lifecycle RPC and returns a safe success message", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: "revision-id", error: null });
    vi.mocked(createClient).mockResolvedValue({ rpc } as never);
    const form = new FormData();
    form.set("reportId", "00000000-0000-4000-8000-000000000001");
    form.set("code", "print('fixed')");
    form.set("note", "Explains the correction");
    await expect(submitFix(initialState, form)).resolves.toEqual({ ok: true, message: "Fix submitted to QA." });
    expect(rpc).toHaveBeenCalledWith("submit_fix", {
      report: "00000000-0000-4000-8000-000000000001",
      fixed_code: "print('fixed')",
      submission_note: "Explains the correction",
    });
  });
});
