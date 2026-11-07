"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { decisionSchema, fieldErrors, formFields, idSchema, testCaseSchema } from "@/lib/qa/validation";

import { emptyState, type QaActionState } from "./state";


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
