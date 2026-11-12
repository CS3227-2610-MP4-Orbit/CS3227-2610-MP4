# Developer guide

## Current state

Next.js 16 (App Router, Cache Components) with Supabase (Postgres, Auth, row-level security), deployed to Vercel by GitHub Actions. Each feature's Spec Kit specification, plan and tasks are in `specs/` (`001` to `006`), checked against the constitution in `.specify/memory/constitution.md`. The original shared lifecycle specification is in `workflow/specs/001-bug-lifecycle/`.

| Area | State |
|---|---|
| Lifecycle schema, RLS and lifecycle functions (`supabase/migrations/`) | Implemented and tested (`supabase/tests/`) |
| Reporter: create, edit, list, fix comparison, feedback (`src/app/reports/`) | Implemented |
| QA tester: queue, review, tests, decisions, history (`src/app/qa/`) | Implemented |
| Developer workspace (`src/app/developer/`) | Implemented |
| Automatic assignment, role home and navigation, demo accounts | Implemented |
| AI gateway (`src/lib/ai/`) and role-specific AI features | Implemented, two features per role: Reporter AI bug explainer and AI report draft checker; Developer debugging advisor and code improvement advisor; QA test suggestions and feedback draft. All six run through the one gateway and were exercised on the deployed dev app (`workflow/evidence/E2E-dev-2026-11-12.md`). |

## Design

Three authenticated roles share reports, revision history, test cases, decisions and audit events. Every protected read runs as the signed-in user, so row-level security decides what each role may see. Status changes only through the security-definer functions `start_work`, `submit_fix` and `decide_fix`. Each one checks the caller's current role, assignment and the report status, and records a status event in the same transaction. User code and AI output are rendered as text and never executed.

### Assignment and roles

Migration `20261107010000_assign_reports.sql` adds an after-insert trigger to `bug_reports`. When a report has no assignees, which is true of every Reporter submission, it is given to the Developer and the QA tester with the fewest unclosed reports, oldest account first. It is never given to the person who filed it. An advisory lock spreads reports submitted at the same moment. The trigger runs after the insert because row-level security checks an insert's `WITH CHECK` after `BEFORE` triggers, and a Reporter's insert must carry no assignees. Reports the team assigns explicitly with the secret key are left as set. A second trigger, `limit_report_submissions`, refuses a Reporter's 21st report within an hour (error `54000`), so one account cannot flood the queue or the assignment lock. Secret-key inserts are not limited. The tests are in `supabase/tests/assign_reports.test.sql`.

`src/lib/roles.ts` is the single map from each role to its workspace and navigation links. `src/lib/session.ts` (`getSignedInRole`) reads the signed-in role. The sign-in action redirects to the role's workspace, the layout's `SignedInNav` shows that role's links, and `/` redirects to the same workspace.

Demo accounts: `DEMO_PASSWORD=... npm run seed:demo -- <local|dev|prod>` (`scripts/seed-demo-accounts.mjs`) creates or updates two accounts per role and sets their roles. It reads `.env.local` or the `DEV_`/`PROD_` keys in `.env.setup`, and prints only emails and roles.

For local AI-enabled development, `.env.local` must use the exact server-side variable names
`SOCLAAS_BASE_URL`, `SOCLAAS_API_KEY`, and `SOCLAAS_MODEL`, alongside the Supabase URL,
publishable key, and secret key. Restart the Next.js server after changing these values. The
Developer fix validator uses the Lezer Python grammar in JavaScript, so a system Python executable
is not required.

### Developer workspace

The Developer workspace is implemented under `src/app/developer/` and uses the assigned
Developer as the access boundary. `/developer` lists only reports assigned to the signed-in
Developer. `/developer/[reportId]` loads the original report, investigation notes, immutable
fix revisions, QA decisions and the current lifecycle status through the signed-in Supabase
session. Unassigned or unknown reports are returned as not found so the page does not disclose
whether another report exists.

The Developer workflow is:

