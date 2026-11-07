import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { QueueReport } from "./queue";

// Reads run as the signed-in user, so row-level security limits every query to reports this
// QA tester is assigned to. The role check here only decides which message to show.

export type Denied = { kind: "denied"; reason: "unauthenticated" | "not_qa" };

export type Revision = { id: string; revision_number: number; author_id: string; code: string; note: string; created_at: string };
export type TestCase = {
  id: string; revision_id: string; description: string; expected_result: string;
  actual_result: string; outcome: "pass" | "fail"; created_at: string;
};
export type Decision = { id: string; revision_id: string; verdict: "approve" | "reject"; feedback: string; created_at: string };
export type StatusEvent = { id: number; from_status: string | null; to_status: string; actor_id: string | null; created_at: string };

export type QaReview = {
  kind: "ok";
  report: {
    id: string; title: string; code: string; error_message: string; expected_behavior: string;
    actual_behavior: string; reproduction_steps: string; status: string; created_at: string;
  };
  revisions: Revision[];
  testCases: TestCase[];
  decisions: Decision[];
  events: StatusEvent[];
  names: Record<string, string>;
};

async function signedInQa() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = typeof claims?.claims?.sub === "string" ? claims.claims.sub : null;
  if (!userId) return { supabase, denied: { kind: "denied", reason: "unauthenticated" } as Denied };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (profile?.role !== "qa") return { supabase, denied: { kind: "denied", reason: "not_qa" } as Denied };
  return { supabase, userId, denied: null };
}

export async function getQaQueue(): Promise<Denied | { kind: "ok"; reports: QueueReport[] }> {
  const { supabase, userId, denied } = await signedInQa();
  if (denied) return denied;
  const { data, error } = await supabase
    .from("bug_reports")
    .select("id, title, status, created_at, updated_at")
    .eq("qa_id", userId);
  if (error) throw new Error("Unable to load the QA queue.");
  return { kind: "ok", reports: data as QueueReport[] };
}

/** Everything the review page needs, or null when the report is not assigned to this QA tester. */
export async function getQaReview(reportId: string): Promise<Denied | QaReview | null> {
  const { supabase, userId, denied } = await signedInQa();
  if (denied) return denied;

  const { data: report, error } = await supabase
    .from("bug_reports")
    .select("id, title, code, error_message, expected_behavior, actual_behavior, reproduction_steps, status, created_at")
    .eq("id", reportId)
    .eq("qa_id", userId)
    .maybeSingle();
  if (error) throw new Error("Unable to load the report.");
  if (!report) return null;

  const { data: revisions, error: revisionError } = await supabase
    .from("fix_revisions")
    .select("id, revision_number, author_id, code, note, created_at")
    .eq("report_id", reportId)
    .order("revision_number", { ascending: false });
  if (revisionError) throw new Error("Unable to load revisions.");
  const revisionIds = (revisions ?? []).map((revision) => revision.id);

  const [tests, decisions, events] = await Promise.all([
    supabase.from("test_cases")
      .select("id, revision_id, description, expected_result, actual_result, outcome, created_at")
      .in("revision_id", revisionIds).order("created_at"),
    supabase.from("qa_decisions")
      .select("id, revision_id, verdict, feedback, created_at")
      .in("revision_id", revisionIds),
    supabase.from("status_events")
      .select("id, from_status, to_status, actor_id, created_at")
      .eq("report_id", reportId).order("id"),
  ]);
  if (tests.error || decisions.error || events.error) throw new Error("Unable to load the review history.");

  const people = new Set<string>([
    ...(revisions ?? []).map((revision) => revision.author_id),
    ...(events.data ?? []).flatMap((event) => (event.actor_id ? [event.actor_id] : [])),
  ]);
  const { data: profiles } = people.size
    ? await supabase.from("profiles").select("id, full_name").in("id", [...people])
    : { data: [] };
  const names = Object.fromEntries((profiles ?? []).map((profile) => [profile.id, profile.full_name]));

  return {
    kind: "ok",
    report,
    revisions: (revisions ?? []) as Revision[],
    testCases: (tests.data ?? []) as TestCase[],
    decisions: (decisions.data ?? []) as Decision[],
    events: (events.data ?? []) as StatusEvent[],
    names,
  };
}
