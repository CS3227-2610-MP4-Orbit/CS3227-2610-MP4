"use server";

import { requestDeveloperAdvice } from "../../lib/ai/gateway";
import { createAdminClient } from "../../lib/supabase/admin";
import { createClient } from "../../lib/supabase/server";

export type AiActionState = { ok: boolean; message: string; advice?: string };
const MAX_REQUESTS_PER_MINUTE = 5;
const MAX_REQUESTS_PER_DAY = 50;
const ADVISORY_LABEL = "ADVISORY GUIDANCE — review manually; no code was run or applied.";

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

  const admin = createAdminClient();
  const minuteSince = new Date(Date.now() - 60 * 1000).toISOString();
  const daySince = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const usage = admin.from("ai_usage").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("feature", "developer_debugging_advice");
  const [minuteUsage, dayUsage] = await Promise.all([
    usage.gte("created_at", minuteSince),
    admin.from("ai_usage").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("feature", "developer_debugging_advice").gte("created_at", daySince),
  ]);
  if (minuteUsage.error || dayUsage.error) return { ok: false, message: "AI assistance usage could not be verified. Continue with the manual workflow." };
  if ((minuteUsage.count ?? 0) >= MAX_REQUESTS_PER_MINUTE) return { ok: false, message: "The AI assistance limit of five requests per minute has been reached. Continue manually and try again later." };
  if ((dayUsage.count ?? 0) >= MAX_REQUESTS_PER_DAY) return { ok: false, message: "The daily AI assistance limit has been reached. Continue manually and try again later." };
  const started = Date.now();
  const result = await requestDeveloperAdvice({
    code: report.code ?? "",
    errorMessage: report.error_message ?? "",
    expectedBehavior: report.expected_behavior ?? "",
    actualBehavior: report.actual_behavior ?? "",
    reproductionSteps: report.reproduction_steps ?? "",
    notes: (notes ?? []).map((note) => note.body).join("\n\n"),
  });
  await admin.from("ai_usage").insert({ user_id: userId, report_id: report.id, feature: "developer_debugging_advice", model: process.env.SOCLAAS_MODEL ?? "unconfigured", outcome: result.ok ? "success" : "failure", latency_ms: Date.now() - started, retry_count: 0 });
  return result.ok ? { ok: true, message: "Advisory guidance generated.", advice: `${ADVISORY_LABEL}\n\n${result.text}` } : { ok: false, message: result.message };
}
