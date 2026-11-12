// Context and length rules for QA's feedback draft (spec 001 US4 scenario 4). Pure, so the
// choice of what reaches the model is tested without a network or database.

import type { ContextField } from "../ai/prompt";
import type { Revision, TestCase } from "./queries";
import { FEEDBACK_MAX } from "./validation";

export const DRAFT_SHORTENED = "\n[Draft shortened]";

const PROVIDER_SHORTENED = "\n[Suggestion shortened]";
const LINK = /\b(?:https?:\/\/|www\.)\S+/gi;

type DraftReport = { expected_behavior: string };

/**
 * The draft is grounded in what QA observed, so the context is the expected behavior, the
 * developer's note and the latest version's test results. The title, the reported failure and the
 * code are left out: the tests already describe the behavior that matters, and less Reporter-written
 * text in the prompt leaves less room for injected instructions to steer a note that QA forwards.
 * Null when that version has no tests: there is nothing to base a draft on, so no request is made.
 */
export function feedbackDraftContext(
  report: DraftReport,
  latest: Pick<Revision, "id" | "revision_number" | "note">,
  tests: readonly TestCase[],
): ContextField[] | null {
  const own = tests.filter((test) => test.revision_id === latest.id);
  if (!own.length) return null;
  const failed = own.filter((test) => test.outcome === "fail").length;
  const plural = (n: number) => `${n} test${n === 1 ? "" : "s"}`;
  return [
    { label: "Expected behavior", value: report.expected_behavior },
    { label: `Developer note on version ${latest.revision_number}`, value: latest.note },
    { label: "Outcome", value: failed ? `${failed} of ${plural(own.length)} failed` : `All ${plural(own.length)} passed` },
    {
      label: "Test results",
      value: own.map((test, index) => [
        `${index + 1}. ${test.outcome === "pass" ? "PASS" : "FAIL"}: ${test.description}`,
        `   Expected: ${test.expected_result}`,
        `   Actual: ${test.actual_result}`,
      ].join("\n")).join("\n"),
    },
  ];
}

/**
 * Prepares a draft for the feedback box. Links are removed, because the note is forwarded to the
 * Developer and Reporter and a link could only come from injected text, never from test results.
 * The draft must also fit the box, or the decision it goes into would be refused.
 */
export function fitFeedback(text: string): string {
  const shortened = text.endsWith(PROVIDER_SHORTENED);
  const body = (shortened ? text.slice(0, -PROVIDER_SHORTENED.length) : text).replace(LINK, "[link removed]").trim();
  if (!shortened && body.length <= FEEDBACK_MAX) return body;
  return body.slice(0, FEEDBACK_MAX - DRAFT_SHORTENED.length).trimEnd() + DRAFT_SHORTENED;
}
