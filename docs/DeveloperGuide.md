# Developer guide

## Current state

Next.js 16 (App Router, Cache Components) with Supabase (Postgres, Auth, row-level security), deployed to Vercel by GitHub Actions. Requirements and tasks are in `specs/001-python-bug-lifecycle/`.

| Area | State |
|---|---|
| Lifecycle schema, RLS and lifecycle functions (`supabase/migrations/`) | Implemented and tested (`supabase/tests/`) |
| Reporter: create, edit, list, fix comparison, feedback (`src/app/reports/`) | Implemented |
| QA tester: queue, review, tests, decisions, history (`src/app/qa/`) | Implemented |
| Developer workspace (`src/app/developer/`) | Implemented |
| Automatic assignment, role home and navigation, demo accounts | Implemented |
| AI gateway (`src/lib/ai/`) and role-specific AI features | Implemented. The Reporter has a report-detail code explanation and a separate pre-submission quality check; QA has test suggestions. Check the Developer workspace separately for its current AI UI. |

## Design

Three authenticated roles share reports, revision history, test cases, decisions and audit events. Every protected read runs as the signed-in user, so row-level security decides what each role may see. Status changes only through the security-definer functions `start_work`, `submit_fix` and `decide_fix`. Each one checks the caller's current role, assignment and the report status, and records a status event in the same transaction. User code and AI output are rendered as text and never executed.

### Assignment and roles

Migration `20261107010000_assign_reports.sql` adds an after-insert trigger to `bug_reports`. When a report has no assignees, which is true of every Reporter submission, it is given to the Developer and the QA tester with the fewest unclosed reports, oldest account first. It is never given to the person who filed it. An advisory lock spreads reports submitted at the same moment. The trigger runs after the insert because row-level security checks an insert's `WITH CHECK` after `BEFORE` triggers, and a Reporter's insert must carry no assignees. Reports the team assigns explicitly with the secret key are left as set. A second trigger, `limit_report_submissions`, refuses a Reporter's 21st report within an hour (error `54000`), so one account cannot flood the queue or the assignment lock. Secret-key inserts are not limited. The tests are in `supabase/tests/assign_reports.test.sql`.

`src/lib/roles.ts` is the single map from each role to its workspace and navigation links. `src/lib/session.ts` (`getSignedInRole`) reads the signed-in role. The sign-in action redirects to the role's workspace, the layout's `SignedInNav` shows that role's links, and `/` redirects to the same workspace.

Demo accounts: `DEMO_PASSWORD=... npm run seed:demo -- <local|dev|prod>` (`scripts/seed-demo-accounts.mjs`) creates or updates two accounts per role and sets their roles. It reads `.env.local` or the `DEV_`/`PROD_` keys in `.env.setup`, and prints only emails and roles.

### QA workspace

`src/lib/qa/queries.ts` loads the queue and the review page, and only returns reports where the caller is the assigned QA tester. `src/app/qa/[reportId]/actions.ts` records tests by inserting into `test_cases`. The insert policy only accepts the assigned QA tester and the latest revision awaiting QA. Decisions go through `decide_fix`. Migration `20261107000000_qa_feedback_to_reporter.sql` makes `decide_fix` also write non-empty feedback to `bug_feedback`, so the Reporter sees it. Any error is shown to the user as a plain message, never a database error.

### AI gateway

All SoC LLM calls go through `runAiFeature` in `src/lib/ai/gateway.ts`, which is server-only. `src/lib/ai/prompt.ts` holds the parts that can be tested on their own.

