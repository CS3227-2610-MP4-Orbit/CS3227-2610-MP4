import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client using the secret key. It BYPASSES row-level security.
 * Use only for server-side work that no user role may do directly
 * (e.g. AI usage accounting, creating lecturer accounts), and check permissions first.
 */
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
