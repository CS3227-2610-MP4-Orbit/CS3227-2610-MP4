# Developer schema review

Reviewed `supabase/migrations/20261104000000_bug_lifecycle.sql` and
`supabase/tests/bug_lifecycle.test.sql` against the Developer data model.

## Existing coverage

- `bug_reports.developer_id` is validated as a Developer account and indexed by status.
- RLS exposes reports only to participants; the assigned Developer can read the report.
- `start_work` and `submit_fix` are lifecycle functions, so the client cannot directly
  change status or insert a revision.
- Original report code is protected from Developer updates.
- Existing pgTAP coverage exercises assigned/unassigned Developer visibility, notes,
  revision insertion denial, status transitions, and QA rejection/approval.

## Gap addressed in this slice

`investigation_notes` had `created_at` but no `updated_at` and no author-only update
policy. The follow-up migration adds both and permits updates only while the report is
`open` or `in_progress`; notes become read-only once QA handoff starts.

