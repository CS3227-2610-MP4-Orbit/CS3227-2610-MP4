import "server-only";

import { createClient } from "@/lib/supabase/server";

export type DeveloperReportDetail = {
  report: {
    id: string;
    title: string;
    code: string;
    error_message: string | null;
    expected_behavior: string;
    actual_behavior: string | null;
    reproduction_steps: string;
    status: string;
    created_at: string;
    updated_at: string;
  };
  notes: Array<{ id: string; author_id: string; body: string; created_at: string; updated_at: string }>;
};

export async function getAssignedDeveloperReportDetail(reportId: string): Promise<DeveloperReportDetail | null> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = typeof claims?.claims?.sub === "string" ? claims.claims.sub : null;
  if (!userId) return null;

  const { data: report } = await supabase
    .from("bug_reports")
    .select("id, title, code, error_message, expected_behavior, actual_behavior, reproduction_steps, status, created_at, updated_at")
    .eq("id", reportId)
    .eq("developer_id", userId)
    .maybeSingle();
  if (!report) return null;

  const { data: notes, error } = await supabase
    .from("investigation_notes")
    .select("id, author_id, body, created_at, updated_at")
    .eq("report_id", reportId)
    .order("created_at", { ascending: true });
  if (error) throw new Error("Unable to load investigation notes.");

  return { report, notes: notes ?? [] } as DeveloperReportDetail;
}
