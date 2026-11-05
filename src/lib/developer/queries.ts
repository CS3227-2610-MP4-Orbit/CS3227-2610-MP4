import "server-only";

import { createClient } from "@/lib/supabase/server";
import { mapDeveloperReports, type DeveloperReport } from "./report-model";

export type DeveloperQueryResult =
  | { kind: "denied"; reason: "unauthenticated" | "not_developer" }
  | { kind: "ok"; reports: DeveloperReport[] };

export async function getAssignedDeveloperReports(): Promise<DeveloperQueryResult> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = typeof claims?.claims?.sub === "string" ? claims.claims.sub : null;
  if (!userId) return { kind: "denied", reason: "unauthenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (profile?.role !== "developer") return { kind: "denied", reason: "not_developer" };

  const { data, error } = await supabase
    .from("bug_reports")
    .select("id, title, status, updated_at, created_at")
    .eq("developer_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw new Error("Unable to load assigned reports.");
  return { kind: "ok", reports: mapDeveloperReports(data) };
}
