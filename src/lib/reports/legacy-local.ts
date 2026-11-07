type DatabaseError = { code?: string; message?: string } | null;

/** Compatibility for the pre-lifecycle local Supabase database only. */
export function canUseLegacyLocalReports(error: DatabaseError): boolean {
  if (process.env.NODE_ENV !== "development" || !error) return false;
  try {
    const host = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
    if (host !== "localhost" && host !== "127.0.0.1") return false;
  } catch {
    return false;
  }
  const message = error.message ?? "";
  return (error.code === "42703" && /column (?:[\w]+\.)?code does not exist/i.test(message)) ||
    (error.code === "PGRST204" && /(?:column|field) ['"]code['"]|['"]code['"] (?:column|field)/i.test(message));
}
