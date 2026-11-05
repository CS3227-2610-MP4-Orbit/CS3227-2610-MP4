# Tasks: Reporter Feedback View

**Input**: [spec.md](spec.md), [plan.md](plan.md), [data-model.md](data-model.md), [contracts/feedback.md](contracts/feedback.md)

## Phase 1: Setup

- [x] T001 Confirm the existing report detail authorization and Next.js request-time rendering contract in `src/app/reports/[id]/page.tsx` and `node_modules/next/dist/docs/`

## Phase 2: Foundational

- [x] T002 Add the append-only `public.bug_feedback` relation, validation, index, grants, and reporter-owner RLS in `supabase/migrations/20261105000200_reporter_feedback.sql`
- [x] T003 Add pgTAP checks for owner, second reporter, non-reporter, anonymous, read-only grants, and constraints in `supabase/tests/reporter_feedback.test.sql`

## Phase 3: User Story 1 — Read feedback on my report (P1)

**Goal**: Display real Developer/QA feedback on the owning Reporter's detail page, or an honest empty state.

**Independent test**: Two DB-owner fixtures appear newest first with role and time; a report with no entries shows no-feedback text.

- [x] T004 [P] [US1] Add rendering tests for entries, order, empty state, and load error in `src/app/reports/[id]/feedback-section.test.tsx`
- [x] T005 [US1] Build the text-only feedback timeline and empty/error states in `src/app/reports/[id]/feedback-section.tsx`
- [x] T006 [US1] Query feedback after the existing owner check and render the timeline in `src/app/reports/[id]/page.tsx`

## Phase 4: User Story 2 — Keep feedback private and inert (P1)

**Goal**: Direct reads respect report ownership and feedback never executes markup.

**Independent test**: pgTAP denies foreign and non-reporter reads; component test shows markup escaped.

- [x] T007 [US2] Extend the component test with markup-like feedback and safe error assertions in `src/app/reports/[id]/feedback-section.test.tsx`
- [x] T008 [US2] Verify the migration and detail query against the role/ownership matrix in `supabase/tests/reporter_feedback.test.sql` and `src/app/reports/[id]/page.tsx`

## Phase 5: Review and evidence

- [x] T009 Run unit, database, lint, type/build checks and a signed-in local smoke where available; record actual outcomes in `workflow/evidence/F002-reporter-feedback-handoff.json`
- [ ] T010 Complete independent code/security review, verifier handoff, usage record, release claim, and member log under `workflow/`

## Dependencies and execution

T001 precedes T002–T003. T002 enables T006 and T008. T004 and T003 can proceed in separate files. T005 follows T004; T006 follows T002 and T005. T007–T008 complete privacy coverage. T009–T010 follow implementation.

**MVP**: User Story 1 with owner-gated read and empty state. User Story 2 and independent security review remain release gates.

## Completion note (2026-11-05)

T002–T008 implemented and independently reviewed. Unit suite: 8 tests passed; local pgTAP: 34 assertions passed after applying the pending migration; lint and typecheck passed. Signed-in HTTP smoke and injected live query failure were not run. Production build failed due Turbopack process/port binding permission in this environment. Future Developer/QA writer must bind author ID and role. Token finish/record remains pending until the orchestrator turn ends.
