import "server-only";

import { createClient } from "@/lib/supabase/server";

import { type AppRole, isAppRole } from "./roles";

/** The signed-in user and their role, or null when signed out or the profile is missing. */
export async function getSignedInRole(): Promise<{ userId: string; role: AppRole } | null> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = typeof claims?.claims?.sub === "string" ? claims.claims.sub : null;
  if (!userId) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  return isAppRole(profile?.role) ? { userId, role: profile.role } : null;
}
