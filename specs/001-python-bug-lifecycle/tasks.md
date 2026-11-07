# Tasks: Python Bug Resolution Lifecycle

**Input**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/workflow.md`

**Tests**: Required by the constitution for RBAC, RLS, AI boundaries and lifecycle.

## Phase 1: Foundational

- [ ] T001 Create role, report, revision, test, event and AI usage schema with constraints and RLS in `supabase/migrations/20261104000000_bug_lifecycle.sql`
- [ ] T002 Write cross-role and cross-report RLS tests in `supabase/tests/rls_enabled.test.sql`
- [ ] T003 Implement authenticated role lookup and relationship checks in `src/lib/auth.ts`
- [ ] T004 Implement bounded report and workflow validation in `src/lib/reports/validation.ts`

## Phase 2: User Story 1 - Report and Track a Bug (P1)

**Goal**: Reporter creates, edits and tracks own reports.

**Independent Test**: Reporter succeeds; another reporter cannot read or edit the record.

- [ ] T005 [US1] Write reporter validation and ownership tests in `src/lib/reports/validation.test.ts` and `supabase/tests/bug_lifecycle.test.sql`
- [ ] T006 [US1] Implement create/edit report server actions in `src/app/reports/actions.ts`
- [ ] T007 [US1] Implement reporter list and create form in `src/app/reports/page.tsx`
- [ ] T008 [US1] Implement protected report detail and original/fix comparison in `src/app/reports/[id]/page.tsx`

### Reporter list/edit increment against the current submission schema

This increment implements the list/edit parts of US1 using the current `python_code` schema. The original T005-T008 describe the broader story and are not marked complete by this slice. Complete the following bounded tasks before claiming the broader story:

After integration with `develop`, `python_code` remains the form field while the canonical database column is `bug_reports.code`. The original standalone Reporter migrations were removed during schema integration; the role-aware policy now lives in `20261105000300_reporter_role_access.sql`.

- [x] T024 [US1] Implement owner/Reporter-only list and open-only edit against the existing submission schema: add a follow-on migration and pgTAP cases, `/reports` list, protected `/reports/[id]` detail/edit, shared six-field validation, and a server action that retains invalid input (depends on the implemented submission slice; owner Joseph). Evidence: `workflow/evidence/T024-reporter-list-edit-handoff.json`.
- [x] T025 [US1] Independently review T024 authorization and verify unit, type, lint, database, and signed-in browser behavior; record a structured handoff and actual run metrics where available (depends on T024). Evidence: `workflow/evidence/T024-reporter-list-edit-handoff.json`.

## Phase 3: User Story 2 - Investigate and Revise a Fix (P1)

**Goal**: Assigned Developer investigates and submits immutable fixes.

**Independent Test**: Developer submits revisions 1 and 2 after rejection; unassigned Developer is denied.

- [ ] T009 [US2] Write revision and transition database tests in `supabase/tests/bug_lifecycle.test.sql`
- [ ] T010 [US2] Implement developer workflow actions in `src/app/reports/actions.ts`
- [ ] T011 [US2] Add developer queue and forms in `src/app/reports/page.tsx` and `src/app/reports/[id]/page.tsx`

## Phase 4: User Story 3 - Verify or Return a Fix (P1)

**Goal**: Assigned QA records results and decides latest fix.

**Independent Test**: QA rejects revision 1, approves revision 2, and stale decisions are denied.

- [ ] T012 [US3] Extend decision, history and role tests in `supabase/tests/bug_lifecycle.test.sql`
- [ ] T013 [US3] Implement QA test and decision actions in `src/app/reports/actions.ts`
- [ ] T014 [US3] Add QA queue, test form and history in `src/app/reports/page.tsx` and `src/app/reports/[id]/page.tsx`

## Phase 5: User Story 4 - Role-Specific AI Help (P1)

**Goal**: Each role receives one safe, bounded suggestion feature.

**Independent Test**: Each role gets relevant advice; wrong role, injection, quota and provider failures are safe.

- [ ] T015 [US4] Write gateway validation, injection, quota and failure tests in `src/lib/ai/gateway.test.ts`
- [ ] T016 [US4] Implement server-only SoC LLM gateway, limits and usage recording in `src/lib/ai/gateway.ts`
- [ ] T017 [US4] Implement role-bound AI server actions in `src/app/ai/actions.ts`
- [ ] T018 [US4] Add labeled AI suggestion controls to `src/app/reports/[id]/page.tsx`

## Phase 6: Polish and Release

- [ ] T019 Update `docs/UserGuide.md` and `docs/DeveloperGuide.md` to match verified behavior
- [ ] T020 Update CI, deployment and smoke checks in `.github/workflows/ci.yml` and `.github/workflows/deploy.yml`
- [ ] T021 Create GitHub Pages product website under `website/` and document publishing in `README.md`
- [ ] T022 Run `specs/001-python-bug-lifecycle/quickstart.md` and record real results in `workflow/evidence/`
- [ ] T023 Run measured agent/context experiments and record findings in `docs/Reflections.md` and `logs/`

## Dependencies and execution order

T001-T004 remain the full-lifecycle foundation gate for US2-US4. The reporter submission slice has its own applied schema and validation; T024-T025 extend that existing slice without claiming T001-T008 complete. Within each story, tests precede implementation. US1, US2 and US3 can be owned by different team members after the full foundation, but shared `actions.ts` and pages require sequential integration. US4 depends on report authorization and all role workflows. T019-T023 follow verified implementation. The assignment's complete release requires all four stories.

## Parallel opportunities

T002 and T004 can proceed separately after T001. Following the foundation, US1 validation work and US2/US3 test design can proceed in separate files. Security review can run independently after T016-T017 and before T022. Do not run multiple agents editing `src/app/reports/actions.ts` simultaneously.
