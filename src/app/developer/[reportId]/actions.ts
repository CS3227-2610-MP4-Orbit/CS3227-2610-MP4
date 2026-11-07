"use server";

import { revalidatePath } from "next/cache";

import { fixedPythonCodeSchema, investigationNoteSchema, reportIdSchema, safeValidationMessage, submissionNoteSchema } from "../../../lib/developer/validation";
import { createClient } from "../../../lib/supabase/server";

export type DeveloperActionState = { ok: boolean; message: string };

function value(formData: FormData, key: string) {
  const entry = formData.get(key);
  return typeof entry === "string" ? entry : "";
}

export async function submitFix(_previousState: DeveloperActionState, formData: FormData): Promise<DeveloperActionState> {
  const reportId = reportIdSchema.safeParse(value(formData, "reportId"));
  const code = fixedPythonCodeSchema.safeParse(value(formData, "code"));
  const note = submissionNoteSchema.safeParse(value(formData, "note"));
  if (!reportId.success) return { ok: false, message: safeValidationMessage(reportId.error) };
  if (!code.success) return { ok: false, message: "Corrected Python code is required and must be at most 20,000 characters." };
  if (!note.success) return { ok: false, message: safeValidationMessage(note.error) };
  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_fix", { report: reportId.data, fixed_code: code.data, submission_note: note.data });
  if (error) return { ok: false, message: "The fix could not be submitted. Check that the report is assigned to you and in progress." };
  revalidatePath(`/developer/${reportId.data}`);
  return { ok: true, message: "Fix submitted to QA." };
}

export async function startWork(_previousState: DeveloperActionState, formData: FormData): Promise<DeveloperActionState> {
  const parsed = reportIdSchema.safeParse(value(formData, "reportId"));
  if (!parsed.success) return { ok: false, message: safeValidationMessage(parsed.error) };
  const supabase = await createClient();
  const { error } = await supabase.rpc("start_work", { report: parsed.data });
  if (error) return { ok: false, message: "This report is no longer available to start." };
  revalidatePath(`/developer/${parsed.data}`);
  return { ok: true, message: "Investigation started." };
}

export async function addInvestigationNote(_previousState: DeveloperActionState, formData: FormData): Promise<DeveloperActionState> {
  const reportId = reportIdSchema.safeParse(value(formData, "reportId"));
  const body = investigationNoteSchema.safeParse(value(formData, "body"));
  if (!reportId.success) return { ok: false, message: safeValidationMessage(reportId.error) };
  if (!body.success) return { ok: false, message: safeValidationMessage(body.error) };

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = typeof claims?.claims?.sub === "string" ? claims.claims.sub : null;
  if (!userId) return { ok: false, message: "You must be signed in." };
  const { error } = await supabase.from("investigation_notes").insert({
    report_id: reportId.data,
    author_id: userId,
    body: body.data,
  });
  if (error) return { ok: false, message: "The note could not be added." };
  revalidatePath(`/developer/${reportId.data}`);
  return { ok: true, message: "Investigation note added." };
}

export async function editInvestigationNote(_previousState: DeveloperActionState, formData: FormData): Promise<DeveloperActionState> {
  const noteId = reportIdSchema.safeParse(value(formData, "noteId"));
  const reportId = reportIdSchema.safeParse(value(formData, "reportId"));
  const body = investigationNoteSchema.safeParse(value(formData, "body"));
  if (!noteId.success || !reportId.success) return { ok: false, message: "The note identifier is invalid." };
  if (!body.success) return { ok: false, message: safeValidationMessage(body.error) };

  const supabase = await createClient();
  const { error } = await supabase.from("investigation_notes").update({ body: body.data }).eq("id", noteId.data);
  if (error) return { ok: false, message: "The note could not be edited." };
  revalidatePath(`/developer/${reportId.data}`);
  return { ok: true, message: "Investigation note updated." };
}
