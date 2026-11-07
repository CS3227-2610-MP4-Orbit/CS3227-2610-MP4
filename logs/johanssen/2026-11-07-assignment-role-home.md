# Automatic assignment, role-aware home and demo accounts (#15-#17)

I asked Claude Code to create GitHub issues for the remaining work, open a PR linked to our part, and then build three of them. It added role and area labels and opened 14 issues:
- 7 open issues assigned to me
- 4 for teammates, labelled but not assigned, so nobody was notified without my say
- 3 closed issues for work already merged, each pointing to its PR

GitHub only auto-closes issues for PRs into the default branch (`master`). So the issues for this PR into `develop` are closed by hand on merge, and the release PR will carry `Closes`.

**Assignment rule.** A new report goes to the Developer and the QA tester with the fewest unclosed reports, oldest account first. The agent found that row-level security checks an insert's `WITH CHECK` after `BEFORE` triggers. So assignment runs in an `AFTER INSERT` security-definer trigger, and the rule that "a reporter's insert has no assignees" stays intact. An advisory lock spreads simultaneous submissions across people.

Two of Joseph's tests failed after the change:
- One showed a real flaw: a Reporter later made a Developer was assigned their own report. Nobody is now assigned a report they filed. This matches a bug I reported in the MP3 peer review.
- The other test's fixture left QA unassigned on purpose. The rule now only assigns reports that have no assignees at all, and one line in that fixture keeps its intent.

**Role-aware app.** `src/lib/roles.ts` maps each role to its workspace, links and home text. Sign-in lands on the workspace, the nav shows only that role's links, and the home page shows its actions. Joseph's nav behaviour and test are kept. `npm run seed:demo` creates two accounts per role on local, dev or prod, and prints only emails and roles.

**Reviews.** Two independent reviewers ran in parallel.
- **Code review** found 4 important issues and 2 minor ones:
  - a header flash on `/login`, and layout shift
  - Developers landing on `/developer`, which isn't merged yet
  - sign-up needing email confirmation gave no feedback
  - the guide overstated the assignment order
  - a test that passed when only one column was assigned
  - a cosmetic flash when signed out
- **Security review** found no exploit and two risks:
  - the public demo Developer and QA logins are the only staff accounts, so anything submitted is readable by anyone with the guide
  - there was no submission limit, so one account could flood the queue and the assignment lock

**Fixes.**
- A limit of 20 reports an hour per Reporter, with tests.
- A demo warning in the guide.
- The `/login` fix. The first attempt failed the build, because a Suspense fallback reading the URL sits outside its own boundary. The fix gave it an inner boundary.
- A sign-up notice.
- Corrected guide text.
- The test now checks each column separately.

Not fixed: the cosmetic signed-out flash, because the proxy already redirects signed-out users.

**Verified.**
- 124 pgTAP tests, 66 vitest tests, lint, typecheck and build.
- A browser run with the demo accounts:
  - the Reporter landed on `/reports`
  - a report submitted through the form was assigned to `developer1` and `qa1`
  - QA landed on `/qa` and saw it
  - `/login` showed no header

**Measured** (`workflow/evidence/usage/QA003-assignment-role-home.usage.json`), over 34 minutes. The window includes the issue and PR setup and a token-comparison question.

| Agent | Responses | Input tokens | Cached | Output tokens | Thinking |
|---|---|---|---|---|---|
| Main Opus session | 52 | 23.0M | 99.6% | 55.0K | 13.0K |
| Security reviewer | 17 | 1.96M | | 25.8K | 18.3K |
| Code reviewer | 8 | 0.22M | | 5.7K | |
| **Total** | **77** | **25.2M** | **99.0%** | **86.5K** | **38%** |

The security review again cost about 9× the code review. It ran live lock-contention checks. That produced one real fix, the submission limit, while the code review found most of the correctness issues.