1. Start an `open` report through the `start_work` security-definer function.
2. Add at least one investigation note while the report is `open` or `in_progress`; a note is
   required before the fix can be handed to QA. A note author may edit their own note before QA
   handoff; notes are read-only after `awaiting_qa` or `closed`.
3. Submit corrected Python through the `submit_fix` lifecycle function. The original code is
   never replaced; each submission creates the next immutable revision and moves the report to
   `awaiting_qa`.
4. Review the alignment-aware original-versus-revision comparison and revision history.
5. Wait for QA. The Developer workspace exposes the handoff state but does not expose QA
   approval or rejection controls.
6. If QA rejects a revision, read the feedback, create another revision, and repeat the cycle.

Developer input is bounded to 20,000 characters for Python code and 5,000 characters for notes
and submission notes. Corrected Python is syntax-checked as data with the Lezer Python grammar in JavaScript
(`src/lib/developer/python-validation.ts`), because the Vercel runtime has no Python binary; submitted code is never
executed or automatically applied. Authentication, role checks, assignment checks, lifecycle
transitions, immutable revisions and note-edit restrictions are enforced server-side and by
Supabase RLS rather than only by hidden UI controls.

The Developer has two separate AI features. The **AI debugging advisor** reads only the assigned
report's bounded code/context and recent investigation notes to suggest possible causes and fix
directions. The **AI code improvement advisor** reviews the same bounded assigned context for
readability, maintainability, performance, SRP and DRY opportunities. It returns categorized
structured suggestions with rationale, benefits and trade-offs. Both features are advisory-only:
they cannot execute code, create revisions, change notes, or change report status. Code
improvement output is normalized and rejected if it is not valid structured content, and any
illustrative code is rendered as inert suggested text.

The automated Developer review evidence is stored under `workflow/evidence/`. The authenticated
manual quickstart remains a separate verification step and must be recorded before claiming the
full end-to-end workflow has been manually validated.

### QA workspace

`src/lib/qa/queries.ts` loads the queue and the review page, and only returns reports where the caller is the assigned QA tester. `src/app/qa/[reportId]/actions.ts` records tests by inserting into `test_cases`. The insert policy only accepts the assigned QA tester and the latest revision awaiting QA. Decisions go through `decide_fix`. Migration `20261107000000_qa_feedback_to_reporter.sql` makes `decide_fix` also write non-empty feedback to `bug_feedback`, so the Reporter sees it. Any error is shown to the user as a plain message, never a database error.

### AI gateway

All SoC LLM calls go through `runAiFeature` in `src/lib/ai/gateway.ts`, which is server-only. `src/lib/ai/prompt.ts` holds the parts that can be tested on their own.

1. **Each feature belongs to one role.** `FEATURES` binds the Reporter's two tools, `reporter_code_explanation` (AI bug explainer) and `reporter_quality_check` (AI report draft checker), `developer_debugging` and `developer_code_improvement` to the Developer, and `qa_test_suggestions` and `qa_feedback_draft` to QA. The gateway refuses a feature requested for another role. Each caller checks the role before requesting AI. Report-detail callers load context through the user's session, so RLS limits the data to reports the user may see. The AI report draft checker accepts only the six current form fields and has no report ID or report read.
2. **Bounded input and output.** Each context field is at most 20,000 characters, the same limit the database puts on code, and the total is at most 45,000. Larger requests are refused rather than truncated. Each feature caps the tokens the model may return. An answer longer than 6,000 characters, or one the provider cut at the token cap, is marked as shortened.
3. **Prompt boundaries.** The system prompt holds the fixed rules and the task. It is the same for every request, so the provider can reuse its prompt cache. Report data goes in the user message between a boundary marker that is random for each request. Copies of the marker are removed from the data, so text in a report cannot close the block and add instructions.
4. **Limits.** Each call first inserts a `pending` row in `ai_usage`. It then counts recent rows: 3 a minute and 20 a day per user and feature, and 20 a minute across the app to stay under the provider's rate. Because the row is inserted before counting, simultaneous requests count against each other. Requests the app refuses (`rate_limited`, `daily_limit`, `busy`) do not use up quota. A provider 429 is recorded as `provider_busy` and does count, because it reached the provider. A row still `pending` after 2 minutes was abandoned and stops counting, so a crash cannot lock a user out.
5. **Failures.** There is a 20-second timeout, which also covers reading the response. A server or network error is retried once. A 429 from the provider is not retried. `runAiFeature` never throws: a database or usage-store failure returns `unavailable`. If recording the result fails, the answer is still returned. Each failure maps to a fixed message that never contains provider, key or URL details.
6. **Usage records.** `ai_usage` stores the feature, model, outcome, input, output and cached tokens (null when the provider does not report them), latency and retries. Prompts and answers are never stored. The table has RLS and no policies, so only the server's secret-key client (`src/lib/supabase/admin.ts`) can access it.