1. **Each feature belongs to one role.** `FEATURES` binds `reporter_code_explanation` and `reporter_quality_check` to the Reporter, `developer_debugging` to the Developer, and `qa_test_suggestions` and `qa_feedback_draft` to QA. The gateway refuses a feature requested for another role. Each caller checks the role before requesting AI. Report-detail callers load context through the user's session, so RLS limits the data to reports the user may see. The draft-quality action accepts only the six current form fields and has no report ID or report read.
2. **Bounded input and output.** Each context field is at most 20,000 characters, the same limit the database puts on code, and the total is at most 45,000. Larger requests are refused rather than truncated. Each feature caps the tokens the model may return. An answer longer than 6,000 characters, or one the provider cut at the token cap, is marked as shortened.
3. **Prompt boundaries.** The system prompt holds the fixed rules and the task. It is the same for every request, so the provider can reuse its prompt cache. Report data goes in the user message between a boundary marker that is random for each request. Copies of the marker are removed from the data, so text in a report cannot close the block and add instructions.
4. **Limits.** Each call first inserts a `pending` row in `ai_usage`. It then counts recent rows: 3 a minute and 20 a day per user and feature, and 20 a minute across the app to stay under the provider's rate. Because the row is inserted before counting, simultaneous requests count against each other. Requests the app refuses (`rate_limited`, `daily_limit`, `busy`) do not use up quota. A provider 429 is recorded as `provider_busy` and does count, because it reached the provider. A row still `pending` after 2 minutes was abandoned and stops counting, so a crash cannot lock a user out.
5. **Failures.** There is a 20-second timeout, which also covers reading the response. A server or network error is retried once. A 429 from the provider is not retried. `runAiFeature` never throws: a database or usage-store failure returns `unavailable`. If recording the result fails, the answer is still returned. Each failure maps to a fixed message that never contains provider, key or URL details.
6. **Usage records.** `ai_usage` stores the feature, model, outcome, input, output and cached tokens (null when the provider does not report them), latency and retries. Prompts and answers are never stored. The table has RLS and no policies, so only the server's secret-key client (`src/lib/supabase/admin.ts`) can access it.

**QA feedback draft.** `draftFeedback` in `src/app/qa/[reportId]/actions.ts` builds its context with `feedbackDraftContext` (`src/lib/qa/feedback-draft.ts`). The context is the expected behavior, the Developer's note and the latest version's recorded tests, with a pass/fail count computed by the app rather than the model. The title, the reported failure and the code are left out, so less Reporter-written text can steer a note that QA forwards to two other people. With no recorded tests it returns null and no request is made. `fitFeedback` replaces links with "[link removed]" and caps the draft at the 2,000-character feedback limit. In the UI, the draft stays a labelled suggestion until **Use this draft**, which fills an empty box or appends below the tester's text. The draft component is keyed on the recorded test ids, so a draft based on older results is discarded when a test is added.

To add a role's feature, write a server action that checks the role, loads the context through the user's session, and calls `runAiFeature({ feature, userId, role, reportId, context })`. Then show `text` labelled as an AI suggestion. `src/app/qa/[reportId]/actions.ts` (`suggestTests`) is the reference. The tests are in `src/lib/ai/gateway.test.ts`.

The New Report quality check is an optional action separate from `createReport`. It checks the signed-in Reporter, validates the six current draft fields, and calls the gateway with `reportId: null`. A blank draft is refused before the gateway. No draft or response is written to `bug_reports` or usage logs. The browser keeps the draft and marks a prior suggestion stale after any field changes, including the Python editor. The normal submission action remains the only way this page creates a report.

## Development process

Start at `workflow/README.md`. `.agents/skills/agent-coordination` and `agent-handoff` provide reusable Codex instructions. `workflow/config.json` defines role budgets; `workflow/agents/prompts/` defines specialist boundaries; `workflow/scripts/agent_workflow.py` plans routes, packs bounded context, records real usage and exports a CSV table. `workflow/templates/` holds task, handoff, memory and log formats; `workflow/scripts/check_workflow.py` validates structure and evidence; `workflow/experiments.md` defines comparisons. The existing `.github/workflows/` contains CI and deployment automation for the legacy starter and must be reviewed when the domain migration is implemented. Development and production must use separate configuration and data.

## Acknowledgements

The project requirements and three-role feature plan came from the team's supplied assignment text. The agent roles and resource-aware ideas were adapted from the supplied workflow PDF. The repository already contained a Next.js/Supabase/Vercel starter; its origin and any reused code must be cited by the team before release. GitHub Spec Kit is an optional toolkit; installation instructions are in `workflow/SpecKit.md`.
