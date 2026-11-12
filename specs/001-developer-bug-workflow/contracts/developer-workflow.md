# Developer Workflow Contract

This contract describes the user-visible and server-side boundaries that the implementation must
honor. It is not a public REST API contract; it is the shared interface between the Developer UI,
server actions, Supabase lifecycle functions, and the later QA feature.

## Read: assigned report list

Input: authenticated Developer session.

Output per report:

- report identifier
- title
- status
- created/updated time
- assignment information needed by the Developer

The result MUST contain only reports assigned to the authenticated Developer.

## Read: report detail

Input: report identifier and authenticated Developer session.

Output:

- original report fields needed for investigation
- investigation notes visible under the existing participant policy
- revision history visible under the existing participant policy
- relevant QA rejection feedback, if present
- current lifecycle status

Unauthorized or unassigned requests MUST not disclose whether protected content exists.

## Mutation: start work

Input: report identifier.

Preconditions:

- authenticated user is the assigned Developer
- report status is `open`

Effect: transition `open` → `in_progress` and record a status event.

## Mutation: add investigation note

Input: report identifier and note body.

Preconditions:

- authenticated user is the assigned Developer
- report status is `open` or `in_progress`
- note body satisfies the configured size and non-empty constraints

Effect: append an attributed note with a database-generated timestamp.

## Mutation: edit investigation note

Input: note identifier and replacement note body.

Preconditions:

- authenticated user is the note author and assigned Developer
- report status is `open` or `in_progress`
- replacement body satisfies the configured size and non-empty constraints

Effect: update only the note body and database-generated `updated_at`. The author and
`created_at` values remain unchanged.

## Mutation: submit fix

Input: report identifier, corrected Python code, and optional submission note.

Preconditions:

- authenticated user is the assigned Developer
- report status is `in_progress`
- assigned Developer has recorded investigation notes for the report
- code and note satisfy configured limits

Effect: create the next immutable revision and transition `in_progress` → `awaiting_qa`.

## Handoff: QA

The Developer feature exposes the selected latest revision and `awaiting_qa` state to the later QA
feature. It MUST NOT provide QA approval/rejection controls in this feature.

## Error behavior

- Validation errors identify the invalid input without echoing unsafe content unnecessarily.
- Authorization failures do not reveal protected records.
- Lifecycle conflicts return a recoverable message and do not create partial history.
- Provider/AI errors are out of scope for this non-AI workflow.
