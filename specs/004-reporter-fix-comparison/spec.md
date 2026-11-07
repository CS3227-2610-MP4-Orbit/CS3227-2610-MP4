# Feature Specification: Reporter Fix Comparison

**Feature Branch**: `bug-reporter-code-diff`  
**Created**: 2026-11-06  
**Status**: Ready for bounded Reporter implementation  
**Input**: Reporter views original Python code versus versioned Developer proposed fixes. Developer submission and QA decisions are outside this slice.

## Clarifications

### Session 2026-11-06

- User explicitly approved building the Reporter comparison first and assuming agreement on the revision read contract.
- User approved a hardcoded sample response to inspect the UI. The sample is development-only, visibly labeled, and never stored as a real revision or feedback entry.
- The existing shared `public.fix_revisions` relation is the agreed read contract; no new revision storage or writer is needed here.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Compare original and proposed Python (Priority: P1)

An owning Reporter opens a report and compares its original code with the latest proposed fix side by side. Added and removed lines are visually marked while code stays inert text. The revision number, author, time, and optional Developer note identify the proposal.

**Independent Test**: Insert a trusted revision fixture for an owned report, open its detail as that Reporter, and verify both code panes, changed-line markings, and revision metadata. No Developer writing screen is required.

**Acceptance Scenarios**:

1. Given an owned report with a revision, when its Reporter opens detail, then original and proposed code appear side by side, with added/removed lines identified and the latest revision selected.
2. Given multiple revisions, when the Reporter selects an earlier version, then the proposed pane, diff and metadata update to that version while the original pane stays the same.
3. Given a closed report, when its Reporter opens detail, then available revisions remain readable.
4. Given long code up to the existing 20,000-character limit, when compared, then the UI remains usable and does not execute the snippet.

### User Story 2 - Honest empty and safe preview (Priority: P1)

A report without revisions shows a clear waiting state. In local development, the Reporter can inspect a clearly labeled sample comparison without implying the Developer submitted anything.

**Independent Test**: An owned report with no revisions shows the waiting state. In development only, activate sample preview and verify it is labeled and uses fixed sample code/note; production never exposes that fixture.

**Acceptance Scenarios**:

1. Given no revision, when the Reporter views comparison, then it says no proposed fix exists yet.
2. Given local development and no revision, when the Reporter opens sample preview, then the example is labeled as sample data and is never inserted into storage.
3. Given a revision load failure, when the Reporter views comparison, then a safe error appears rather than the empty or sample state.

### User Story 3 - Enforce Reporter ownership (Priority: P1)

A Reporter cannot read another Reporter's revision by changing the URL or querying the revision relation directly. Non-Reporters cannot use this Reporter view.

**Independent Test**: A second Reporter and a non-Reporter attempt direct reads of the first Reporter's report and revision; both are denied by route checks and RLS.

**Acceptance Scenarios**:

1. Given a foreign report and revision, when a Reporter changes the URL or direct query, then no report or revision content is revealed.
2. Given code or note containing markup/instructions, when shown, then it is escaped and not executed.

### Edge Cases

- The default is the highest `revision_number`, independent of creation timestamp ties.
- Missing/malformed report IDs reveal no code or revision metadata.
- A revision belongs to exactly one report; the page queries only the already-authorized report ID.
- Long or pathological diff input has a bounded computation path; an explicit fallback still shows both inert code blocks if diff calculation cannot complete.
- Preview data never appears on a production page, in a database row, or in a feedback history item.

## Requirements *(mandatory)*

- **FR-001**: The Reporter detail MUST read only the already-authorized report's revisions and show latest revision by default, including version, author and timestamp.
- **FR-002**: The Reporter MUST be able to select among revisions; changed lines MUST be distinguished in an accessible side-by-side comparison.
- **FR-003**: No revisions MUST produce an explicit empty state; load failure MUST produce a distinct safe error.
- **FR-004**: A development-only sample preview MUST be clearly labeled and separate from actual revisions and feedback.
- **FR-005**: Code and note MUST render as inert text and never execute or call an external service.
- **FR-006**: Server and RLS authorization MUST deny foreign Reporter and wrong-role revision reads; this slice MUST NOT add revision submission or QA decisions.

## Key Entities

- **Bug Report**: Existing owner-scoped report with original `code` and lifecycle `status`.
- **Fix Revision**: Existing immutable `fix_revisions` row with `id`, `report_id`, `revision_number`, `author_id`, `code`, `note`, `created_at`.
- **Sample Preview**: Fixed, local-only UI fixture; not a database entity.

## Success Criteria *(mandatory)*

- **SC-001**: In a local fixture test, the owning Reporter sees original and latest proposed code with changed lines and can select an earlier revision.
- **SC-002**: Every case in the Reporter/foreign Reporter/non-Reporter direct-read matrix is denied as specified.
- **SC-003**: Empty, load-error, closed-report, markup, and long-code cases have passing automated or recorded manual checks.
- **SC-004**: Production output contains no sample proposal or sample Developer note.

## Assumptions

- The shared `fix_revisions` schema from Spec 001 is authoritative; this slice only reads it.
- Developer authoring/assignment and QA decision implementation are separate teammate work.
- The original code is the report's current stored `code`; editing remains allowed only while the report is open under existing rules.
