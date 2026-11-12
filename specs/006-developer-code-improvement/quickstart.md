# AI Code Improvement Validation Guide

This guide validates the second Developer AI feature. It does not execute submitted or
AI-generated Python.

## Prerequisites

- Node 24 and npm installed.
- Local environment configured from `.env.example`.
- A signed-in Developer assigned to a report containing Python code.
- An unassigned Developer and a non-Developer account for denial tests.
- AI provider configuration available, or deterministic gateway mocks for automated tests.

## Automated checks

Run from the repository root:

```text
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

Run the database suite when migration or RLS behavior changes:

```text
npm run test:db
```

Expected result: all commands pass, or an environment limitation is recorded as unavailable.

## Acceptance scenarios

1. As the assigned Developer, request improvement guidance and confirm the result is labelled
   advisory and contains categorized rationale.
2. Confirm the report code, notes, revisions, assignment and status are unchanged.
3. Repeat as an unassigned Developer and confirm no report context is sent and a safe message is
   returned.
4. Repeat as a Reporter or QA account and confirm the feature is unavailable.
5. Use prompt-injection text and boundary-marker text in report fields; confirm it remains data.
6. Use oversized code/context; confirm the provider is not called and quota is not consumed.
7. Simulate timeout, malformed response, provider failure, quota exhaustion, and empty output;
   confirm safe messages and no workflow mutation.
8. Confirm illustrative code is displayed as text and is never executed or automatically applied.

## Evidence to record

- Spec-to-test acceptance mapping
- AI prompt/context and output-boundary tests
- Authorization and assignment test output
- Resource-limit and safe-error test output
- Security reviewer handoff
- Verifier handoff
- Actual provider usage metrics, or unavailable where not exposed
