"use server";

import { runAiFeature } from "../../lib/ai/gateway";
import { parseCodeImprovement, redactSensitiveText, type CodeImprovementReview } from "../../lib/ai/code-improvement";
import { createClient } from "../../lib/supabase/server";

export type AiActionState = { ok: boolean; message: string; advice?: string; review?: CodeImprovementReview };
const ADVISORY_LABEL = "ADVISORY GUIDANCE — review manually; no code was run or applied.";
const MAX_DEVELOPER_CODE_CHARS = 8000;
const MAX_DEVELOPER_CONTEXT_CHARS = 4000;
const MAX_IMPROVEMENT_CODE_CHARS = 5000;
const MAX_IMPROVEMENT_CONTEXT_CHARS = 4000;

export async function requestDeveloperDebuggingAdvice(_previous: AiActionState, formData: FormData): Promise<AiActionState> {
  const reportId = formData.get("reportId");
  if (typeof reportId !== "string" || !/^[0-9a-f-]{36}$/i.test(reportId)) return { ok: false, message: "The report identifier is invalid." };
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = typeof claims?.claims?.sub === "string" ? claims.claims.sub : null;
  if (!userId) return { ok: false, message: "You must be signed in." };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (profile?.role !== "developer") return { ok: false, message: "Developer AI assistance is unavailable for this account." };
  const { data: report } = await supabase.from("bug_reports").select("id, developer_id, code, error_message, expected_behavior, actual_behavior, reproduction_steps").eq("id", reportId).eq("developer_id", userId).maybeSingle();
  if (!report) return { ok: false, message: "This report is not available." };
  const { data: notes } = await supabase.from("investigation_notes").select("body").eq("report_id", reportId).order("created_at", { ascending: false }).limit(5);

  const supportingContext = [
    `Error message:\n${report.error_message ?? ""}`,
    `Expected behavior:\n${report.expected_behavior ?? ""}`,
    `Actual behavior:\n${report.actual_behavior ?? ""}`,
    `Reproduction steps:\n${report.reproduction_steps ?? ""}`,
    `Investigation notes:\n${(notes ?? []).map((note) => note.body).join("\n\n")}`,
  ].join("\n\n");
  const result = await runAiFeature({
    feature: "developer_debugging",
    userId,
    role: "developer",
    reportId: report.id,
    context: [
      { label: "Original Python code", value: (report.code ?? "").slice(0, MAX_DEVELOPER_CODE_CHARS) },
      { label: "Developer report context", value: supportingContext.slice(0, MAX_DEVELOPER_CONTEXT_CHARS) },
    ],
  });
  return result.ok ? { ok: true, message: "Advisory guidance generated.", advice: `${ADVISORY_LABEL}\n\n${result.text}` } : { ok: false, message: result.message };
}

export async function requestDeveloperCodeImprovement(_previous: AiActionState, formData: FormData): Promise<AiActionState> {
  const reportId = formData.get("reportId");
  if (typeof reportId !== "string" || !/^[0-9a-f-]{36}$/i.test(reportId)) return { ok: false, message: "The report identifier is invalid." };
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = typeof claims?.claims?.sub === "string" ? claims.claims.sub : null;
  if (!userId) return { ok: false, message: "You must be signed in." };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (profile?.role !== "developer") return { ok: false, message: "Developer AI assistance is unavailable for this account." };
  const { data: report } = await supabase.from("bug_reports")
    .select("id, developer_id, status, code, error_message, expected_behavior, actual_behavior, reproduction_steps")
    .eq("id", reportId).eq("developer_id", userId).maybeSingle();
  if (!report || report.status === "closed") return { ok: false, message: "This report is not available." };
  const safeCode = redactSensitiveText(report.code ?? "");
  if (!safeCode.trim()) return { ok: false, message: "This report does not contain usable Python code." };
  if (safeCode.length > MAX_IMPROVEMENT_CODE_CHARS) return { ok: false, message: "This report is too large for an AI suggestion." };
  const notesResult = await supabase.from("investigation_notes").select("body").eq("report_id", reportId)
    .order("created_at", { ascending: false }).limit(5);
  const supportingContext = redactSensitiveText([
    `Error message:\n${report.error_message ?? ""}`,
    `Expected behavior:\n${report.expected_behavior ?? ""}`,
    `Actual behavior:\n${report.actual_behavior ?? ""}`,
    `Reproduction steps:\n${report.reproduction_steps ?? ""}`,
    `Investigation notes:\n${(notesResult.data ?? []).map((note) => note.body).join("\n\n")}`,
  ].join("\n\n"));
  if (supportingContext.length > MAX_IMPROVEMENT_CONTEXT_CHARS) return { ok: false, message: "This report context is too large for an AI suggestion." };
  const result = await runAiFeature({
    feature: "developer_code_improvement",
    userId,
    role: "developer",
    reportId: report.id,
    context: [
      { label: "Original Python code", value: safeCode },
      { label: "Developer report context", value: supportingContext },
    ],
  });
  if (!result.ok) return { ok: false, message: result.message };
  const parsed = parseCodeImprovement(result.text);
  if (!parsed) return { ok: false, message: "The AI returned an unusable improvement review. Try again later." };
  return { ok: true, message: "Improvement guidance generated.", review: parsed, advice: ADVISORY_LABEL };
}
