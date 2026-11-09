"use server";

import { createClient } from "../../../lib/supabase/server";
import { runAiFeature } from "../../../lib/ai/gateway";
import { parseDraftForQualityCheck } from "../../../lib/reports/quality-check";
import { reportFields } from "../../../lib/reports/validation";

export type QualityCheckResult = { ok: true; text: string; message: "" } | { ok: false; text: ""; message: string };

const labels = {
  title: "Title", python_code: "Python code", error_message: "Error message",
  expected_behavior: "Expected behavior", actual_behavior: "Actual behavior",
  reproduction_steps: "Reproduction steps",
} as const;

export async function checkReportQuality(form: FormData): Promise<QualityCheckResult> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { ok: false, text: "", message: "Sign in as a Reporter to check your report." };
    const { data: profile, error: profileError } = await supabase.from("profiles")
      .select("role").eq("id", user.id).single();
    if (profileError || profile?.role !== "reporter") {
      return { ok: false, text: "", message: "Only Reporters can check a draft report." };
    }
    const parsed = parseDraftForQualityCheck(form);
    if (!parsed.ok) return { ok: false, text: "", message: parsed.message };
    const result = await runAiFeature({
      feature: "reporter_quality_check", role: "reporter", userId: user.id, reportId: null,
      context: reportFields.map((field) => ({
        label: labels[field], value: parsed.values[field].trim() ? parsed.values[field] : "[Not provided]",
      })),
    });
    return result.ok
      ? { ok: true, text: result.text, message: "" }
      : { ok: false, text: "", message: result.message };
  } catch {
    return { ok: false, text: "", message: "The quality check is unavailable right now. Try again later." };
  }
}
