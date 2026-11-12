import "server-only";

import { createClient } from "@/lib/supabase/server";

import { type AppRole, isAppRole } from "./roles";

export type SignedIn = { userId: string; role: AppRole; name: string; email: string };

/** The signed-in user and their role, or null when signed out or the profile is missing. */
export async function getSignedInRole(): Promise<SignedIn | null> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = typeof claims?.claims?.sub === "string" ? claims.claims.sub : null;
  if (!userId) return null;
  const email = typeof claims?.claims?.email === "string" ? claims.claims.email : "";
  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", userId).maybeSingle();
  if (!isAppRole(profile?.role)) return null;
  const name = (typeof profile.full_name === "string" && profile.full_name.trim()) || email.split("@")[0] || "Signed in";
  return { userId, role: profile.role, name, email };
}