**QA feedback draft.** `draftFeedback` in `src/app/qa/[reportId]/actions.ts` builds its context with `feedbackDraftContext` (`src/lib/qa/feedback-draft.ts`). The context is the expected behavior, the Developer's note and the latest version's recorded tests, with a pass/fail count computed by the app rather than the model. The title, the reported failure and the code are left out, so less Reporter-written text can steer a note that QA forwards to two other people. With no recorded tests it returns null and no request is made. `fitFeedback` replaces links with "[link removed]" and caps the draft at the 2,000-character feedback limit. In the UI, the draft stays a labelled suggestion until **Use this draft**, which fills an empty box or appends below the tester's text. Each draft carries `basedOn`, the ids of the tests it used (`testsKey`), and the panel shows it only while those match the tests on the page (`draftView`); otherwise it is hidden as stale. The panel is deliberately not remounted when the tests change: server actions run one at a time, so a draft requested while **Save test** is still saving runs after the save, and a remount would discard that answer after its quota was spent.

To add a role's feature, write a server action that checks the role, loads the context through the user's session, and calls `runAiFeature({ feature, userId, role, reportId, context })`. Then show `text` labelled as an AI suggestion. `src/app/qa/[reportId]/actions.ts` (`suggestTests`) is the reference. The tests are in `src/lib/ai/gateway.test.ts`.

The Reporter has two separate AI tools. The **AI bug explainer** is `explainReport` in `src/app/reports/[id]/ai-actions.ts`. It checks the signed-in Reporter, loads that Reporter's saved report through the session, and calls the gateway with `reporter_code_explanation`. The panel on the report page shows the answer as an unverified suggestion. It does not edit the report or run the code. The **AI report draft checker** is `checkReportQuality` in `src/app/reports/new/check-quality.ts`, an optional action separate from `createReport`. It checks the signed-in Reporter, validates the six current draft fields, and calls the gateway with `reporter_quality_check` and `reportId: null`. A blank draft is refused before the gateway. No draft or response is written to `bug_reports` or usage logs. The browser keeps the draft and marks a prior suggestion stale after any field changes, including the Python editor. The normal submission action remains the only way this page creates a report.

### Context engineering and resource use in the app

The AI features are designed to send the model as little as each task needs and to stay within the SoC LLM's limits:

- **Each feature gets only the fields it needs.** For example, the QA feedback draft leaves out the title, the reported failure and the code (see above), and the report draft checker receives only the six form fields. Counts the app can compute itself, such as tests passed and failed, are computed in code and given to the model as facts.
- **The system prompt is fixed for each feature**, and everything that varies goes in the user message. This keeps the prompt prefix identical between requests, so the provider can reuse its prompt cache.
- **Input and output are capped.** Inputs are limited to 20,000 characters per field and 45,000 in total, and output to 400–800 tokens depending on the feature (`FEATURES` in `src/lib/ai/prompt.ts`). The temperature is 0.2.
- **Quotas match the provider's rate limits:** 3 calls a minute and 20 a day per user and feature, and 20 a minute across the app. A provider 429 is not retried.
- **Every call is measured.** `ai_usage` records input, output and cached tokens, latency, retries and the outcome for each call, without the prompt or the answer. `docs/Reflections.md` analyses these records. Calls average 317–392 input tokens across the six features.

