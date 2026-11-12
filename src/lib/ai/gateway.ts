import "server-only";

import { createAdminClient } from "../supabase/admin";

import { type AiFeature, type AppRole, boundContext, buildMessages, type ContextField, FEATURES, parseCompletion } from "./prompt";

// The only way the app calls the SoC LLM (spec 001 FR-009, FR-010). Callers must already have
// checked the user's role and loaded the context through the user's own session, so row-level
// security decided what the user may see. The gateway then:
//   1. refuses a feature that belongs to another role, and context that is empty or too large;
//   2. claims a usage row and enforces per-user and app-wide limits (the claim makes concurrent
//      requests count against each other);
//   3. calls the provider with a timeout and at most one retry for server errors;
//   4. records the outcome, tokens and latency, never the prompt or the answer.

/** Per user and feature. */
export const LIMITS = { perMinute: 3, perDay: 20 } as const;
/** Across all users, to stay under the provider's request rate. */
export const APP_PER_MINUTE = 20;
export const TIMEOUT_MS = 20_000;
const RETRY_DELAY_MS = 500;

export type AiFailure = "wrong_role" | "not_configured" | "input_too_large" | "rate_limited" | "daily_limit"
  | "busy" | "timeout" | "provider_error" | "unavailable";

export type AiResult = { ok: true; text: string } | { ok: false; reason: AiFailure; message: string };

/** Safe to show users: no provider, schema or configuration detail. */
const MESSAGES: Record<AiFailure, string> = {
  wrong_role: "This AI suggestion is not available for your role.",
  not_configured: "AI suggestions are not available right now.",
  input_too_large: "This report is too large for an AI suggestion.",
  rate_limited: "You asked for suggestions too often. Try again in a minute.",
  daily_limit: `You have used today's ${LIMITS.perDay} suggestions for this feature. Try again tomorrow.`,
  busy: "AI suggestions are busy right now. Try again shortly.",
  timeout: "The AI took too long to respond. Try again.",
  provider_error: "The AI could not produce a suggestion. Try again later.",
  unavailable: "AI suggestions are not available right now. Try again later.",
};

/**
 * "busy" is the app-wide limit refusing before any call; "provider_busy" is the provider's own 429,
 * which did reach the provider and so counts toward the limits.
 */
type Outcome = "ok" | "rate_limited" | "daily_limit" | "busy" | "provider_busy" | "timeout" | "provider_error";

/** Outcomes that never reached the provider, so they do not use up quota. */
export const REFUSED = ["rate_limited", "daily_limit", "busy"] as const;
/**
 * A row still "pending" after this long was abandoned (the process died, or recording the result
 * failed). It stops counting, so a failure cannot lock a user out.
 */
export const STALE_PENDING_MS = 2 * 60_000;

export type UsageStore = {
  claim(row: { userId: string; reportId: string | null; feature: AiFeature; model: string }): Promise<number>;
  /**
   * Rows created since `since` that reached, or are about to reach, the provider: not REFUSED, and
   * not pending from before `stalePendingBefore`.
   */
  countSince(filter: { since: Date; stalePendingBefore: Date; userId?: string; feature?: AiFeature }): Promise<number>;
  finish(id: number, result: { outcome: Outcome; inputTokens?: number | null; outputTokens?: number | null;
    cachedTokens?: number | null; latencyMs: number; retryCount: number }): Promise<void>;
};

export type GatewayDeps = {
  store: UsageStore;
  fetch: typeof fetch;
  now: () => Date;
  sleep: (ms: number) => Promise<void>;
  env: { baseUrl?: string; apiKey?: string; model?: string };
  /** Defaults to TIMEOUT_MS. */
  timeoutMs?: number;
};

export type AiRequest = {
  feature: AiFeature;
  userId: string;
  /** The role the caller already verified; this only catches a feature wired to the wrong role. */
  role: AppRole;
  reportId: string | null;
  context: readonly ContextField[];
};

const isTimeout = (error: unknown) => error instanceof DOMException && error.name === "TimeoutError";

