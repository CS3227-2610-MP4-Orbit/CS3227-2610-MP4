# Developer investigation feature scope

## User outcome

An assigned Developer can open a bug, start work, record investigation notes, and correct
their own notes before the fix is sent to QA.

## Implementation boundary

This slice includes the report detail read model, start-work action, add/edit note actions,
forms, loading/error states, and database-backed authorization. Fix revisions, code diffs,
QA handoff summaries, and rejection feedback remain later feature slices.

## Techniques and roles

- Spec Kit SDD: implemented against the US2 contract and T015-T021 task group.
- Context engineering: limited implementation context to the Developer contract, data model,
  lifecycle migration, editable-note migration, and existing server client.
- Generator: owns the detail page, forms, actions, and read model files.
- Security review focus: server-side session identity, assignment filtering, RLS, status gates,
  author-only updates, and bounded text input.
- Verifier: lint, typecheck, unit tests, and database/RLS test review.

