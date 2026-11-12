# Data model: Reporter Feedback View

## Existing Bug Report

`public.bug_reports.id` identifies the report. `reporter_id` and the signed-in Reporter role govern visibility. Feedback remains readable when the report status changes.

## Feedback Entry

| Field | Rule |
| --- | --- |
| `id` | Generated UUID primary key; tie-breaker for stable ordering |
| `report_id` | Required foreign key to an existing bug report; delete with report |
| `author_id` | Required foreign key to a profile; attribution |
| `author_role` | Historical source role: `developer` or `qa` |
| `body` | Required nonblank text, at most 2,000 characters |
| `created_at` | Server timestamp, immutable to Reporter |

Entries are ordered by `created_at DESC, id DESC`. Browser roles can only read entries for reports owned by the signed-in Reporter; they cannot insert, update, or delete them. Trusted fixtures stand in for future Developer/QA writers. The future writing contract must verify author identity and role on each mutation and decide how entries correspond to investigation and QA-decision history.
