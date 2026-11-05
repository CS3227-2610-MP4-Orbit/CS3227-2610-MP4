# Feature Specification: Developer Bug Workflow

**Feature Branch**: `branch-developer-agent`

**Created**: 2026-11-04

**Status**: Draft

**Input**: User description: "Create the specification for the Developer portion of the Python bug
resolution platform. The Developer can view assigned reports, record investigation notes, submit
corrected Python code as immutable revisions, compare original and updated code, submit a fix to
QA, and revise rejected fixes."

## Relationship to Approved Product Scope

This is the Developer-owned slice of the team-approved product specification at
`workflow/specs/001-bug-lifecycle/spec.md`. Jordan owns this slice. The shared product lifecycle
is `open → in_progress → awaiting_qa → closed`; a QA rejection returns a report from
`awaiting_qa` to `in_progress`. This feature defines the Developer behavior and QA handoff data;
the QA interface and QA decisions are implemented by the QA owner in a dependent feature.

## Clarifications

### Session 2026-11-05

- Q: Should the Developer MVP include a working QA review interface, or only the Developer-side
  handoff to QA? → A: Implement the Developer workflow plus the QA handoff and status data; deliver
  the full QA review interface as a separate feature.

This feature owns the Developer-side submission and revision behavior. It MUST expose enough
handoff state and feedback data for the later QA feature, but it MUST NOT implement QA screens or
QA approval/rejection actions here.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Review assigned reports (Priority: P1)

As a Developer, I want to see the bug reports assigned to me so that I can select work I am responsible
for and understand what needs investigation.

**Why this priority**: Without assignment-aware access and a useful queue, the Developer cannot
begin the bug-resolution workflow safely.

**Independent Test**: Sign in as a Developer with assigned and unassigned reports, open the dashboard,
and verify that only assigned reports appear with their current status and essential details.

**Acceptance Scenarios**:

1. **Given** an authenticated Developer has assigned reports, **When** they open the Developer
   dashboard, **Then** they see only their assigned reports with title, status, priority, and last
   updated time.
2. **Given** an authenticated Developer has no assigned reports, **When** they open the dashboard,
   **Then** they see an empty-state message and no unrelated report data.
3. **Given** a Developer attempts to open an unassigned report by identifier, **When** the request is
   processed, **Then** access is denied without revealing the report's contents.

---

### User Story 2 - Investigate an assigned report (Priority: P1)

As a Developer, I want to review the original report information and record investigation notes so
that my reasoning is traceable before I submit a fix.

**Why this priority**: Investigation notes create an auditable explanation of the diagnosis and
give QA useful context about the change.

**Independent Test**: Open an assigned report, review its original information, add notes, save them,
and reload the report to verify the notes persist and are visible only to permitted users.

**Acceptance Scenarios**:

1. **Given** an assigned report is open, **When** the Developer views it, **Then** the original code,
   error message, expected behavior, actual behavior, and reproduction steps are displayed.
2. **Given** an assigned report is open, **When** the Developer saves non-empty investigation notes,
   **Then** the notes are stored with the Developer identity and update time.
3. **Given** a Developer submits invalid or empty notes where notes are required, **When** they
   save, **Then** validation feedback is shown and no invalid note is stored.
4. **Given** a user is not the assigned Developer, **When** they request the investigation notes,
   **Then** the notes are not disclosed.

---

### User Story 3 - Submit and compare a versioned fix (Priority: P1)

As a Developer, I want to submit a corrected Python version without overwriting the original so that I
can review the change and preserve a reliable revision history.

**Why this priority**: A fix is the core Developer deliverable, and preserving both versions is
required for review, QA, and reflection evidence.

**Independent Test**: Submit a corrected version for an assigned report, view a comparison with the
original, create a second revision, and verify that the original and first revision remain intact.

**Acceptance Scenarios**:

1. **Given** an assigned report has original code, **When** the Developer submits corrected Python
   code, **Then** a new revision is stored without changing the original code.
2. **Given** a fix revision exists, **When** the Developer opens the comparison view, **Then** the
   original code and selected revised code are shown with additions, removals, and unchanged
   sections distinguishable.
3. **Given** a Developer submits another correction, **When** it is saved, **Then** a new revision
   is created and previous revisions remain viewable.
4. **Given** code exceeds the supported input limit or is empty, **When** the Developer submits it,
   **Then** submission is rejected with actionable validation feedback.
