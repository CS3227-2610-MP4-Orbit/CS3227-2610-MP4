# Developer Workflow Validation Guide

This guide validates the Developer feature after implementation. It does not execute submitted
Python code.

## Prerequisites

- Node 24 and npm installed
- Local Supabase CLI available
- Local project environment configured from `.env.example`
- For AI checks, `SOCLAAS_BASE_URL`, `SOCLAAS_API_KEY`, and `SOCLAAS_MODEL` must be set in
  `.env.local`; restart the Next.js server after changing them.
- A database reset with the bug-lifecycle migration and test fixtures
- An authenticated Developer, an unassigned Developer, a Reporter, and a QA tester

The Developer syntax check uses the Lezer Python grammar in JavaScript. A system Python
executable is not required for submitting a fix.

## Automated checks

Run from the repository root:

```text
npm ci
npm run lint
npm run typecheck
npm test
npm run test:db
npm run build
```

Expected result: all commands pass, or any environment limitation is recorded as unknown rather
than reported as a successful check.

## Manual acceptance flow

1. Sign in as the assigned Developer.
2. Confirm the dashboard lists only the assigned report.
3. Open the report and confirm the original Python code and report details are visible.
4. Start work and confirm status changes to `in_progress`.
5. Add an investigation note and confirm authorship and timestamp are shown.
6. Edit the note as its author while the report is `in_progress`, then confirm the body and
   `updated_at` change while the author and `created_at` remain unchanged.
7. Confirm note edits are rejected after the report enters `awaiting_qa`.
8. After at least one investigation note exists, submit corrected code and confirm a new revision
   is created and the report changes to `awaiting_qa`.
9. Confirm the original code is unchanged and the comparison distinguishes changed lines.
10. Confirm the Developer cannot approve or reject the handoff.
11. As QA, reject the latest revision with feedback using the QA feature or approved database
   fixture.
12. As the assigned Developer, confirm the feedback is visible, submit a new revision, and confirm
    the report returns to `in_progress` before the next handoff.
13. Repeat the flow with an unassigned Developer and confirm no protected report data is disclosed.
14. Attempt direct status, revision, timestamp, original-code, and unauthorized-note manipulation
    and confirm it is
    rejected by server/database controls.

## Evidence to record

- Acceptance criterion to test mapping
- Test command output
- Security reviewer handoff
- Verifier handoff
- Files changed and owned by the generator
- Any unavailable token, latency, cache, or tool metrics recorded as unavailable
