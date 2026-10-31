import { createBrowserClient } from "@supabase/ssr";

/** Supabase client for Client Components. Acts as the signed-in user. */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
