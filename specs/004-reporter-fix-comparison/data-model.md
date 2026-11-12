# Data model

No migration. Read-only relation: `public.fix_revisions` has `id` UUID, `report_id` UUID FK, `revision_number` integer unique per report, `author_id` UUID FK, `code` text (maximum 20,000), `note` text, and `created_at` timestamp. The Reporter page filters `report_id` to an already owner-authorized report and orders by `revision_number` descending. `profiles.full_name` may label the author; `author_id` remains the stable attribution key.

Sample preview is a fixed UI fixture with no stored ID, report ID, author ID, or status transition. It cannot enter `fix_revisions` or a feedback/history table.