## Security

- **Roles are enforced in the database.** Every table has row-level security (`supabase/tests/rls_enabled.test.sql` fails if a table does not). Status changes only go through the security-definer functions, which check the caller's role, assignment and the report status.
- **User code is never executed.** Python is stored as text and rendered as text. A fix is syntax-checked with the Lezer Python grammar in JavaScript, not by running Python.
- **AI boundaries.** The gateway checks the role for every feature. Report data is wrapped in a random boundary marker for each request. Inputs are bounded, outputs are labelled as unverified, and failure messages never reveal provider, key or URL details (see [AI gateway](#ai-gateway)). The Developer code improvement advisor also removes values that look like credentials before sending code to the provider (`src/lib/ai/code-improvement.ts`).
- **Secrets stay on the server.** The SoC LLM key and the Supabase secret key are server-only environment variables. `ai_usage` is readable only with the secret key. `.env*` files are git-ignored except `.env.example`.
- **HTTP headers.** `next.config.ts` sends `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` and `Referrer-Policy: strict-origin-when-cross-origin` on every page.
- **Abuse limits.** A Reporter can submit at most 20 reports an hour. The AI quotas above apply to every feature.

**Security in the development process.**
- Any task marked `security_sensitive` is routed by `workflow/scripts/agent_workflow.py plan` to the security reviewer (`workflow/agents/prompts/security_reviewer.md`). The reviewer runs on the strong model tier, in parallel with the code reviewer and before the verifier. `AGENTS.md` requires this review for any change to auth, database access or AI boundaries.
- Security review results are kept in `workflow/evidence/`, for example `006-code-improvement-security-review.json`, `developer-ai-security-review.json` and `005-check-report-quality-security.md`.
- The CI and deploy workflows pin their actions to commit SHAs and have read-only access to the repository. The Pages workflow also gets the permission to publish the site. CI uses placeholder credentials and never holds real ones.
- Production secrets exist only in the `production` GitHub environment, and every production deployment needs a team member to approve it.
- The usage collectors write only counts, model IDs and session IDs, never prompts, code or tool output.

## Testing

| Layer | Where | What it covers |
| --- | --- | --- |
| Unit and component tests (Vitest) | `src/**/*.test.ts(x)`: 29 files, 156 tests | Validation, the AI gateway (role binding, limits, retries, failure mapping), prompt boundaries, server actions with mocked Supabase, UI states. The `*.security.test.ts` files cover prompt injection, cross-role and unassigned access, and credential redaction. |
| Database tests (pgTAP) | `supabase/tests/`: 7 files, 143 assertions | RLS for each role, the lifecycle functions and their status rules, automatic assignment and the submission limit, QA feedback reaching the Reporter, and RLS being enabled on every table. |
| Workflow tests | `workflow/scripts/check_workflow.py`, `test_agent_workflow.py`, `test_token_usage.py`, `test_claude_usage.py` | Workflow structure and evidence, routing and context packing, and the usage collectors. |
| End-to-end test on a deployed environment | `workflow/scripts/e2e_lifecycle.mjs` | The whole lifecycle through the UI with the demo accounts, including every AI feature. Its latest run passed 35 of 35 checks on dev (`workflow/evidence/E2E-dev-2026-11-12.md`). |

CI (`.github/workflows/ci.yml`) runs on every pull request. It runs lint, the type check, the Vitest tests, the workflow tests and a production build. A separate job applies every migration to a temporary database, runs the pgTAP tests and fails on any Supabase lint warning.

## Deployment and environments

| | Development | Production |
| --- | --- | --- |
| Branch | `develop` | `master` |
| App | https://bugflow-orbit-dev.vercel.app | https://bugflow-orbit.vercel.app |
| Supabase project | its own dev project | its own prod project |
| GitHub environment | `development` (deploys only from `develop`) | `production` (deploys only from `master`, needs a reviewer's approval) |

Both environments have secrets with the same names, stored separately in their GitHub environments, so `deploy.yml` never chooses credentials itself. A push to `develop` or `master` runs `deploy.yml`:

1. It runs CI.
2. It applies the migrations to that environment's Supabase project (`supabase db push`).
3. It builds the app on GitHub Actions with the pinned Vercel CLI.
4. It deploys the prebuilt output. For `develop`, the result is aliased to the dev address (`VERCEL_DEV_ALIAS`).
5. It checks that `/login` loads and that `/` redirects to it. This also shows the Supabase settings reached the app.

Vercel's own Git deployments are turned off (`vercel.json`), so every deployment goes through this workflow. Work reaches `develop` through pull requests, and a release is a pull request from `develop` to `master`. `scripts/setup-environments.mjs` sets up both environments from `.env.setup`: the Vercel environment variables, the Supabase auth URLs, and the GitHub environments, secrets and reviewers. `npm run seed:demo` creates the demo accounts.

## Development process

Role-specific Developer process assets are tracked under `workflow/developer/`: `context/` contains bounded role context, `skills/` contains reusable implementation and review instructions, `sdd/` contains the feature SDD template, `workflows/` contains the Developer workflow, and `reflection/` contains tracked process notes. The ignored `docs/developer-agentic-se/` directory is separate personal presentation tracking and is intentionally excluded from commits.

Start at `workflow/README.md`. `.agents/skills/agent-coordination` and `agent-handoff` provide reusable Codex instructions. `workflow/config.json` defines role budgets; `workflow/agents/prompts/` defines specialist boundaries; `workflow/scripts/agent_workflow.py` plans routes, packs bounded context, records real usage and exports a CSV table. `workflow/templates/` holds task, handoff, memory and log formats; `workflow/scripts/check_workflow.py` validates structure and evidence; `workflow/experiments.md` defines comparisons. `workflow/scripts/token_usage.py` (Codex) and `claude_usage.py` (Claude Code) capture counts-only token usage for a task into `workflow/evidence/usage/`, and `workflow/scripts/plot_usage.py` draws the charts in `docs/Reflections.md` from those files (needs matplotlib). `workflow/scripts/e2e_lifecycle.mjs` drives the whole bug lifecycle, including each role's AI features, through the UI of a deployed environment; its latest results are in `workflow/evidence/E2E-dev-2026-11-12.md`. `.github/workflows/` holds CI (`ci.yml`), the Supabase and Vercel deployment (`deploy.yml`, with separate development and production environments) and the product website (`pages.yml`, which publishes `website/` to GitHub Pages).

## Acknowledgements

The project requirements and three-role feature plan came from the team's supplied assignment text. The agent roles and resource-aware ideas were adapted from the supplied workflow PDF. The repository began from a Next.js/Supabase/Vercel scaffold for a hackathon app, committed by Johannsen on 31 Oct 2026 (`81dd011`, "Scaffold HackHub: Next.js, Supabase schema, CI and dev/prod deploys"). Its hackathon tables are dropped by `20261104000000_bug_lifecycle.sql` and its pages were rewritten for BugFlow. What is still used unchanged is infrastructure: the Supabase client helpers and session proxy (`src/lib/supabase/`, `src/proxy.ts`), `supabase/config.toml`, and the TypeScript, ESLint, Next.js and Vercel configuration. Every feature was specified, planned and broken into tasks with [GitHub Spec Kit](https://github.com/github/spec-kit) 1.3.0; installation is recorded in `workflow/SpecKit.md`.

The interface is built with [shadcn/ui](https://ui.shadcn.com) (MIT): its components are copied into `src/components/ui/` and run on [Radix UI](https://www.radix-ui.com) primitives (MIT). Icons are [Lucide](https://lucide.dev) (ISC). Text uses the [Geist and Geist Mono](https://vercel.com/font) typefaces (SIL Open Font License), loaded through `next/font`. The layout drew on public examples rather than copied code: Linear's issue lists, Sentry's issue-details page, GitHub's split diff, the shadcn sidebar and dashboard blocks, and the Testify bug-tracking dashboard concept on Dribbble.
