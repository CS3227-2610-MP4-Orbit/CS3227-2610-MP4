# Feature Specification: Check Report Quality

**Feature Branch**: `feature-AI-code-review`

**Created**: 2026-11-09

**Status**: Team approved (reported by the user on 2026-11-09)

**Approval record**: The user confirmed that the team approved this feature specification, the shared AI feature identifier, and the release checks. This records the user's confirmation; no separate meeting record was provided.

**Input**: User description: "Add a Reporter ‘Check my report’ AI feature on the New Report form. It reviews the unsent draft and suggests ways to improve clarity, reproduction steps, and expected versus actual behavior. It must not edit or submit the report automatically. Use the existing AI gateway and Reporter permissions."

## Clarifications

### Session 2026-11-09

- Q: Which draft fields should “Check my report” send for review? → A: All six report fields: title, Python code, error message, expected behavior, actual behavior, and reproduction steps.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Improve a draft before submission (Priority: P1)

A signed-in Reporter writing a new bug report can request a quality check before submitting. The Reporter sees specific suggestions about unclear wording, missing reproduction details, and whether expected and actual behavior are distinguishable. The Reporter decides whether to change the draft.

**Why this priority**: A clearer report helps the assigned Developer reproduce and investigate the problem, while leaving the Reporter in control of what is submitted.

**Independent Test**: Enter a partly complete draft, request a check, review the suggestions, and confirm the draft and report list are unchanged until Submit report is chosen.

**Acceptance Scenarios**:

1. **Given** a signed-in Reporter has entered a draft with vague reproduction steps, **When** they select Check my report, **Then** they see a clearly labeled suggestion that identifies what information to add or clarify.
2. **Given** a draft has different expected and actual behavior, **When** the Reporter requests a check, **Then** the suggestion assesses those fields without replacing their text.
3. **Given** a suggestion is displayed, **When** the Reporter edits the draft, **Then** the edited fields remain under their control and the report is submitted only if they separately choose Submit report.

---

### User Story 2 - Recover from an unavailable check (Priority: P2)

A Reporter can continue preparing and submitting a report when the quality check is unavailable or refuses the request.

**Why this priority**: Optional assistance must not block the core bug-reporting workflow.

**Independent Test**: Simulate an unavailable or limited AI service and confirm the Reporter sees a plain-language message, retains the draft, and can submit through the normal form.

**Acceptance Scenarios**:

1. **Given** the quality check is unavailable or over its request limit, **When** the Reporter requests it, **Then** a safe explanation appears and all draft fields remain intact.
2. **Given** a previous suggestion is visible, **When** a later check fails, **Then** the previous suggestion remains visible and the failure is clearly stated.

### Edge Cases

- A draft with all fields blank does not use an AI request and instead asks the Reporter to enter report details.
- A partially complete draft can be checked; missing fields may be identified as suggestions, while the normal submission rules still apply.
- A draft over the allowed input size receives a clear refusal without silently dropping text or clearing fields.
- Suggestions based on an earlier draft may become stale after the Reporter edits fields; the interface must make clear that a new check is needed.
- Code, comments, and report text may contain instructions aimed at the AI; they remain untrusted report content.
- A person with another role, no session, or a forged request cannot obtain the Reporter check.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The New Report form MUST offer a separate Check my report action to signed-in Reporters before submission.
- **FR-002**: The check MUST assess the current unsent draft for clarity, reproducible steps, and clear expected versus actual behavior; it MAY identify missing information rather than invent it.
- **FR-003**: The check MUST accept a partially complete draft but MUST refuse an entirely blank draft without consuming an AI request.
- **FR-004**: Suggestions MUST be labeled as AI generated, shown as plain text under the relevant report field names, and presented for the Reporter to review. They MUST NOT edit form fields, create a report, change report status, or run submitted code.
- **FR-005**: Only a signed-in Reporter MUST be able to request the check. A forged or cross-role request MUST be refused before report content is sent for analysis.
- **FR-006**: The check MUST send the current draft's six report fields—title, Python code, error message, expected behavior, actual behavior, and reproduction steps—for analysis, subject to input bounds. It MUST NOT send unrelated records or secrets. Draft content, suggestions, and full prompts MUST NOT be stored in usage records or application logs by this feature.
- **FR-007**: The check MUST respect the product's existing input and output bounds, request limits, timeout, and safe failure behavior. Oversized or unavailable requests MUST leave the draft intact.
- **FR-008**: A failed repeat request MUST leave the last successful suggestion visible while stating that the latest check failed.
- **FR-009**: After the Reporter changes a draft that was checked, the interface MUST indicate that the displayed suggestion reflects an earlier version until another check succeeds.
- **FR-010**: Submission MUST remain a distinct user action and follow the existing required-field validation, whether or not a quality check was requested.

### Key Entities

- **Report draft**: The unsent title, Python code, error, expected behavior, actual behavior, and reproduction steps currently entered by the Reporter. It exists in the form and is not a submitted bug report.
- **Quality suggestion**: A temporary, plain-text assessment of one version of the draft, with no authority to edit or submit it.
- **Usage record**: A count and outcome of a quality-check request for enforcing limits, without draft text or suggestion content.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a usability check with at least five draft reports containing an unclear or missing reproduction detail, at least four checks point out an actionable clarification without inventing missing facts.
- **SC-002**: In all acceptance tests, requesting a check alone creates zero bug reports and changes zero draft fields.
- **SC-003**: In all tested failure cases, the Reporter can still submit a valid draft through the normal submission action without re-entering fields.
- **SC-004**: In a usability check with at least five Reporters, at least four can identify that the suggestion is optional and know which action submits the report without guidance.
- **SC-005**: Every tested request from an unauthenticated person or a non-Reporter role is refused before draft content is analyzed.

## Assumptions

- The existing Reporter account and New Report form remain the entry point; this feature does not add checks to edits of already submitted reports.
- The existing product AI service and its request limits are available for reuse. The specification does not change the existing explanation feature on submitted reports.
- Suggestions are temporary in the current form session and are not included in the submitted report unless the Reporter manually copies or rewrites them.
- A quality check is optional; Reporters may submit valid reports without requesting one.
- Field-grouped plain-text suggestions are the default presentation choice; the user proceeded to planning before choosing among display formats.
