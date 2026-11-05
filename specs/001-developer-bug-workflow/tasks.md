---

description: "Dependency-ordered implementation tasks for the Developer bug workflow"
---

# Tasks: Developer Bug Workflow

**Input**: Design documents from `specs/001-developer-bug-workflow/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, and
`quickstart.md`

**Tests**: Included because the specification and constitution require lifecycle, authorization,
RLS, security, and acceptance evidence.

**Implementation owner**: Jordan (Developer role)

## Phase 1: Setup

**Purpose**: Establish the bounded context and evidence files before application changes.

- [X] T001 Read `specs/001-developer-bug-workflow/spec.md`, `plan.md`, `data-model.md`, and `contracts/developer-workflow.md`; record approved scope and file ownership in `workflow/evidence/developer-workflow-scope.md`
- [X] T002 [P] Create the Developer task request with owner, acceptance criteria, security sensitivity, and bounded references in `workflow/requests/developer-workflow.json`
- [X] T003 [P] Create the implementation handoff record in `workflow/evidence/developer-workflow-handoff.json`

---

## Phase 2: Foundational

**Purpose**: Confirm the existing schema and establish shared validation/query boundaries before UI work.

**Checkpoint**: Foundation ready; user-story work may proceed in dependency order.

- [X] T004 Inspect `supabase/migrations/20261104000000_bug_lifecycle.sql` and `supabase/tests/bug_lifecycle.test.sql`; document schema or RLS gaps against `specs/001-developer-bug-workflow/data-model.md` in `workflow/evidence/developer-schema-review.md`
- [X] T005 [P] Add shared Developer input schemas and error mapping for report IDs, note bodies, fixed code, and submission notes in `src/lib/developer/validation.ts`
- [X] T006 [P] Add the authenticated Developer query and assignment authorization boundary in `src/lib/developer/queries.ts`
- [X] T007 [P] Add application tests for Developer validation and authorization mapping in `src/lib/developer/validation.test.ts`
- [X] T008 Add `supabase/migrations/20261105000000_editable_investigation_notes.sql` for `investigation_notes.updated_at`, author-only note updates while reports are `open` or `in_progress`, and read-only notes after QA handoff; extend `supabase/tests/bug_lifecycle.test.sql` with direct original-code edits, direct revision inserts, and unauthorized lifecycle calls

---

## Phase 3: User Story 1 - Review Assigned Reports (Priority: P1) 🎯 MVP

**Goal**: An authenticated Developer can view only assigned reports with safe loading, empty, error, and denied states.

**Independent Test**: Seed assigned and unassigned reports, sign in as the assigned Developer, and confirm only the assigned report is listed; repeat as another Developer and confirm no protected report is disclosed.

### Tests for User Story 1

- [X] T009 [P] [US1] Add assigned/unassigned report query coverage in `src/lib/developer/queries.test.ts`
- [X] T010 [P] [US1] Add dashboard acceptance tests for populated, empty, denied, and service-error states in `src/app/developer/page.test.tsx`

### Implementation for User Story 1

- [X] T011 [US1] Implement the assigned-report dashboard query and page in `src/app/developer/page.tsx` using `src/lib/developer/queries.ts`
- [X] T012 [P] [US1] Implement the dashboard loading state in `src/app/developer/loading.tsx`
- [X] T013 [P] [US1] Implement the dashboard error and safe permission-denied state in `src/app/developer/error.tsx`
- [X] T014 [US1] Implement the assigned-report list and empty state in `src/app/developer/developer-dashboard.tsx`

**Checkpoint**: User Story 1 is independently demonstrable without notes, revisions, or QA actions.

---

## Phase 4: User Story 2 - Investigate an Assigned Report (Priority: P1)

**Goal**: An assigned Developer can open a report, start work, append notes, and edit their own notes before QA handoff.

**Independent Test**: Open an assigned report, start work, add a valid note, reload it, and confirm the note is attributed and protected from an unassigned user.

### Tests for User Story 2

- [ ] T015 [P] [US2] Add server-action tests for start-work authorization, valid notes, empty notes, note editing, stale status, and post-handoff edits in `src/app/developer/[reportId]/actions.test.ts`
- [ ] T016 [P] [US2] Add RLS/lifecycle coverage for assigned note insertion, author-only note updates, unauthorized note updates, and post-handoff note immutability in `supabase/tests/bug_lifecycle.test.sql`

### Implementation for User Story 2

- [ ] T017 [US2] Implement the report detail read model and participant-safe report page in `src/app/developer/[reportId]/page.tsx`
- [ ] T018 [US2] Implement start-work, add-investigation-note, and edit-investigation-note server actions with validation and lifecycle error mapping in `src/app/developer/[reportId]/actions.ts`
- [ ] T019 [P] [US2] Implement report-detail loading state in `src/app/developer/[reportId]/loading.tsx`
- [ ] T020 [P] [US2] Implement report-detail error and permission-denied handling in `src/app/developer/[reportId]/error.tsx`
- [ ] T021 [US2] Implement the investigation note form, editable note entries, note history, and validation feedback in `src/app/developer/[reportId]/investigation-notes.tsx`

**Checkpoint**: User Story 2 is independently demonstrable with an assigned report and no fix revision required.

---

## Phase 5: User Story 3 - Submit and Compare a Versioned Fix (Priority: P1)

**Goal**: A Developer can submit immutable corrected Python revisions and compare them with the original text.

**Independent Test**: Submit two revisions for an assigned `in_progress` report, compare each with the original, and confirm the original and first revision remain unchanged.

### Tests for User Story 3

- [ ] T022 [P] [US3] Add submit-fix tests for valid code, empty/oversized code, wrong status, wrong assignment, and repeated revisions in `src/app/developer/[reportId]/actions.test.ts`
- [ ] T023 [P] [US3] Add revision immutability, concurrent numbering, and direct-insert denial coverage in `supabase/tests/bug_lifecycle.test.sql`
- [ ] T024 [P] [US3] Add text-diff rendering tests for additions, removals, unchanged lines, and malformed/empty input in `src/app/developer/[reportId]/code-diff.test.tsx`

### Implementation for User Story 3

- [ ] T025 [US3] Implement the submit-fix server action calling the approved `submit_fix` lifecycle function in `src/app/developer/[reportId]/actions.ts`
- [ ] T026 [US3] Implement immutable revision history and original-versus-selected-revision comparison in `src/app/developer/[reportId]/code-diff.tsx`
- [ ] T027 [US3] Implement corrected-code and submission-note form with 20,000-character code and 5,000-character note limits in `src/app/developer/[reportId]/fix-form.tsx`
- [ ] T028 [US3] Add revision history and selected-revision data loading to `src/app/developer/[reportId]/page.tsx`

**Checkpoint**: User Story 3 is independently demonstrable with immutable revisions and safe text comparison.

---

## Phase 6: User Story 4 - Handoff a Fix to QA (Priority: P1)

**Goal**: A Developer can send a valid latest revision to QA without receiving QA decision controls.

**Independent Test**: Submit a valid revision and confirm the report enters `awaiting_qa`, the selected revision is available to QA, and the Developer cannot approve or reject it.

### Tests for User Story 4

- [ ] T029 [P] [US4] Add handoff precondition and permission tests for missing notes, missing code, wrong status, and Developer approval attempts in `src/app/developer/[reportId]/actions.test.ts`
- [ ] T030 [P] [US4] Add lifecycle evidence for `in_progress` to `awaiting_qa` and Developer denial of `decide_fix` in `supabase/tests/bug_lifecycle.test.sql`

### Implementation for User Story 4

- [ ] T031 [US4] Implement the QA handoff action and success/error messages using the `submit_fix` result in `src/app/developer/[reportId]/actions.ts`
- [ ] T032 [US4] Implement the read-only awaiting-QA handoff summary without approval/rejection controls in `src/app/developer/[reportId]/qa-handoff.tsx`
- [ ] T033 [US4] Integrate the handoff summary and status into `src/app/developer/[reportId]/page.tsx`

**Checkpoint**: User Story 4 is independently demonstrable as the Developer-to-QA boundary.

---

## Phase 7: User Story 5 - Revise a QA-Rejected Fix (Priority: P2)

**Goal**: A Developer can read QA rejection feedback, create a new revision, and return the report to `in_progress` before resubmission.

**Independent Test**: Use an approved QA fixture to reject revision 1, confirm the Developer sees feedback, submit revision 2, and confirm revision 1 remains available.

### Tests for User Story 5

- [ ] T034 [P] [US5] Add rejection-feedback and revision-chain read tests in `src/app/developer/[reportId]/page.test.tsx`
- [ ] T035 [P] [US5] Add rejection-to-revision lifecycle coverage in `supabase/tests/bug_lifecycle.test.sql`

### Implementation for User Story 5

- [ ] T036 [US5] Implement participant-safe QA rejection feedback display linked to the affected revision in `src/app/developer/[reportId]/qa-feedback.tsx`
- [ ] T037 [US5] Enable revision submission after QA rejection while preserving prior revisions in `src/app/developer/[reportId]/fix-form.tsx`
- [ ] T038 [US5] Integrate rejection feedback, revision lineage, and `in_progress` state into `src/app/developer/[reportId]/page.tsx`

**Checkpoint**: User Story 5 is independently demonstrable as a complete Developer revision loop.

---

## Phase 8: Polish and Cross-Cutting Concerns

**Purpose**: Independent review, evidence, and final validation across all stories.

- [ ] T039 [P] Run the `security_reviewer` role against the spec, migration, changed server actions, and RLS tests; record findings in `workflow/evidence/developer-security-review.json`
- [ ] T040 [P] Run the `code_reviewer` role against changed Developer files and contracts; record findings in `workflow/evidence/developer-code-review.json`
- [ ] T041 Run the `verifier` role against the quickstart, acceptance criteria, and actual command output; record the result in `workflow/evidence/developer-verification.json`
- [ ] T042 Run `python workflow/scripts/check_workflow.py` and `python workflow/scripts/test_agent_workflow.py`; record actual results in `workflow/evidence/developer-workflow-checks.txt`
- [ ] T043 Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:db`, and `npm run build`; record actual results in `workflow/evidence/developer-command-results.txt`
- [ ] T044 Update `logs/jordan/` with the interaction summary and `docs/Reflections.md` with measured technique/context/resource evidence; do not invent unavailable metrics
- [ ] T045 Run the manual scenarios in `specs/001-developer-bug-workflow/quickstart.md` and record the outcome in `workflow/evidence/developer-quickstart.md`

