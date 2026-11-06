import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { FeedbackSection, type FeedbackEntry } from "./feedback-section";

const entry = (id: string, role: FeedbackEntry["author_role"], body: string): FeedbackEntry => ({
  id, author_role: role, body, created_at: "2026-11-05T00:00:00Z",
});

describe("FeedbackSection", () => {
  it("shows the entries in supplied order with roles and timestamps", () => {
    const html = renderToStaticMarkup(<FeedbackSection entries={[
      entry("new", "qa", "QA decision"), entry("old", "developer", "Developer note"),
    ]} />);
    expect(html).toContain("QA Tester");
    expect(html).toContain("Developer");
    expect(html).toContain('dateTime="2026-11-05T00:00:00Z"');
    expect(html.indexOf("QA decision")).toBeLessThan(html.indexOf("Developer note"));
  });

  it("distinguishes no feedback from a load error", () => {
    const empty = renderToStaticMarkup(<FeedbackSection entries={[]} />);
    const failed = renderToStaticMarkup(<FeedbackSection entries={[]} loadError />);
    expect(empty).toContain("No feedback yet.");
    expect(failed).toContain("Could not load feedback");
    expect(failed).not.toContain("No feedback yet.");
  });

  it("renders markup-like text without creating elements", () => {
    const html = renderToStaticMarkup(<FeedbackSection entries={[entry("x", "developer", '<script>alert("x")</script>')]} />);
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
  });
});
