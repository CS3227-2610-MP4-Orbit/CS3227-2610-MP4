export type QaActionState = { ok: boolean; message: string; errors: Record<string, string>; values: Record<string, string> };

export const emptyState: QaActionState = { ok: false, message: "", errors: {}, values: {} };

export type AiSuggestionState = { ok: boolean; text: string; message: string };

export const emptySuggestion: AiSuggestionState = { ok: false, text: "", message: "" };