---

## Dependencies and Execution Order

- Phase 1 has no code dependency and establishes ownership/evidence.
- Phase 2 depends on Phase 1 and blocks all user stories.
- US1 depends on the authenticated query boundary from Phase 2.
- US2 depends on the report detail boundary from US1.
- US3 depends on the report detail and lifecycle action boundary from US2.
- US4 depends on US3's valid revision and handoff state.
- US5 depends on US4 and the QA feature or approved QA rejection fixture.
- Phase 8 depends on the desired user stories being complete.

Parallel opportunities: T005–T007, T009–T010, T012–T013, T015–T016, T022–T024, T029–T030,
T034–T035, and T039–T040 can run in parallel where their file ownership remains disjoint.

## Agent Coordination

The orchestrator owns the task request and integration. The explorer performs T004 read-only schema
review. The generator owns disjoint source files per story. The security reviewer owns T039, the
code reviewer owns T040, and the verifier owns T041–T045. Handoffs use the repository formats under
`workflow/templates/` and are stored under `workflow/evidence/`.

## Implementation Strategy

1. Complete the foundation and schema review.
2. Deliver US1 as the smallest visible MVP increment.
3. Add US2 investigation and lifecycle start behavior.
4. Add US3 immutable revisions and comparison.
5. Add US4 QA handoff.
6. Add US5 rejection/revision loop.
7. Run independent security, code, and verification reviews before handoff.

The Developer AI feature is intentionally excluded and should use a separate SDD and T08 workflow
after this non-AI baseline is stable.
