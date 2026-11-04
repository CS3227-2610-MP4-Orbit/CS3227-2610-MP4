# Tasks: Python Bug Resolution Lifecycle

**Input**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/workflow.md`

**Tests**: Required by the constitution for RBAC, RLS, AI boundaries and lifecycle.

## Phase 1: Setup

- [ ] T001 Review the additive migration decision and legacy data status in `specs/001-python-bug-lifecycle/research.md`
- [ ] T002 Align README and environment names with the bug product in `README.md` and `scripts/setup-environments.mjs`

## Phase 2: Foundational

- [ ] T003 Create role, report, revision, test, event and AI usage schema with constraints and RLS in `supabase/migrations/20261104000000_bug_lifecycle.sql`
- [ ] T004 Write cross-role and cross-report RLS tests in `supabase/tests/rls_enabled.test.sql`
- [ ] T005 Implement authenticated role lookup and relationship checks in `src/lib/auth.ts`
- [ ] T006 Implement bounded report and workflow validation in `src/lib/reports/validation.ts`

## Phase 3: User Story 1 - Report and Track a Bug (P1)

**Goal**: Reporter creates, edits and tracks own reports.

**Independent Test**: Reporter succeeds; another reporter cannot read or edit the record.

- [ ] T007 [US1] Write reporter validation and ownership tests in `src/lib/reports/validation.test.ts` and `supabase/tests/bug_lifecycle.test.sql`
- [ ] T008 [US1] Implement create/edit report server actions in `src/app/reports/actions.ts`
- [ ] T009 [US1] Implement reporter list and create form in `src/app/reports/page.tsx`
- [ ] T010 [US1] Implement protected report detail and original/fix comparison in `src/app/reports/[id]/page.tsx`

## Phase 4: User Story 2 - Investigate and Revise a Fix (P1)

**Goal**: Assigned Developer investigates and submits immutable fixes.

**Independent Test**: Developer submits revisions 1 and 2 after rejection; unassigned Developer is denied.

- [ ] T011 [US2] Write revision and transition database tests in `supabase/tests/bug_lifecycle.test.sql`
- [ ] T012 [US2] Implement developer workflow actions in `src/app/reports/actions.ts`
- [ ] T013 [US2] Add developer queue and forms in `src/app/reports/page.tsx` and `src/app/reports/[id]/page.tsx`

## Phase 5: User Story 3 - Verify or Return a Fix (P1)

**Goal**: Assigned QA records results and decides latest fix.

**Independent Test**: QA rejects revision 1, approves revision 2, and stale decisions are denied.

- [ ] T014 [US3] Extend decision, history and role tests in `supabase/tests/bug_lifecycle.test.sql`
- [ ] T015 [US3] Implement QA test and decision actions in `src/app/reports/actions.ts`
- [ ] T016 [US3] Add QA queue, test form and history in `src/app/reports/page.tsx` and `src/app/reports/[id]/page.tsx`

## Phase 6: User Story 4 - Role-Specific AI Help (P1)

**Goal**: Each role receives one safe, bounded suggestion feature.

**Independent Test**: Each role gets relevant advice; wrong role, injection, quota and provider failures are safe.

- [ ] T017 [US4] Write gateway validation, injection, quota and failure tests in `src/lib/ai/gateway.test.ts`
- [ ] T018 [US4] Implement server-only SoC LLM gateway, limits and usage recording in `src/lib/ai/gateway.ts`
- [ ] T019 [US4] Implement role-bound AI server actions in `src/app/ai/actions.ts`
- [ ] T020 [US4] Add labeled AI suggestion controls to `src/app/reports/[id]/page.tsx`

## Phase 7: Polish and Release

- [ ] T021 Update `docs/UserGuide.md` and `docs/DeveloperGuide.md` to match verified behavior
- [ ] T022 Update CI, deployment and smoke checks in `.github/workflows/ci.yml` and `.github/workflows/deploy.yml`
- [ ] T023 Create GitHub Pages product website under `website/` and document publishing in `README.md`
- [ ] T024 Run `specs/001-python-bug-lifecycle/quickstart.md` and record real results in `workflow/evidence/`
- [ ] T025 Run measured agent/context experiments and record findings in `docs/Reflections.md` and `logs/`

## Dependencies and execution order

T001 gates T003. T003-T006 gate all user stories. Within each story, tests precede implementation. US1, US2 and US3 can be owned by different team members after foundation, but shared `actions.ts` and pages require sequential integration. US4 depends on report authorization and all role workflows. T021-T025 follow verified implementation. Suggested MVP is US1 plus foundation; the assignment's complete release requires all four stories.

## Parallel opportunities

T004 and T006 can proceed separately after T003. Following the foundation, US1 validation work and US2/US3 test design can proceed in separate files. Security review can run independently after T018-T019 and before T024. Do not run multiple agents editing `src/app/reports/actions.ts` simultaneously.
