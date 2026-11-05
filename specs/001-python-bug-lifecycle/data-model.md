# Data model

## Profile

`id` links to authenticated user; `full_name` is display text; `role` is exactly one of `reporter`, `developer`, `qa`. Role is immutable to ordinary users. An approved administrative process provisions role changes.

## Bug Report

`id`, `reporter_id`, `developer_id`, `qa_id`, `title` (1–120 chars), `code` (1–20,000 chars), `error_message` (0–5,000 chars), `expected_behavior` (1–5,000 chars), `actual_behavior` (1–5,000 chars), `reproduction_steps` (1–5,000 chars), `status`, timestamps. `developer_id` and `qa_id` are nullable until controlled assignment. Only the reporter can edit an open report. Status: `open -> in_progress -> awaiting_qa -> closed` or `awaiting_qa -> in_progress` on rejection.

## Investigation and Fix Revision

Investigation notes have report, author and timestamp, with 1–5,000 chars. Fix revisions have report, author, monotonically increasing revision number, corrected code (1–20,000 chars), submission note (0–5,000 chars), and immutable timestamp. A revision submits the report to QA.

## Test Case, QA Decision, Status Event

Test cases bind to a revision and QA author, with description, expected and actual result (each 1–5,000 chars), and pass/fail outcome. A QA decision binds to a revision with approve/reject, feedback, actor and timestamp. Only the latest awaiting revision may be decided. Events record each status transition, actor and timestamp; history is append-only.

## AI Usage

Per request: user, report, feature, model, outcome, timestamp, available input/output/cached token counts, latency and retry count. No prompt, snippet, response, API key or private error detail is stored. Server-only access.

## Relationships and authorization

Reporter owns report. Only assigned Developer and QA can read and act on a report, each within their role's allowed operations. All three participants can read relevant revision, test and decision history. RLS and server actions enforce the same relationship. Assignment changes take effect on the next request.
