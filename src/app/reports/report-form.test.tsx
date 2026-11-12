import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ReportForm } from "./report-form";
import { partialDraft } from "./new/quality-check.fixtures";

const action = async () => ({ values: partialDraft, errors: {} });
const check = async () => ({ ok: true as const, text: "Title: Clarify the input.", message: "" as const });

describe("ReportForm quality check controls", () => {
  it("shows the optional check only when supplied and keeps submit separate", () => {
    const html = renderToStaticMarkup(<ReportForm action={action} qualityCheck={check} initialValues={partialDraft} submitLabel="Submit report" />);
    expect(html).toContain('type="button"');
    expect(html).toContain("Check my report");
    expect(html).toContain('type="submit"');
    expect(html).toContain("Submit report");
    expect(html).toContain(partialDraft.python_code);
    expect(html).toContain(partialDraft.reproduction_steps);
  });
  it("does not offer draft checking on existing report forms", () => {
    const html = renderToStaticMarkup(<ReportForm action={action} initialValues={partialDraft} submitLabel="Save changes" />);
    expect(html).not.toContain("Check my report");
  });
});
