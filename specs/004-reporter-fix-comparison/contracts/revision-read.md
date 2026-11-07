# Developer-to-Reporter revision read contract

The Developer workflow will insert immutable rows into existing `public.fix_revisions`. Reporter reads these columns after verifying `bug_reports.reporter_id = auth.uid()` and the Reporter profile role:

| Field | Meaning |
| --- | --- |
| `id` | Stable revision ID |
| `report_id` | Parent bug report ID; the query filters this to the authorized report |
| `revision_number` | Monotonic version for one report; highest is selected initially |
| `code` | Proposed Python source, displayed only as text |
| `author_id` | Developer account that submitted it |
| `created_at` | Immutable submission time |
| `note` | Optional Developer explanation, displayed as text |

Optional `profiles.full_name` is display-only; `author_id` remains authoritative. RLS must permit only current report participants with their correct role. Reporter comparison is read-only; no submission or QA action is introduced. The Developer teammate should use the existing `submit_fix` contract or an agreed replacement, not the sample preview fixture.
