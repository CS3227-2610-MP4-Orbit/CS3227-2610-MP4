"use server";

import { runAiFeature } from "../../lib/ai/gateway";
import { createClient } from "../../lib/supabase/server";

export type AiActionState = { ok: boolean; message: string; advice?: string };
const ADVISORY_LABEL = "ADVISORY GUIDANCE — review manually; no code was run or applied.";
const MAX_DEVELOPER_CODE_CHARS = 8000;
const MAX_DEVELOPER_CONTEXT_CHARS = 4000;

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
