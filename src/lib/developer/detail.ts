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
  revisions: Array<{ id: string; revision_number: number; author_id: string; code: string; note: string; created_at: string }>;
  decisions: Array<{ revision_id: string; verdict: string; feedback: string; created_at: string }>;
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

  const [{ data: notes, error: notesError }, { data: revisions, error: revisionsError }] = await Promise.all([
    supabase
    .from("investigation_notes")
    .select("id, author_id, body, created_at, updated_at")
    .eq("report_id", reportId)
    .order("created_at", { ascending: true }),
    supabase
      .from("fix_revisions")
      .select("id, revision_number, author_id, code, note, created_at")
      .eq("report_id", reportId)
      .order("revision_number", { ascending: true }),
  ]);
  if (notesError || revisionsError) throw new Error("Unable to load report details.");
  const revisionIds = (revisions ?? []).map((revision) => revision.id);
  const { data: decisions, error: decisionsError } = revisionIds.length
    ? await supabase.from("qa_decisions").select("revision_id, verdict, feedback, created_at").in("revision_id", revisionIds)
    : { data: [], error: null };
  if (decisionsError) throw new Error("Unable to load QA feedback.");

  return { report, notes: notes ?? [], revisions: revisions ?? [], decisions: decisions ?? [] } as DeveloperReportDetail;
}
