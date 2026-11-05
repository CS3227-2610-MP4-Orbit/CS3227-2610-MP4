"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { reportSchema, valuesFromForm, type ReportField } from "@/lib/reports/validation";
import type { ReportState } from "../new/actions";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function updateReport(id: string, _previous: ReportState, form: FormData): Promise<ReportState> {
  const values = valuesFromForm(form);
  const parsed = reportSchema.safeParse(values);
  if (!parsed.success) {
    const errors: ReportState["errors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as ReportField;
      errors[field] ??= issue.message;
    }
    return { values, errors };
  }
  if (!uuid.test(id)) return { values, errors: {}, error: "Could not update this report." };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { values, errors: {}, error: "Sign in to edit a report." };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "reporter") return { values, errors: {}, error: "Could not update this report." };
  const { data, error } = await supabase.from("bug_reports")
    .update(parsed.data).eq("id", id).eq("reporter_id", user.id).eq("status", "open")
    .select("id").maybeSingle();
  if (error || !data) return { values, errors: {}, error: "Could not update this report. It may no longer be open." };
  redirect(`/reports/${id}?saved=1`);
}
