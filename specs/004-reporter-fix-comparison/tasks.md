# Tasks: Reporter Fix Comparison

**Input**: [spec.md](spec.md), [plan.md](plan.md), [revision contract](contracts/revision-read.md)

## Phase 1: Setup

- [x] T001 Verify the shared `fix_revisions` relation/RLS and Next.js 16 detail-page request boundary in `supabase/migrations/20261104000000_bug_lifecycle.sql`, `supabase/migrations/20261105000300_reporter_role_access.sql`, and `node_modules/next/dist/docs/`
- [x] T002 Add the maintained line-diff library to `package.json` and `package-lock.json`

## Phase 2: Foundation

- [x] T003 Add trusted pgTAP fixtures for owned/foreign reports, multiple revisions, and closed status in `supabase/tests/reporter_comparison.test.sql`

## Phase 3: User Story 1 — Compare revisions (P1)

**Independent test**: An owning Reporter sees latest proposal and selects an earlier version without changing original code.

- [x] T004 [P] [US1] Test changed-line output, identical code, and long-input fallback in `src/lib/reports/line-diff.test.ts`
- [x] T005 [US1] Implement bounded line-diff model in `src/lib/reports/line-diff.ts`
- [x] T006 [P] [US1] Test comparison rendering, revision metadata, selection and inert text in `src/app/reports/[id]/comparison.test.tsx`
- [x] T007 [US1] Build side-by-side accessible comparison with version selector in `src/app/reports/[id]/comparison.tsx`
- [x] T008 [US1] Query report-scoped revisions after owner check and render comparison in `src/app/reports/[id]/page.tsx`

## Phase 4: User Story 2 — Empty and sample states (P1)

**Independent test**: Empty and load-error states differ; sample is labeled and development-only.

- [x] T009 [US2] Add development-only fixed sample preview and explicit empty/error states in `src/app/reports/[id]/comparison.tsx` and `src/app/reports/[id]/page.tsx`
- [x] T010 [US2] Test sample label, production omission boundary, and empty/error rendering in `src/app/reports/[id]/comparison.test.tsx`

## Phase 5: User Story 3 — Privacy and inertness (P1)

**Independent test**: Foreign Reporter and wrong-role direct reads return no revision; markup remains text.

- [x] T011 [US3] Assert role/owner RLS and no Reporter mutation grants in `supabase/tests/reporter_comparison.test.sql`
- [x] T012 [US3] Verify code/note escaping and malformed report ID behavior in `src/app/reports/[id]/comparison.test.tsx` and `src/app/reports/[id]/page.tsx`

## Phase 6: Review and evidence

- [x] T013 Run unit, lint, typecheck, database and build checks and record actual results in `workflow/evidence/F004-reporter-code-diff-handoff.json`
- [ ] T014 Complete independent code/security review and verifier handoff; release claim, member log and post-turn token usage record under `workflow/`

## Dependencies

T001–T003 establish the read contract. T004–T005 and T006–T007 can be prepared in separate files; T008 integrates them. T009–T012 close empty and security cases. Reviews follow implementation, verifier follows reviews. MVP is the owned latest-revision comparison; the empty/sample and privacy stories remain release gates.

## Completion note (2026-11-06)

T001–T013 implemented and checked. Independent verifier: 12 unit tests, lint, typecheck and whitespace passed. Disposable database: 72 pgTAP assertions and db lint passed. Code review found weak truncated author ID and a wall-clock diff timeout; both were fixed and rechecked. Security review found no blocker. Browser selection/production-output smoke and a production build remain unverified because no browser is available and Turbopack cannot bind a process port in this environment. T014 remains pending post-turn token finish and run recording.
