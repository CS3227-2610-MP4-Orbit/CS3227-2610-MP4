import { MAX_INPUT_CHARS } from "../ai/prompt";
import { reportFields, type ReportValues } from "./validation";

export type DraftCheckParse = { ok: true; values: ReportValues } | { ok: false; message: string };

const limits: Record<keyof ReportValues, number> = {
  title: 120, python_code: 20_000, error_message: 2_000,
  expected_behavior: 2_000, actual_behavior: 2_000, reproduction_steps: 2_000,
};

export function parseDraftForQualityCheck(form: FormData): DraftCheckParse {
  const values = {} as ReportValues;
  let total = 0;
  for (const field of reportFields) {
    const raw = form.get(field);
    if (raw !== null && typeof raw !== "string") {
      return { ok: false, message: "Enter report details as text before checking." };
    }
    const value = field === "python_code" ? (raw ?? "").replace(/\r\n?/g, "\n") : raw ?? "";
    if (value.length > limits[field]) {
      return { ok: false, message: "This draft is too long for a quality check. Shorten a field and try again." };
    }
    values[field] = value;
    total += value.length;
  }
  if (total > MAX_INPUT_CHARS) {
    return { ok: false, message: "This draft is too long for a quality check. Shorten it and try again." };
  }
  if (reportFields.every((field) => !values[field].trim())) {
    return { ok: false, message: "Enter some report details before checking." };
  }
  return { ok: true, values };
}
