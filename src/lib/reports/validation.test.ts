import { describe, expect, it } from "vitest";
import { emptyReport, reportSchema, valuesFromForm } from "./validation";

const valid = {
  title: "Bad sum", python_code: "print(1 + 'x')", error_message: "TypeError",
  expected_behavior: "Print result", actual_behavior: "Raises", reproduction_steps: "Run the script",
};

describe("report validation", () => {
  it("accepts all required fields", () => expect(reportSchema.safeParse(valid).success).toBe(true));
  it("preserves Python indentation and trailing newlines", () => {
    const code = "  if True:\n      print('ok')\n\n";
    expect(reportSchema.parse({ ...valid, python_code: code }).python_code).toBe(code);
    expect(reportSchema.safeParse({ ...valid, python_code: " \n " }).success).toBe(false);
  });
  it("normalizes textarea line endings without changing Python indentation", () => {
    const form = new FormData();
    for (const [key, value] of Object.entries(valid)) form.set(key, value);
    form.set("python_code", "  if True:\r\n      print('ok')\r\n\r\n");
    const values = valuesFromForm(form);
    expect(values.python_code).toBe("  if True:\n      print('ok')\n\n");
    expect(reportSchema.parse(values).python_code).toBe(values.python_code);
  });
  it("rejects missing and oversized fields", () => {
    expect(reportSchema.safeParse({ ...valid, title: " " }).success).toBe(false);
    expect(reportSchema.safeParse({ ...valid, python_code: "x".repeat(20001) }).success).toBe(false);
    expect(reportSchema.safeParse({ ...valid, error_message: "x".repeat(2001) }).success).toBe(false);
  });
  it("preserves submitted strings for an error response", () => {
    const form = new FormData();
    for (const [key, value] of Object.entries(valid)) form.set(key, value);
    form.set("title", " ");
    expect(valuesFromForm(form)).toEqual({ ...valid, title: " " });
    expect(emptyReport.title).toBe("");
  });
});
