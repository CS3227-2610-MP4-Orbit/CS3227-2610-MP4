---

description: "Dependency-ordered implementation tasks for the Reporter draft quality check"
---

# Tasks: Check Report Quality

**Input**: Design documents from `specs/005-check-report-quality/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/draft-quality-check.md`, `quickstart.md`

**Tests**: Included because the spec requires acceptance tests and the constitution requires security and AI failure coverage.

**Organization**: Tasks are grouped by the two independently testable user stories. All tasks remain unchecked until implementation and verification produce evidence.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel with other ready tasks because files do not overlap and neither depends on the other's unfinished work.
- **[Story]**: Maps to User Story 1 or 2 in `spec.md`.
- Paths are relative to the repository root.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare representative drafts and confirm the existing submit route stays the baseline.

- [X] T001 Add reusable complete, partial, all-blank, oversized, and instruction-in-code draft fixtures to `src/app/reports/new/quality-check.fixtures.ts` for the acceptance and security tests.
- [X] T002 Record the current normal submission behavior and local smoke-test prerequisites in `specs/005-check-report-quality/quickstart.md`, including that only Submit report creates a `bug_reports` row.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Define the new AI task and validate draft input before either story uses it.

- [X] T003 Add `reporter_quality_check` to the feature map in `src/lib/ai/prompt.ts` with Reporter-only access, a bounded output cap, and instructions for short field-grouped plain-text suggestions that do not invent missing facts or propose automatic edits.
- [X] T004 [P] Add draft-check parsing in `src/lib/reports/quality-check.ts`: accept only the six named strings; enforce title ≤120 characters, Python code ≤20,000 characters, and error/expected/actual/reproduction fields ≤2,000 characters each; allow individual blanks but refuse an all-blank draft and reject oversized input without truncation.

**Checkpoint**: The gateway recognizes the quality-check task and the six-field draft has a dedicated validation boundary. Neither task changes report creation.

---

## Phase 3: User Story 1 - Improve a draft before submission (Priority: P1) 🎯 MVP

**Goal**: A Reporter can request and read actionable feedback on the current unsent draft without any report or field being changed.

**Independent Test**: On `/reports/new`, check a partly complete draft with vague reproduction steps; verify the suggestions name relevant fields, all current values remain, and My Reports gains no row until Submit report is chosen.

### Tests for User Story 1

- [X] T005 [P] [US1] Add action tests in `src/app/reports/new/check-quality.test.ts` for anonymous and Developer/QA refusal before gateway use, all six field values including blank markers, ignored forged extra fields, all-blank and oversized refusal, and zero report mutations.
- [X] T006 [P] [US1] Add prompt tests in `src/lib/ai/prompt.test.ts` for the Reporter-only task, field-grouped plain-text instruction, and instruction text embedded in draft code remaining untrusted data.
- [ ] T007 [P] [US1] Add form interaction tests in `src/app/reports/report-form.test.tsx` for a partial draft check that bypasses submission validation, preserves all field values, leaves Submit report separate, and marks a suggestion stale after any field changes.

### Implementation for User Story 1

- [X] T008 [US1] Implement the authenticated `reporter_quality_check` server action in `src/app/reports/new/check-quality.ts`: verify current user and Reporter role; validate only the six draft fields; send the bounded context through `runAiFeature` with `reportId: null`; return only a safe message or bounded text; never call `createReport` or write `bug_reports`.
- [X] T009 [P] [US1] Add a change callback to `src/app/reports/python-editor.tsx` and a focused test in `src/app/reports/python-editor.test.tsx` so edits in the enhanced editor and textarea both mark a displayed check stale.
- [X] T010 [US1] Add the separate Check my report control and labeled plain-text suggestion area in `src/app/reports/report-form.tsx`, collecting current draft values without native submit validation and preserving those values during checks.
- [X] T011 [US1] Enable the quality-check control only for the New Report route in `src/app/reports/new/page.tsx`; keep editing an existing report and normal submission behavior unchanged.

**Checkpoint**: User Story 1 can be demonstrated without a saved draft or an AI-caused report write.

---

## Phase 4: User Story 2 - Recover from an unavailable check (Priority: P2)

**Goal**: AI refusals and failures are understandable, preserve the draft and earlier suggestion, and never block ordinary submission.

