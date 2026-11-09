# Research: Check Report Quality

## Decision 1: Use a separate draft-check action

**Decision**: Invoke a dedicated server action with the current form values; leave the existing report-submission action unchanged.

**Rationale**: The user must be able to check an incomplete draft without triggering required-field submission validation or writing a report. The installed Next.js server-action guide requires authentication and input validation in every action, even when its button is visible only to signed-in users.

**Alternatives considered**: Reuse the submit action with an intent flag (couples two behaviors and risks accidental writes); check only after submission (misses the requested pre-submission benefit).

## Decision 2: Send all six draft fields through the existing gateway

**Decision**: Send title, Python code, error message, expected behavior, actual behavior, and reproduction steps. Represent a blank field explicitly as missing while refusing an all-blank draft before a provider call.

**Rationale**: The Reporter selected all six fields in clarification. The existing gateway bounds each field and the total input, enforces quotas, and avoids storing prompts or output. `ai_usage.report_id` is nullable, so a draft has no saved report dependency.

**Alternatives considered**: Send only prose fields (contradicts the clarification); persist a draft first (adds unnecessary storage and privacy exposure).

## Decision 3: Use a separate gateway feature identifier

**Decision**: Add `reporter_quality_check` with its own task prompt and output cap; share the gateway's user and app-wide limits.

**Rationale**: Quality checking asks whether a report is actionable, while the existing Reporter explanation asks why code fails. Separate identifiers keep instructions and usage outcomes distinguishable. The gateway currently keys per-user limits by feature and already supports multiple roles and features.

**Alternatives considered**: Reuse `reporter_code_explanation` (would give the wrong prompt and mix usage); add a second provider integration (duplicates security and limit handling).

## Decision 4: Keep suggestions as plain text beside the draft

**Decision**: Request short suggestions under field names and render them as text, with no parsed HTML or automatic field updates. This is a planning assumption because the user moved to planning before selecting an answer to the display-format question.

**Rationale**: Field names make feedback actionable; plain text matches the current AI pattern and limits output-handling risk. A changed field makes a displayed result stale. The Python editor's current hidden textarea is updated programmatically, so the editor must notify the form of code changes for accurate staleness.

**Alternatives considered**: One paragraph (harder to connect to fields); numeric score (suggests unjustified precision); structured model JSON (adds parsing and failure modes without user value).

## Decision 5: Treat failure as optional assistance

**Decision**: Return a safe message while leaving the draft and prior successful suggestion visible. Submission remains available.

**Rationale**: The feature is optional; the existing gateway already maps provider errors, timeout, quota refusal, and malformed output to user-facing messages. The installed Next.js guide documents that server actions are independent request entry points, so role checks belong in the new action as well.

**Alternatives considered**: Block submission until a check succeeds (violates the spec); clear the previous result (loses useful context when retrying).

## Sources inspected

- `node_modules/next/dist/docs/01-app/02-guides/server-actions.md`
- `node_modules/next/dist/docs/01-app/02-guides/forms.md`
- `src/app/reports/report-form.tsx`, `src/app/reports/python-editor.tsx`, and `src/app/reports/new/actions.ts`
- `src/lib/ai/gateway.ts` and `src/lib/ai/prompt.ts`
- `.specify/memory/constitution.md`
