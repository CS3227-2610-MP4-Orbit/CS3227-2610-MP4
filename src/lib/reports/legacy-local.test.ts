import { afterEach, describe, expect, it, vi } from "vitest";
import { canUseLegacyLocalReports } from "./legacy-local";

const original = { mode: process.env.NODE_ENV, url: process.env.NEXT_PUBLIC_SUPABASE_URL };
afterEach(() => {
  vi.stubEnv("NODE_ENV", original.mode);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", original.url);
});

describe("legacy local report compatibility", () => {
  it("allows only a missing code column on a local development database", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:56321");
    expect(canUseLegacyLocalReports({ code: "42703", message: "column bug_reports.code does not exist" })).toBe(true);
    expect(canUseLegacyLocalReports({ code: "PGRST204", message: "Could not find the 'code' column of 'bug_reports' in the schema cache" })).toBe(true);
    expect(canUseLegacyLocalReports({ code: "42501", message: "permission denied for column code" })).toBe(false);
  });

  it("rejects hosted databases and production", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    const missing = { code: "42703", message: "column bug_reports.code does not exist" };
    expect(canUseLegacyLocalReports(missing)).toBe(false);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://localhost:56321");
    vi.stubEnv("NODE_ENV", "production");
    expect(canUseLegacyLocalReports(missing)).toBe(false);
  });
});
