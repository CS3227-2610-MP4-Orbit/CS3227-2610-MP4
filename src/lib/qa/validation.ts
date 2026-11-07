import { z } from "zod";

// Limits mirror the database: test_cases fields allow 5000 characters, and decision feedback is
// capped at 2000 because decide_fix also publishes it to the Reporter's bug_feedback.
export const FEEDBACK_MAX = 2000;
const TEST_FIELD_MAX = 5000;

const text = (label: string, max: number) =>
  z.string().trim().min(1, `${label} is required`).max(max, `${label} must be at most ${max.toLocaleString()} characters`);

export const idSchema = z.uuid("The item could not be found");

export const testCaseSchema = z.object({
  revisionId: idSchema,
  description: text("Test description", TEST_FIELD_MAX),
  expectedResult: text("Expected result", TEST_FIELD_MAX),
  actualResult: text("Actual result", TEST_FIELD_MAX),
  outcome: z.enum(["pass", "fail"], "Choose pass or fail"),
});

export const decisionSchema = z
  .object({
    revisionId: idSchema,
    verdict: z.enum(["approve", "reject"], "Choose approve or reject"),
    feedback: z.string().trim().max(FEEDBACK_MAX, `Feedback must be at most ${FEEDBACK_MAX.toLocaleString()} characters`),
  })
  .refine((decision) => decision.verdict === "approve" || decision.feedback.length > 0, {
    path: ["feedback"],
    message: "Tell the Developer what to fix when rejecting",
  });

export type TestCaseInput = z.infer<typeof testCaseSchema>;
export type DecisionInput = z.infer<typeof decisionSchema>;

/** Reads named string fields from a form; anything missing or non-text becomes "". */
export function formFields<K extends string>(form: FormData, keys: readonly K[]): Record<K, string> {
  return Object.fromEntries(keys.map((key) => {
    const value = form.get(key);
    return [key, typeof value === "string" ? value : ""];
  })) as Record<K, string>;
}

/** First message per field, for showing next to the inputs. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "form");
    errors[field] ??= issue.message;
  }
  return errors;
}