/** Never throws: every failure, including the usage store being down, becomes an AiResult. */
export async function runAiFeature(request: AiRequest, deps: GatewayDeps = defaultDeps()): Promise<AiResult> {
  const fail = (reason: AiFailure): AiResult => ({ ok: false, reason, message: MESSAGES[reason] });
  const { baseUrl, apiKey, model } = deps.env;
  if (FEATURES[request.feature].role !== request.role) return fail("wrong_role");
  if (!baseUrl || !apiKey || !model) return fail("not_configured");
  const bounded = boundContext(request.context);
  if (!bounded.ok) return fail("input_too_large");

  const { store } = deps;
  const started = deps.now();
  const elapsed = () => deps.now().getTime() - started.getTime();
  let id: number;
  try {
    id = await store.claim({ userId: request.userId, reportId: request.reportId, feature: request.feature, model });
  } catch {
    return fail("unavailable");
  }
  // Recording the result is best effort: a failure here must not hide an answer the user already
  // paid quota for, and the row stops counting once it is stale.
  const record = (result: Parameters<UsageStore["finish"]>[1]) =>
    store.finish(id, result).catch(() => console.error("Could not record an AI usage result."));

  let retryCount = 0;
  try {
    const at = started.getTime();
    const window = { stalePendingBefore: new Date(at - STALE_PENDING_MS) };
    const [userMinute, userDay, appMinute] = await Promise.all([
      store.countSince({ ...window, since: new Date(at - 60_000), userId: request.userId, feature: request.feature }),
      store.countSince({ ...window, since: new Date(at - 86_400_000), userId: request.userId, feature: request.feature }),
      store.countSince({ ...window, since: new Date(at - 60_000) }),
    ]);
    // Counts include this request's own claim, so the limit is exceeded only above it.
    const refusal = userDay > LIMITS.perDay ? "daily_limit" : userMinute > LIMITS.perMinute ? "rate_limited"
      : appMinute > APP_PER_MINUTE ? "busy" : null;
    if (refusal) {
      await record({ outcome: refusal, latencyMs: 0, retryCount: 0 });
      return fail(refusal);
    }

    const messages = buildMessages(request.feature, bounded.fields, crypto.randomUUID());
    let outcome: Outcome = "provider_error";
    let completion: ReturnType<typeof parseCompletion> = null;
    for (;;) {
      try {
        const response = await deps.fetch(`${baseUrl.replace(/\/+$/, "")}/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({ model, messages, max_tokens: FEATURES[request.feature].maxOutputTokens, temperature: 0.2 }),
          signal: AbortSignal.timeout(deps.timeoutMs ?? TIMEOUT_MS),
        });
        if (response.ok) {
          // The timeout also covers reading the body; only a malformed body becomes null.
          const body = await response.json().catch((error: unknown) => { if (isTimeout(error)) throw error; return null; });
          completion = parseCompletion(body);
          outcome = completion ? "ok" : "provider_error";
          break;
        }
        // The provider's own rate limit: retrying would only spend more of it.
        if (response.status === 429) { outcome = "provider_busy"; break; }
        if (response.status < 500 || retryCount >= 1) break;
      } catch (error) {
        if (isTimeout(error)) { outcome = "timeout"; break; }
        if (retryCount >= 1) break;
      }
      retryCount += 1;
      await deps.sleep(RETRY_DELAY_MS);
    }

    await record({
      outcome,
      inputTokens: completion?.inputTokens,
      outputTokens: completion?.outputTokens,
      cachedTokens: completion?.cachedTokens,
      latencyMs: elapsed(),
      retryCount,
    });
    if (completion) return { ok: true, text: completion.text };
    return fail(outcome === "provider_busy" ? "busy" : outcome === "timeout" ? "timeout" : "provider_error");
  } catch {
    await record({ outcome: "provider_error", latencyMs: elapsed(), retryCount });
    return fail("unavailable");
  }
}

function defaultDeps(): GatewayDeps {
  return {
    store: supabaseUsageStore(),
    fetch: globalThis.fetch.bind(globalThis),
    now: () => new Date(),
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    env: { baseUrl: process.env.SOCLAAS_BASE_URL, apiKey: process.env.SOCLAAS_API_KEY, model: process.env.SOCLAAS_MODEL },
  };
}

/**
 * ai_usage has no row-level security policies, so only the secret-key client can use it. The
 * client is created on first use, so a configuration error surfaces as a failed claim.
 * Windows use the app clock against the database's created_at; the servers are NTP-synced, and a
 * large skew would only shift a window, never let a request skip its own claim.
 */
function supabaseUsageStore(): UsageStore {
  let client: ReturnType<typeof createAdminClient> | undefined;
  const db = () => (client ??= createAdminClient());
  return {
    async claim({ userId, reportId, feature, model }) {
      const { data, error } = await db().from("ai_usage")
        .insert({ user_id: userId, report_id: reportId, feature, model, outcome: "pending" })
        .select("id").single();
      if (error || !data) throw new Error("Could not record AI usage.");
      return data.id as number;
    },
    async countSince({ since, stalePendingBefore, userId, feature }) {
      let query = db().from("ai_usage").select("id", { count: "exact", head: true })
        .gte("created_at", since.toISOString())
        .not("outcome", "in", `(${REFUSED.join(",")})`)
        .or(`outcome.neq.pending,created_at.gte."${stalePendingBefore.toISOString()}"`);
      if (userId) query = query.eq("user_id", userId);
      if (feature) query = query.eq("feature", feature);
      const { count, error } = await query;
      if (error || count === null) throw new Error("Could not check AI usage.");
      return count;
    },
    async finish(id, result) {
      const { error } = await db().from("ai_usage").update({
        outcome: result.outcome,
        input_tokens: result.inputTokens ?? null,
        output_tokens: result.outputTokens ?? null,
        cached_tokens: result.cachedTokens ?? null,
        latency_ms: result.latencyMs,
        retry_count: result.retryCount,
      }).eq("id", id);
      if (error) throw new Error("Could not record the AI usage result.");
    },
  };
}
