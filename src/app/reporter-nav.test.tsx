import { describe, expect, it } from "vitest";
import { activeReporterRoute } from "./reporter-nav";

describe("activeReporterRoute", () => {
  it("marks each Reporter route and groups detail under reports", () => {
    expect(activeReporterRoute("/")).toBe("/");
    expect(activeReporterRoute("/reports")).toBe("/reports");
    expect(activeReporterRoute("/reports/new")).toBe("/reports/new");
    expect(activeReporterRoute("/reports/abc")).toBe("/reports");
  });
  it("omits Reporter navigation on login and unrelated routes", () => {
    expect(activeReporterRoute("/login")).toBeNull();
    expect(activeReporterRoute("/unknown")).toBeNull();
  });
});
