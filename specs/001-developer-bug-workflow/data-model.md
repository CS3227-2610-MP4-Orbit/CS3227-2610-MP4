# Data Model: Developer Bug Workflow

The Developer feature consumes the shared bug-lifecycle schema created by
`supabase/migrations/20261104000000_bug_lifecycle.sql`. No new tables are required by this plan.

## Entities

### `profiles`

- `id`: authenticated user identity
- `role`: `reporter`, `developer`, or `qa`
- `full_name`: display name

The role is provisioned by the team/service process and cannot be changed by the user.

### `bug_reports`

- `id`: report identity
- `reporter_id`: original reporter
- `developer_id`: current assigned Developer, nullable before assignment
- `qa_id`: assigned QA tester, nullable before assignment
- `title`, `code`, `error_message`, `expected_behavior`, `actual_behavior`, `reproduction_steps`
- `status`: `open`, `in_progress`, `awaiting_qa`, or `closed`
- `created_at`, `updated_at`

Developer reads are limited to reports where `developer_id` is the authenticated user. The
Developer must not update the original report code or its assignment through the client workflow.

### `investigation_notes`

- `id`: note identity
- `report_id`: owning report
- `author_id`: Developer who wrote the note
- `body`: investigation content
- `created_at`: database-generated timestamp
- `updated_at`: database-generated timestamp updated when the author edits the note

Notes can be appended by the assigned Developer and edited only by their author while the report is
`open` or `in_progress`. Notes become read-only once the report is `awaiting_qa` or `closed`.
The MVP stores the latest note body and update timestamp; a separate note-edit history is out of
scope. Participants may read notes according to the existing RLS policy.

### `fix_revisions`

- `id`: revision identity
- `report_id`: owning report
- `revision_number`: monotonically assigned per report
- `author_id`: Developer who submitted the revision
- `code`: corrected Python text
- `note`: submission note
- `created_at`: database-generated timestamp

Revisions are immutable and are created through `submit_fix`, which serializes concurrent
submissions for a report and changes `in_progress` to `awaiting_qa`.

### `qa_decisions`

The Developer feature reads rejection feedback written by the separate QA feature. It does not
create or edit QA decisions.

- `revision_id`: decided revision
- `qa_id`: QA actor
- `verdict`: approval or rejection
- `feedback`: required for rejection
- `created_at`: decision timestamp

### `status_events`

Append-only lifecycle history used to show traceability. Developer-facing transitions are:

```text
open → in_progress → awaiting_qa
awaiting_qa → in_progress  # QA rejection
```

The QA feature owns approval to `closed`.

## Existing invariants to preserve

- Assignment IDs must point to profiles with the matching role.
- Developers may start work only on their assigned `open` report.
- Developers may submit only while assigned and `in_progress`.
- Direct inserts into `fix_revisions` and direct status updates are denied to authenticated users.
- Original report code is not editable by Developers.
- All timestamps are database-generated to prevent backdating.
- RLS protects participant reads, Developer note inserts, and author-only note updates before QA
  handoff.
