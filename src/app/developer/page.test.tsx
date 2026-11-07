import { describe, expect, it } from "vitest";

import { getDashboardState } from "./developer-dashboard";

describe("Developer dashboard acceptance states", () => {
  it("distinguishes populated and empty assigned-report states", () => {
    expect(getDashboardState([])).toBe("empty");
    expect(getDashboardState([{
      id: "r1", title: "Bug", status: "in_progress", updated_at: "now", created_at: "now",
    }])).toBe("populated");
  });
});
