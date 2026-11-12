# Validation quickstart: Reporter Feedback View

Prerequisites: local Supabase and Next.js dev server running with the current migrations applied. Do not reset a database containing user data just to run this check.

1. Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run test:db`. Expect all to pass.
2. Use a disposable local Reporter and report. Insert one Developer and one QA feedback fixture through a trusted local database test context, then open the report detail as its Reporter. Expect two entries in newest-first order with role and timestamp. Do not claim a product writing flow exists.
3. Open a report without fixtures. Expect “No feedback yet.” Force a feedback read failure in an isolated test and expect a distinct safe error.
4. Sign in as another Reporter and try the first report URL and direct feedback query. Expect no feedback content. Check markup-like text is displayed as text.
5. Remove disposable fixtures/accounts. Record actual results in the workflow handoff; never log private report bodies or credentials.
