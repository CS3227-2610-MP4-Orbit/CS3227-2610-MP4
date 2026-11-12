export type QaActionState = { ok: boolean; message: string; errors: Record<string, string>; values: Record<string, string> };

export const emptyState: QaActionState = { ok: false, message: "", errors: {}, values: {} };

export type AiSuggestionState = {
  ok: boolean; text: string; message: string;
  /** For a feedback draft: the tests it was based on (see `testsKey`). */
  basedOn?: string;
};

export const emptySuggestion: AiSuggestionState = { ok: false, text: "", message: "" };
