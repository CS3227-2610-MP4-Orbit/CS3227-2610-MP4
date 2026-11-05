import "server-only";

import { createClient } from "@/lib/supabase/server";

export type DeveloperReport = {
  id: string;
  title: string;
  status: string;
  updated_at: string;
  created_at: string;
};

export type DeveloperQueryResult =
  | { kind: "denied"; reason: "unauthenticated" | "not_developer" }
  | { kind: "ok"; reports: DeveloperReport[] };

export function mapDeveloperReports(rows: unknown): DeveloperReport[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => {
    const value = row as Record<string, unknown>;
    return {
      id: String(value.id),
      title: String(value.title),
      status: String(value.status),
      updated_at: String(value.updated_at),
      created_at: String(value.created_at),
    };
  });
}

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