**Independent Test**: After one successful suggestion, simulate quota refusal and provider failure, then confirm the prior suggestion and current draft remain visible and a valid report can still be submitted.

### Tests for User Story 2

- [X] T012 [P] [US2] Extend `src/app/reports/new/check-quality.test.ts` for quota refusal, timeout, malformed model response, provider failure, and safe messages without provider or secret details.
- [ ] T013 [P] [US2] Extend `src/app/reports/report-form.test.tsx` for pending state, failed repeat requests retaining the last success, stale labeling after edits, and submitting a valid draft despite a failed check.

### Implementation for User Story 2

- [X] T014 [US2] Complete failure and retry state handling in `src/app/reports/report-form.tsx`, keeping the prior suggestion, a separate current failure message, and the normal Submit report action available.
- [X] T015 [US2] Map empty, oversized, role-denied, quota, timeout, and provider failures to safe messages in `src/app/reports/new/check-quality.ts` without returning raw database or provider errors.

**Checkpoint**: User Story 2 can be tested with stubbed failures independently of a live provider.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Verify the security boundary, document the feature, and collect presentation-ready evidence.

- [X] T016 [P] Update `docs/UserGuide.md` and `docs/DeveloperGuide.md` with the optional pre-submission check, suggestion limits, and the distinction from the existing report-detail explanation.
- [X] T017 Request and record an independent AI-boundary security review in `workflow/evidence/005-check-report-quality-security.md`, covering cross-role requests, forged fields, injection text, output rendering, quota behavior, and absence of report writes.
- [X] T018 Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:db`, `npm run build`, and the scenarios in `specs/005-check-report-quality/quickstart.md`; record observed passes, failures, and environment limits in `workflow/evidence/005-check-report-quality-verification.md`.
- [X] T019 Evaluate SC-001 and SC-004 with at least five representative draft reports and five distinct Reporter participants, recording actual observations or explicitly marking unrun checks in `workflow/evidence/005-check-report-quality-verification.md`.
- [X] T020 Summarize implementation decisions, review outcome, and verified evidence in `logs/joseph/2026-11-09-report-quality-implementation.md` and update `specs/005-check-report-quality/quickstart.md` if observed setup differs.

---

## Dependencies & Execution Order

### Phase Dependencies

```text
Setup T001–T002
  → Foundation T003–T004
    → User Story 1 T005–T011 (MVP)
      → User Story 2 T012–T015
        → Polish T016–T020
```

- T003 and T004 can proceed independently after Setup; T008 requires both.
- The three US1 test tasks can be prepared in parallel after Foundation. T010 follows T008 and T009; T011 follows T010.
- US2 tests can be prepared in parallel after US1. T014 and T015 follow the relevant failing tests.
- T017 security review follows the completed AI and UI changes. T018–T019 validate the integrated feature. T020 records only actual results.

### User Story Dependencies

- **User Story 1 (P1)**: Requires Phase 2 foundation and delivers the independently useful MVP.
- **User Story 2 (P2)**: Builds on US1's check interaction but is independently testable by simulating an AI failure without a live provider.

### Parallel Opportunities

- T003 and T004 use separate files.
- T005, T006, and T007 use separate test files.
- T009 can run while T008 is implemented because it owns the Python editor files.
- T016 documentation can run after behavior is fixed while T017 performs independent review.

### Parallel Example: User Story 1

```text
After T003–T004, separate owners can prepare T005 in src/app/reports/new/check-quality.test.ts,
T006 in src/lib/ai/prompt.test.ts, and T007 in src/app/reports/report-form.test.tsx.
After those tests define expected behavior, one owner builds the server action (T008), while
another owns the Python editor callback and its test (T009). Integrate both in T010–T011.
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup and Foundation.
2. Add and run the US1 tests; record which checks fail for the missing action and UI before implementing T008–T011. Foundational prompt and validation tests may already pass.
3. Implement T008–T011 and verify the independent test.
4. Demonstrate a partial draft check and confirm it creates no report.

### Incremental Delivery

1. Add US2 failure handling and verify retry, stale, and submit behavior.
2. Run security review and the quickstart walkthrough.
3. Record actual automated and usability results before claiming acceptance.

## Notes

- `[P]` means file-disjoint work can run in parallel after its dependencies are satisfied; it does not itself assign an agent.
- The field-grouped display is a documented planning assumption because the user moved to planning before choosing a display option.
- No task is marked complete by generation of this file.
