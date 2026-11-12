import { z } from "zod";

export const reportIdSchema = z.uuid();
export const investigationNoteSchema = z.string().trim().min(1).max(5000);
export const fixedPythonCodeSchema = z.string().min(1).max(20000);
export const submissionNoteSchema = z.string().trim().max(5000);

export const developerInputs = {
  reportId: reportIdSchema,
  investigationNote: investigationNoteSchema,
  fixedPythonCode: fixedPythonCodeSchema,
  submissionNote: submissionNoteSchema,
};

export function safeValidationMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "The submitted values are invalid.";
}
