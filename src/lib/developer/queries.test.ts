import { describe, expect, it } from "vitest";

import { mapDeveloperReports } from "./queries";

describe("assigned Developer report read model", () => {
  it("maps only the fields the dashboard needs", () => {
    expect(mapDeveloperReports([
      { id: "r1", title: "Empty list crash", status: "open", updated_at: "2026-11-05", created_at: "2026-11-04", code: "secret" },
    ])).toEqual([
      { id: "r1", title: "Empty list crash", status: "open", updated_at: "2026-11-05", created_at: "2026-11-04" },
    ]);
  });

  it("returns an empty list for an empty or invalid response", () => {
    expect(mapDeveloperReports([])).toEqual([]);
    expect(mapDeveloperReports(null)).toEqual([]);
  });
});
