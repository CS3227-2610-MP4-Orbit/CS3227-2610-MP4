import { z } from "zod";

const category = z.enum(["readability", "maintainability", "performance", "SRP", "DRY"]);
const suggestion = z.object({
  category,
  title: z.string().trim().min(1).max(160),
  rationale: z.string().trim().min(1).max(800),
  benefit: z.string().trim().min(1).max(500),
  tradeoff: z.string().trim().max(500),
  illustrativeCode: z.string().max(2500).optional(),
});

const review = z.object({
  summary: z.string().trim().max(500),
  suggestions: z.array(suggestion).max(8),
});

export type CodeImprovementSuggestion = z.infer<typeof suggestion>;
export type CodeImprovementReview = z.infer<typeof review>;

/** Redacts common credential-shaped values before report data reaches the provider. */
export function redactSensitiveText(value: string): string {
  return value
    .replace(/\b(?:sk|ghp|github_pat|xox[baprs])-[-\w]{12,}\b/gi, "[secret redacted]")
    .replace(/\bAKIA[0-9A-Z]{16}\b/g, "[secret redacted]")
    .replace(/\b(?:api[_-]?key|access[_-]?token|secret|password)\s*[:=]\s*[^\s,;]+/gi, "$1=[secret redacted]");
}

/**
 * Normalizes provider text into the small display contract. The provider is untrusted, so any
 * shape outside the contract is rejected instead of being shown as a pseudo-review.
 */
export function parseCodeImprovement(text: string): CodeImprovementReview | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const candidate = trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  try {
    const parsed: unknown = JSON.parse(candidate);
    const result = review.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
