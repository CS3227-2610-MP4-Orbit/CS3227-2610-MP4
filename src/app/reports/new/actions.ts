"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { reportSchema, valuesFromForm, type ReportField, type ReportValues } from "@/lib/reports/validation";

export type ReportState = { values: ReportValues; errors: Partial<Record<ReportField, string>>; error?: string };

export async function createReport(_previous: ReportState, form: FormData): Promise<ReportState> {
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

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { values, errors: {}, error: "Sign in to submit a report." };

  const { data: profile, error: profileError } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profileError || profile?.role !== "reporter") {
    return { values, errors: {}, error: "Only reporters can submit a report." };
  }

  const { error } = await supabase.from("bug_reports").insert({ ...parsed.data, reporter_id: user.id });
  if (error) return { values, errors: {}, error: "Could not save the report. Please try again." };
  redirect("/reports?submitted=1");
}
