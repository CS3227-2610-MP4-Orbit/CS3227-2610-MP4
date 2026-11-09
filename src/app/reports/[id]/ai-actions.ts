"use server";

import { runAiFeature } from "@/lib/ai/gateway";
import { createClient } from "@/lib/supabase/server";

export type ExplanationState = { ok: boolean; text: string; message: string };

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function explainReport(id: string, previous: ExplanationState): Promise<ExplanationState> {
  const fail = (message: string): ExplanationState => ({ ...previous, message });
  const unavailable = "This report is not available for an AI explanation.";
  if (!uuid.test(id)) return fail(unavailable);

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return fail("Sign in as the Reporter to request an explanation.");

    const { data: profile, error: profileError } = await supabase.from("profiles")
      .select("role").eq("id", user.id).single();
    if (profileError || profile?.role !== "reporter") return fail(unavailable);

    // Load through the caller's session. RLS and reporter_id both restrict the report to its owner.
    const { data: report, error: reportError } = await supabase.from("bug_reports")
      .select("title,code,error_message,expected_behavior,actual_behavior,reproduction_steps")
      .eq("id", id).eq("reporter_id", user.id).maybeSingle();
    if (reportError || !report) return fail(unavailable);

    const result = await runAiFeature({
      feature: "reporter_code_explanation",
      userId: user.id,
      role: "reporter",
      reportId: id,
      context: [
        { label: "Bug title", value: report.title },
        { label: "Reported Python code", value: report.code },
        { label: "Error message", value: report.error_message },
        { label: "Expected behavior", value: report.expected_behavior },
        { label: "Actual behavior", value: report.actual_behavior },
        { label: "Reproduction steps", value: report.reproduction_steps },
      ],
    });
    return result.ok ? { ok: true, text: result.text, message: "" } : fail(result.message);
  } catch {
    return fail("The AI could not produce an explanation. Try again later.");
  }
}