5. **Given** a Developer attempts to update the original code directly, **When** the request is
   processed, **Then** the request is rejected and the original remains unchanged.

---

### User Story 4 - Handoff a fix to QA (Priority: P1)

As a Developer, I want to submit a selected fix through a clear QA handoff so that the later QA
workflow can verify it and it cannot be mistaken for an approved solution.

**Why this priority**: The handoff to QA completes the Developer's primary workflow and establishes
the boundary between implementation and verification.

**Independent Test**: Select a valid fix with investigation notes, submit it through the QA
handoff, and verify the handoff status and Developer permissions change appropriately.

**Acceptance Scenarios**:

1. **Given** a Developer has a valid fix revision, **When** they submit it to QA, **Then** the report
   enters `awaiting_qa` and the selected revision is identified for testing.
2. **Given** a fix is awaiting QA, **When** the Developer views it, **Then** the submitted revision
   is visible but cannot be silently changed without creating a new revision or following the
   defined revision flow.
3. **Given** a Developer has not provided the required investigation information or corrected
   code, **When** they attempt to submit to QA, **Then** submission is blocked with a clear reason.
4. **Given** a Developer submits a fix, **When** a user attempts to approve or reject it through
   this Developer feature, **Then** the action is unavailable because QA decisions belong to the
   separate QA feature.

---

### User Story 5 - Revise a QA-rejected fix (Priority: P2)

As a Developer, I want to see QA feedback and submit a new revision after rejection so that I can
correct the issue without losing the history of failed attempts.

**Why this priority**: Real debugging is iterative; rejection must return actionable work to the
Developer rather than ending the workflow or overwriting evidence.

**Independent Test**: Have QA reject a submitted fix with feedback, verify the Developer can see the
feedback, submit a new revision, and resubmit it while the rejected revision remains available.

**Acceptance Scenarios**:

1. **Given** the QA feature rejects a submitted fix with feedback, **When** the assigned Developer
   opens the report, **Then** the rejection reason and affected revision are visible.
2. **Given** a fix has been rejected, **When** the assigned Developer submits a revision, **Then**
   the revision is linked to the rejected attempt and the report returns to `in_progress`.
3. **Given** a previous fix was rejected, **When** the Developer views revision history, **Then**
   the rejected code, QA feedback, timestamps, and authorship remain visible to permitted users.
4. **Given** a fix is approved, **When** the Developer attempts to revise it through the normal
   rejection flow, **Then** the request is blocked unless a separately defined reopening action exists.

### Edge Cases

- A report is unassigned, reassigned, or deleted while a Developer has the detail page open.
- Two requests attempt to create a revision at the same time.
- A stale detail page submits an older revision after a newer revision already exists.
- Investigation notes contain instructions attempting to change application behavior.
- Code contains secrets, malicious text, or content intended to influence an AI assistant.
- The Developer loses access while saving notes or submitting a fix.
- QA feedback is missing, blank, or exceeds the supported length.
- The code comparison receives an empty or malformed revision.
- A user refreshes after a successful submission and must not accidentally resubmit it.
- The service or database is unavailable during a save or handoff.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST authenticate the user before showing Developer workflow data.
- **FR-002**: The system MUST show a Developer only reports currently assigned to that Developer.
- **FR-003**: The system MUST show the original report code, error message, expected behavior, actual
  behavior, and reproduction steps to an authorized Developer.
- **FR-004**: The system MUST allow an authorized Developer to create and update investigation
  notes for an assigned bug.
- **FR-005**: The system MUST validate investigation notes and reject invalid input with a useful
  message.
- **FR-006**: The system MUST preserve the original reporter code as immutable data.
- **FR-007**: The system MUST allow an authorized Developer to submit corrected Python code as a
  new revision linked to the bug and submitting Developer.
- **FR-008**: The system MUST preserve every submitted revision, including revisions that are
  rejected by QA.
- **FR-009**: The system MUST provide a comparison view between the original code and any selected
  corrected revision.
- **FR-010**: The system MUST distinguish additions, removals, and unchanged sections in the code
  comparison without executing either version.
- **FR-011**: The system MUST prevent a Developer from modifying or deleting the original code.
- **FR-012**: The system MUST validate code presence, supported language, and configured size limits
  before storing a revision.
