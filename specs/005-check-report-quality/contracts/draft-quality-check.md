# Contract: Reporter draft quality check

## User-facing interaction

- **Location**: New Report form, before Submit report.
- **Control**: Check my report, separate from submission and usable on a partially complete draft.
- **Input**: The current six draft fields. A blank draft receives a prompt to enter details without using AI quota.
- **Success**: Show a clearly labeled, plain-text AI suggestion grouped by field name. Omit fields that need no improvement; state when the report is already clear enough or information is missing. Do not apply edits.
- **Failure**: Show a safe message. Keep the draft and any previous successful suggestion. The Reporter may still submit a valid report.
- **Staleness**: If any draft field changes after a successful check, label that suggestion as based on an earlier draft until another check succeeds.

## Server-action boundary

The action accepts the six current draft values as untrusted strings. It authenticates the caller and confirms the Reporter role before the AI request. It validates types and lengths and refuses an all-blank or oversized draft. It invokes only the server-side `reporter_quality_check` gateway feature with `reportId: null`; it never calls report creation or updates a report. Its response contains only a bounded suggestion or a safe error message, not provider details or credentials.

## Security and verification contract

- Anonymous and non-Reporter requests are refused before any provider call.
- Forged extra fields and unrelated report IDs are ignored, not forwarded.
- Code, comments, and prose remain untrusted data inside the gateway's prompt boundary.
- Output is rendered as text; no HTML interpretation, code execution, or automatic form mutation occurs.
- Tests cover empty and oversized drafts, cross-role requests, injection text, quota refusal, timeout, malformed output, failed retry, and submission independence.
