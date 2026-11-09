import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PythonEditor, syncSubmissionValue } from "./python-editor";

describe("PythonEditor server fallback", () => {
  it("renders exactly one named form control with the existing code", () => {
    const source = 'if True:\n    print("hello")';
    const html = renderToStaticMarkup(<PythonEditor id="python-code" value={source} maxLength={20000} invalid={false} />);
    expect(html.match(/name="python_code"/g)).toHaveLength(1);
    expect(html).toContain('id="python-code"');
    expect(html).toContain("required");
    expect(html).toContain('if True:\n    print(&quot;hello&quot;)');
  });

  it("keeps code inert and marks a validation error", () => {
    const html = renderToStaticMarkup(<PythonEditor id="python-code" value={'<script>alert(1)</script>'} maxLength={20000} invalid />);
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
    expect(html).toContain('aria-invalid="true"');
  });

  it("synchronizes the form control before React rerenders", () => {
    const textarea = { value: "old" };
    syncSubmissionValue(textarea, "new\n    code");
    expect(textarea.value).toBe("new\n    code");
  });

  it("accepts a change callback while retaining the native textarea fallback", () => {
    const html = renderToStaticMarkup(<PythonEditor id="python-code" value="print(1)" maxLength={20000} invalid={false} onValueChange={() => {}} />);
    expect(html).toContain('name="python_code"');
    expect(html).toContain('>print(1)</textarea>');
  });
});
