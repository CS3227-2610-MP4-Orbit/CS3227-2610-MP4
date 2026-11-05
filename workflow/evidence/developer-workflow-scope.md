# Developer workflow implementation scope

This implementation slice covers T001-T014: the approved Developer workflow context,
schema review, validation and authenticated assignment boundary, editable-note database
guardrails, and the first assigned-report dashboard.

## Ownership

- Orchestrator: Jordan / current Codex session; integrates evidence and resolves findings.
- Generator: application files under `src/lib/developer/` and `src/app/developer/`.
- Security reviewer concern: Supabase RLS, role checks, assignment filtering, and immutable
  lifecycle boundaries.
- Verifier: lint, typecheck, unit tests, and database migration/test review.

## Explicitly deferred

Report detail actions, investigation-note forms, immutable fix submission, code diffing, QA
handoff UI, rejection/revision UI, AI debugging, and final independent reviews remain T015+.

