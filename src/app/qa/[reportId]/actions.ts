"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { runAiFeature } from "@/lib/ai/gateway";
import { feedbackDraftContext, fitFeedback } from "@/lib/qa/feedback-draft";
import { getQaReview } from "@/lib/qa/queries";
import { createClient } from "@/lib/supabase/server";
import { decisionSchema, fieldErrors, formFields, idSchema, testCaseSchema } from "@/lib/qa/validation";

import { type AiSuggestionState, emptyState, emptySuggestion, type QaActionState } from "./state";


// Database errors are never shown: they can describe the schema. Each action maps them to a
// plain message, and the database itself decides whether this user may act.

export async function recordTestCase(reportId: string, _previous: QaActionState, form: FormData): Promise<QaActionState> {
  const values = formFields(form, ["revisionId", "description", "expectedResult", "actualResult", "outcome"] as const);
  const parsed = testCaseSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "", errors: fieldErrors(parsed.error), values };
  if (!idSchema.safeParse(reportId).success) return { ...emptyState, message: "This report could not be found.", values };

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = typeof claims?.claims?.sub === "string" ? claims.claims.sub : null;
  if (!userId) return { ...emptyState, message: "Sign in to record a test.", values };

  const { revisionId, description, expectedResult, actualResult, outcome } = parsed.data;
  const { error } = await supabase.from("test_cases").insert({
    revision_id: revisionId, qa_id: userId, description,
    expected_result: expectedResult, actual_result: actualResult, outcome,
  });
  // RLS only accepts tests from the assigned QA tester on the latest revision awaiting QA.
  if (error) return { ...emptyState, message: "This test could not be recorded. The fix may no longer be awaiting QA.", values };
  revalidatePath(`/qa/${reportId}`);
  return { ...emptyState, ok: true, message: "Test recorded." };
}

export async function decideFix(reportId: string, _previous: QaActionState, form: FormData): Promise<QaActionState> {
  const values = formFields(form, ["revisionId", "verdict", "feedback"] as const);
  const parsed = decisionSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "", errors: fieldErrors(parsed.error), values };
  if (!idSchema.safeParse(reportId).success) return { ...emptyState, message: "This report could not be found.", values };

  const supabase = await createClient();
  const { revisionId, verdict, feedback } = parsed.data;
  // decide_fix checks assignment, latest revision and status, and records the decision, the
  // status change and the Reporter's feedback copy in one transaction.
  const { error } = await supabase.rpc("decide_fix", { revision: revisionId, verdict, feedback });
  if (error) return { ...emptyState, message: "This decision could not be saved. The fix may already have been decided.", values };
  revalidatePath("/qa");
  // The decision form disappears once the fix is decided, so the confirmation is shown by the page.
  redirect(`/qa/${reportId}?decided=${verdict}`);
}

/** The fix this QA tester may get AI help on: their assigned report, awaiting QA, latest version. */
async function awaitingFix(reportId: string) {
  if (!idSchema.safeParse(reportId).success) return null;
  const review = await getQaReview(reportId);
  if (!review || review.kind !== "ok") return null;
  const latest = review.revisions[0];
  if (review.report.status !== "awaiting_qa" || !latest) return null;
  return { ...review, latest };
}

/**
 * QA's AI features (spec 001 FR-009). The context is loaded through the QA tester's own session,
 * so only an assigned QA tester gets any, and only the fields each feature needs are sent. Answers
 * are shown as labelled suggestions; nothing is recorded, sent or run automatically. A refused
 * test-ideas request keeps the last ideas on screen and explains why no new ones came.
 */
export async function suggestTests(reportId: string, previous: AiSuggestionState): Promise<AiSuggestionState> {
  const failed = (message: string): AiSuggestionState => ({ ...previous, message });
  try {
    const fix = await awaitingFix(reportId);
    if (!fix) return failed("Suggestions are only available for a fix awaiting your QA.");
    const { report, latest, testCases, userId } = fix;

    const recorded = testCases.filter((test) => test.revision_id === latest.id).map((test) => `- ${test.description}`).join("\n");
    const result = await runAiFeature({
      feature: "qa_test_suggestions",
      userId,
      role: "qa",
      reportId,
      context: [
        { label: "Bug title", value: report.title },
        { label: "Original code", value: report.code },
        { label: "Error message", value: report.error_message },
        { label: "Expected behavior", value: report.expected_behavior },
        { label: "Actual behavior", value: report.actual_behavior },
        { label: `Proposed fix (version ${latest.revision_number})`, value: latest.code },
        { label: "Developer note", value: latest.note },
        { label: "Tests already recorded", value: recorded },
      ],
    });
    return result.ok ? { ok: true, text: result.text, message: "" } : failed(result.message);
  } catch {
    return failed("The AI could not produce a suggestion. Try again later.");
  }
}

/**
 * Drafts the decision feedback from the tests recorded on the latest version. The draft only
 * reaches the feedback box when the tester chooses to use it, and only reaches the Developer and
 * Reporter when the tester submits a decision. Without recorded tests no request is made, so no
 * quota is used on a draft that could only be guessed.
 */
export async function draftFeedback(reportId: string): Promise<AiSuggestionState> {
  // Unlike test ideas, a refusal clears the old draft: it may no longer match the recorded tests.
  const failed = (message: string): AiSuggestionState => ({ ...emptySuggestion, message });
  try {
    const fix = await awaitingFix(reportId);
    if (!fix) return failed("Drafts are only available for a fix awaiting your QA.");
    const context = feedbackDraftContext(fix.report, fix.latest, fix.testCases);
    if (!context) return failed("Record at least one test first. The draft is based on your test results.");
    const result = await runAiFeature({ feature: "qa_feedback_draft", userId: fix.userId, role: "qa", reportId, context });
    return result.ok ? { ok: true, text: fitFeedback(result.text), message: "" } : failed(result.message);
  } catch {
    return failed("The AI could not produce a draft. Try again later.");
  }
}