- **FR-013**: The system MUST use the shared lifecycle states `open`, `in_progress`, `awaiting_qa`,
  and `closed`, with a QA rejection returning a report from `awaiting_qa` to `in_progress`.
- **FR-014**: The system MUST allow an authorized Developer to submit a valid revision to QA.
- **FR-015**: The system MUST prevent a Developer from approving their own fix or editing QA results.
- **FR-016**: The system MUST provide a QA handoff record containing the selected revision, current
  handoff status, submitting Developer, and submission time for the separate QA feature.
- **FR-017**: The system MUST make QA feedback available to the assigned Developer when a separate
  QA feature records a rejection, and associate that feedback with the relevant revision.
- **FR-018**: The system MUST allow a rejected fix to be revised as a new revision without removing
  the rejected revision or its feedback.
- **FR-019**: The system MUST enforce access control on every data-changing operation, not only on
  visible interface controls.
- **FR-020**: The system MUST deny access without disclosing protected bug content when a user is
  unauthenticated, unassigned, or otherwise unauthorized.
- **FR-021**: The system MUST treat all bug content, code, error messages, reproduction steps,
  notes, and future AI suggestions as untrusted data rather than executable instructions.
- **FR-022**: The system MUST NOT automatically execute user-submitted or generated Python code.
- **FR-023**: The system MUST provide clear loading, empty, validation-error, permission-denied,
  service-error, and success states for the workflow screens and actions.
- **FR-024**: The system MUST record authorship and timestamps for investigation notes, revisions,
  QA decisions, and status transitions.

### Key Entities

- **Bug Report**: A reporter-submitted programming problem containing original Python code, error
  details, expected and actual behavior, reproduction steps, assignment, and lifecycle status.
- **Investigation Note**: A time-stamped explanation written by an assigned Developer about the
  suspected cause, evidence, and next action for a bug.
- **Code Revision**: An immutable Developer-submitted correction linked to a bug, its author,
  predecessor when applicable, status, and submission time.
- **QA Handoff**: A Developer-created handoff for a specific code revision, including the selected
  revision, handoff status, submitting Developer, and submission time. A later QA feature may add
  approval, rejection, feedback, reviewer, and decision time.
- **Workflow Event**: An auditable transition or action that records what changed, who performed
  it, and when it occurred.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In usability testing, a Developer can identify an assigned bug and open its complete
  investigation view within 60 seconds.
- **SC-002**: 100% of tested unauthorized access attempts fail without revealing protected bug,
  note, revision, or QA data.
- **SC-003**: 100% of accepted fix submissions preserve the original code and all earlier revisions
  unchanged.
- **SC-004**: In testing, a Developer can submit a valid fix to QA in five or fewer user actions
  after opening the relevant revision.
- **SC-005**: 100% of QA rejections tested return the feedback to the assigned Developer and allow
  a new revision without deleting the rejected attempt.
- **SC-006**: 100% of submitted or generated code tested by the workflow remains unexecuted by the
  application.
- **SC-007**: At least 90% of the Developer workflow acceptance scenarios pass in automated tests
  before the feature is considered ready for integration.

## Assumptions

- The MVP supports Python snippets only, with the shared starting limits of 20,000 characters for
  the snippet and 2,000 characters for each other report text field.
- Authentication and role information are provided by the existing application foundation.
- A bug has at most one current assigned Developer for the MVP; reassignment rules can be expanded
  later.
- QA Tester functionality is represented only by the handoff boundary and status data in this
  feature; the full QA interface and QA decisions are delivered separately.
- The MVP compares text revisions and does not execute code or run tests in an untrusted runtime.
- The Developer AI feature will use the shared limits of at most 8,000 characters of relevant code
  and 4,000 characters of other context per request, with provider quotas verified before enabling
  live AI.
- Normal web application expectations apply for response time and availability; detailed targets
  will be set during planning if the existing project requires them.

## Out of Scope

- Automatic execution of submitted Python code.
- Automatic deployment of a Developer fix.
- Full QA review screens, test-case management, QA approval/rejection actions, and AI Unit Test
  Generator implementation.
- AI Debugging Assistant implementation; it is tracked as Jordan's separate T08 task and will be
  specified after the non-AI workflow is stable.
- Multi-developer collaboration on the same bug beyond assignment and audit history.
- Support for programming languages other than Python.
