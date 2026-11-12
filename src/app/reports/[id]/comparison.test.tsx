import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { FixComparison, selectRevision, type FixRevision } from "./comparison";

const revision = (number: number, code: string, note = "Investigated"): FixRevision => ({
  id: `revision-${number}`,
  report_id: "owned-report",
  revision_number: number,
  author_id: "dev12345-12345678",
  code,
  note,
  created_at: `2026-11-06T0${number}:00:00Z`,
});

describe("FixComparison", () => {
  it("shows the highest version first and supports selecting an earlier revision", () => {
    const versions = [revision(1, "print(1)"), revision(2, "print(2)")];
    expect(selectRevision(versions)?.revision_number).toBe(2);
    expect(selectRevision(versions, "revision-1")?.code).toBe("print(1)");
    const html = renderToStaticMarkup(<FixComparison original="print(0)" revisions={versions} />);
    expect(html).toContain("Original versus proposed fix");
    expect(html).toContain("Version 2 by Developer account dev12345-12345678");
    expect(html).toContain("Version 1");
    expect(html).toContain("Original code");
    expect(html).toContain("Proposed fix");
    expect(html).toContain("print(2)");
    expect(html).not.toContain("No proposed fix yet");
  });

  it("distinguishes empty and load failure without sample data", () => {
    const empty = renderToStaticMarkup(<FixComparison original="print(0)" revisions={[]} />);
    expect(empty).toContain("No proposed fix yet");
    expect(empty).not.toContain("Preview sample comparison");
    const failed = renderToStaticMarkup(<FixComparison original="print(0)" revisions={[]} loadError />);
    expect(failed).toContain("Could not load proposed fixes");
    expect(failed).not.toContain("No proposed fix yet");
    expect(failed).not.toContain("Preview sample comparison");
  });

  it("renders code and Developer notes as inert text", () => {
    const html = renderToStaticMarkup(<FixComparison original={'<script>alert("original")</script>'} revisions={[
      revision(1, '<img src=x onerror=alert(1)>', '<script>alert("note")</script>'),
    ]} />);
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&lt;img");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
  });
});
