import { describe, expect, it } from "vitest";

import { orderQaQueue, type QueueReport, type QueueStatus } from "./queue";

const report = (id: string, status: QueueStatus, updated: string): QueueReport =>
  ({ id, title: id, status, created_at: "2026-11-01T00:00:00Z", updated_at: `2026-11-0${updated}T00:00:00Z` });

describe("orderQaQueue", () => {
  it("puts fixes awaiting QA first, then reports with the Developer, not started, and closed", () => {
    const ordered = orderQaQueue([
      report("closed", "closed", "5"),
      report("open", "open", "5"),
      report("with-dev", "in_progress", "5"),
      report("needs-qa", "awaiting_qa", "1"),
    ]);
    expect(ordered.map((r) => r.id)).toEqual(["needs-qa", "with-dev", "open", "closed"]);
  });

  it("serves the oldest hand-off first among fixes awaiting QA", () => {
    const ordered = orderQaQueue([report("newer", "awaiting_qa", "3"), report("older", "awaiting_qa", "1")]);
    expect(ordered.map((r) => r.id)).toEqual(["older", "newer"]);
  });

  it("shows the most recent first for history", () => {
    const ordered = orderQaQueue([report("old", "closed", "1"), report("recent", "closed", "4")]);
    expect(ordered.map((r) => r.id)).toEqual(["recent", "old"]);
  });

  it("breaks ties by id so the order is stable, and leaves the input untouched", () => {
    const input = [report("b", "awaiting_qa", "2"), report("a", "awaiting_qa", "2")];
    expect(orderQaQueue(input).map((r) => r.id)).toEqual(["a", "b"]);
    expect(input.map((r) => r.id)).toEqual(["b", "a"]);
  });
});
