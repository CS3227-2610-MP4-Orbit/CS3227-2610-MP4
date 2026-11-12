# Implementation Plan: Check Report Quality

**Branch**: `feature-AI-code-review` | **Date**: 2026-11-09 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/005-check-report-quality/spec.md`

## Summary

Add an optional quality check to the New Report form. A separate server action authenticates the Reporter, validates the six current draft fields, and asks the existing AI gateway for concise, field-grouped suggestions. The draft stays in the browser; the check does not create or change a bug report. Submission keeps its current validation and action.

## Technical Context

**Language/Version**: TypeScript, Next.js 16.4.2, React 19.3

**Primary Dependencies**: Existing Reporter form and validation, Supabase Auth, existing SoC AI gateway and prompt builder

**Storage**: No draft or suggestion storage. Existing `ai_usage` stores request metadata with a nullable report ID.

**Testing**: Vitest for action, prompt, and form behavior; existing typecheck and ESLint; local browser smoke test

**Target Platform**: Browser client and Next.js server on the project's current deployment

**Project Type**: Web application

**Performance Goals**: Each provider attempt uses the gateway's existing 20-second timeout. One retry and other request work can make the full check take longer; the form remains usable while waiting and shows a clear failure message when the check cannot finish.

**Constraints**: Reporter only; six current draft fields; existing per-field, total-input, output, user, and app-wide bounds; no code execution; no automatic edit or submission; no logging of draft or response text

**Scale/Scope**: One optional action on `/reports/new`, one additional Reporter AI feature identifier, no schema change or new route

## Constitution Check

*GATE: Passed before Phase 0 and rechecked after Phase 1.*

| Principle | Design response | Result |
| --- | --- | --- |
| I. Spec-driven development | This plan traces to FR-001–FR-010. The user reported team approval of the spec and shared AI feature identifier on 2026-11-09; this is recorded in `spec.md`. | Pass |
| II. Coordinated agent work | Planning is a bounded single-agent task. Implementation and security review will have named owners and evidence. | Pass |
| III. Security by design | Server action rechecks identity and Reporter role; draft is untrusted; gateway bounds prompts and outputs; no automatic action. Authorization, injection, quota, malformed output, and provider failure require tests and security review. | Pass |
| IV. Resource-aware AI | Reuse one server-only gateway with existing limits, timeout, provider configuration, and usage accounting. | Pass |
| V. Maintainable product | Keep the existing submit action and data model; isolate the optional check from the core Reporter flow. | Pass |

## Project Structure

### Documentation (this feature)

```text
specs/005-check-report-quality/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── draft-quality-check.md
└── tasks.md                 # created by $speckit-tasks later
```

### Source Code (repository root)

```text
src/
├── app/reports/
│   ├── new/page.tsx          # New Report entry point
│   ├── new/actions.ts        # existing submission, kept separate
│   ├── report-form.tsx       # draft UI and optional check control
│   └── python-editor.tsx     # reports code changes to stale-suggestion state
├── lib/
│   ├── ai/gateway.ts         # existing limits, provider call, usage
│   ├── ai/prompt.ts          # new Reporter quality-check task
│   └── reports/validation.ts # existing six-field draft normalization
└── ...                      # focused tests beside affected modules
```

**Structure Decision**: Use the current single Next.js application and existing Reporter and AI modules. Add one new server action near the New Report route; no new public API or database migration.

## Phase 0: Research

See [research.md](research.md). Existing Next.js documentation confirms that server actions need their own authentication and input validation. The current form's editor synchronizes Python text to a form field; its change notification needs to mark a displayed suggestion stale. The gateway accepts a nullable report ID, so an unsent draft can use `null` and still record request counts. No technical unknown remains.

## Phase 1: Design and Contracts

See [data-model.md](data-model.md), [contracts/draft-quality-check.md](contracts/draft-quality-check.md), and [quickstart.md](quickstart.md).

- The Check my report control is available on New Report, including partially complete drafts. An all-blank draft receives a local message without an AI request. The check uses the current field values without running native submission validation.
- A dedicated server action checks the signed-in user and Reporter role before invoking the gateway. It validates field types and lengths, sends exactly the six draft fields, and supplies an explicit missing-value label for blank fields. Unrelated records and secrets are never sent.
- Add `reporter_quality_check` as a separate gateway feature. Keep the existing per-feature user limits and shared app-wide limit; set `reportId: null` for an unsent draft. Prompt for short plain-text suggestions grouped under field names, omitting fields that need no improvement and never inventing facts.
- Render the result as text labeled AI suggestion. Preserve the form values and any earlier successful suggestion on failure. Track changes to all six fields, including the Python editor, and show a stale indicator until a new check succeeds.
- The existing Submit report action remains independent. The quality check cannot call the report creation action or write `bug_reports`.

## Post-Design Constitution Check

The Phase 1 design still passes all five principles. It keeps the AI boundary server-side, adds no schema change, and preserves the Reporter submission path. The new shared gateway feature identifier was approved by the team as reported by the user on 2026-11-09. Implementation must receive an independent security review before release because it adds a new AI entry point.
