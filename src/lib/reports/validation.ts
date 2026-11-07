import { z } from "zod";

export const reportFields = [
  "title", "python_code", "error_message", "expected_behavior", "actual_behavior", "reproduction_steps",
] as const;

export type ReportField = (typeof reportFields)[number];
export type ReportValues = Record<ReportField, string>;

export const emptyReport: ReportValues = {
  title: "", python_code: "", error_message: "", expected_behavior: "",
  actual_behavior: "", reproduction_steps: "",
};

export const reportSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120, "Title must be at most 120 characters"),
  python_code: z.string().max(20000, "Code must be at most 20,000 characters").refine((code) => code.trim().length > 0, "Python code is required"),
  error_message: z.string().trim().min(1, "Error message is required").max(2000),
  expected_behavior: z.string().trim().min(1, "Expected behavior is required").max(2000),
  actual_behavior: z.string().trim().min(1, "Actual behavior is required").max(2000),
  reproduction_steps: z.string().trim().min(1, "Reproduction steps are required").max(2000),
});

export function valuesFromForm(form: FormData): ReportValues {
  return Object.fromEntries(reportFields.map((field) => {
    const submitted = form.get(field);
    const value = typeof submitted === "string" ? submitted : "";
    // Browsers serialize textarea line breaks as CRLF. Keep stored Python text
    // stable when a reporter saves a snippet without editing its contents.
    return [field, field === "python_code" ? value.replace(/\r\n?/g, "\n") : value];
  })) as ReportValues;
}
