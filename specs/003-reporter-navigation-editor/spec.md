# Feature Specification: Reporter Navigation and Python Editor

**Feature Branch**: `003-reporter-navigation-editor`  
**Created**: 2026-11-05  
**Status**: Ready for implementation  
**Input**: Improve the Reporter UI with navigation tabs and Python code typing support.

## Clarifications

### Session 2026-11-05

- The request names tabs and Python typing support. Based on the existing routes, tabs mean persistent navigation between Home, My reports, and New report, plus clear sections on report detail. The code field should behave like a Python editor while retaining the existing form and security contract.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navigate Reporter work (Priority: P1)

A signed-in Reporter moves between Home, My reports, and New report using consistent navigation. On report detail, they can switch between report contents and feedback.

**Independent Test**: Visit each Reporter route and verify the corresponding tab is active, keyboard focus is visible, and the detail tabs reveal the intended section. A narrow viewport keeps navigation usable.

**Acceptance Scenarios**:

1. Given a Reporter on an existing route, when they choose a navigation tab, then they reach the correct route and the active location is identified.
2. Given a Reporter on report detail, when they choose Details or Feedback, then the relevant section is keyboard reachable and accessible.
3. Given a signed-out user, when they open a protected route, then the existing authentication redirect remains in force.

### User Story 2 - Type and revise Python code comfortably (Priority: P1)

A Reporter types or pastes Python into the submission or edit form with syntax color, line numbers, Tab indentation, and normal editor undo/redo. Their exact edited text is submitted through existing validation and restored after a validation error.

**Independent Test**: Type a multiline indented snippet, save it, reopen edit, and verify its text and line breaks. Trigger another field's validation error and confirm the code remains. Keyboard-only entry works.

**Acceptance Scenarios**:

1. Given the code field, when the Reporter types Python, then keywords/strings/comments are distinguished and line numbers and indentation controls are available.
2. Given a validation error, when the form rerenders, then entered code is still present and editable.
3. Given an unchanged existing snippet, when it is saved, then its LF-normalized content is unchanged.
4. Given a client that has not hydrated yet, the code field remains a usable form control.

### Edge Cases

- Long snippets up to the existing 20,000-character limit remain usable; oversized snippets are rejected by existing validation.
- Editor text is never executed or sent to an external service by this UI change.
- Code is submitted exactly once through the existing `python_code` field, including after hydration or a server action error.
- Disabled JavaScript retains a plain editable code field and navigation links.

## Requirements *(mandatory)*

- **FR-001**: Reporter pages MUST expose consistent, accessible Home, My reports, and New report navigation with an active state.
- **FR-002**: Report detail MUST provide clear navigation to Details and Feedback while retaining existing ownership/role checks.
- **FR-003**: Create and edit forms MUST provide Python-aware editing with syntax highlighting, line numbers, and indentation/undo behavior.
- **FR-004**: The editor MUST submit its current text under `python_code` to existing validation, retain text after errors, and preserve existing LF normalization.
- **FR-005**: The code field MUST remain usable before client hydration; user code MUST remain inert text and never run.

## Success Criteria *(mandatory)*

- **SC-001**: Each of the three Reporter routes is reachable by a visible navigation link and indicates its active state in a browser check.
- **SC-002**: A keyboard-only tester can enter and save an indented multiline Python snippet in both create and edit flows.
- **SC-003**: Existing form validation and unchanged-code regression tests continue to pass; a new editor test covers code persistence after rerender.
- **SC-004**: Report detail remains role/owner protected, and feedback is reachable through the new section navigation.

## Assumptions

- This is UI work for existing Reporter routes. Developer and QA dashboards are separate work.
- Existing server actions and database schema remain the source of truth; the editor adds no execution or AI behavior.
- A third-party Python editor package may be used if available; a robust plain-text fallback is required.
