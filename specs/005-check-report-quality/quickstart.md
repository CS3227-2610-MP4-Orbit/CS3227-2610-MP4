# Quickstart: Validate Check Report Quality

## Prerequisites

- Local Supabase and the current migrations are running.
- The documented Reporter demo account can sign in.
- The local SoC AI configuration is present for a live AI response. Automated failure tests can run without it.

## Existing submission baseline

Before this feature, `/reports/new` uses `src/app/reports/new/actions.ts`: Submit report validates all required fields, inserts one `bug_reports` row as the signed-in Reporter, and redirects to `/reports?submitted=1`. The quality check must stay a separate action. In the browser walkthrough, compare the Reporter's My Reports count before and after Check my report; only a later Submit report should increase it. This describes the existing code path, not a live test result.

## Automated checks after implementation

From the repository root, run:

```bash
npm run typecheck
npm run lint
npm test
npm run test:db
npm run build
```

Check the focused action, form, prompt, and gateway tests for the cases in [the interaction contract](contracts/draft-quality-check.md). These commands are validation steps, not evidence that they have passed yet.

## Browser acceptance walkthrough

1. Sign in as a Reporter and open `/reports/new`.
2. Enter Python code and vague reproduction steps while leaving another field blank. Choose **Check my report**. Confirm that a labeled suggestion appears, the current inputs stay intact, and no new report appears in My Reports.
3. Change a field, including Python code. Confirm the previous suggestion is marked as based on an earlier draft. Check again and confirm the new result is current.
4. Repeat with all fields blank. Confirm a prompt to enter details appears without an AI request.
5. Test an unavailable or rate-limited AI response. Confirm the draft and any prior suggestion remain, and the normal Submit report action is still available.
6. Fill every required field and choose **Submit report**. Confirm that only this action creates a report.
7. Verify that a Developer, QA tester, or signed-out visitor cannot call the quality check successfully, including by submitting a forged request.

Record actual outcomes and any provider or local-environment limitation; do not count unrun checks as passes.
