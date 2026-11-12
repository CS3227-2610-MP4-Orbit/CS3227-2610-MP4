# Reporter feedback read contract

On an authorized Reporter report detail, read feedback entries for that report only. Return `id`, `author_role`, `body`, and `created_at`; sort by `created_at` and `id` descending. Do not expose `author_id` or other reports to the UI. Render body as text.

| State | Visible result |
| --- | --- |
| One or more entries | Timeline with source role, creation time, and text |
| Zero entries | “No feedback yet” message |
| Read failure | Safe “Could not load feedback” message, distinct from empty |
| Foreign/missing report | No report or feedback content |

No Reporter, Developer, or QA write endpoint is part of this slice. Before role-specific writers use this table, the team must agree how a Developer note or QA decision produces an entry and ensure the actor is derived from the authenticated session.
