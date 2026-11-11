# Data Model: AI Code Improvement

This feature does not add a product table. It uses existing entities and keeps the AI response
ephemeral.

## Existing entities used

### `bug_reports`

The assigned Developer's original Python code and relevant behavior fields provide the primary
review context. Access remains limited by the existing signed-in session and assignment RLS.

### `investigation_notes`

Recent notes may provide investigation context. Notes are read only through the existing
participant policy; the improvement request does not edit them.

### `ai_usage`

The server records feature, user, report reference, model, outcome, latency, retry and available
token metrics through the existing gateway. Full prompts and full responses are not stored.

## Ephemeral value objects

### Improvement request

- `feature`: the distinct Developer code-improvement feature key
- `user_id`: derived from the authenticated session
- `report_id`: validated report identifier
- `role`: current `developer` role
- `context`: bounded code and relevant report context

### Improvement suggestion

- `category`: readability, maintainability, performance, SRP, or DRY
- `suggestion`: advisory improvement direction
- `rationale`: why the change may help
- `tradeoff`: behavior, complexity, or performance risk where relevant
- `example`: optional illustrative code, always inert text

The response is not a `fix_revision`, does not alter a report, and is not retained as product
history.

## Invariants

- Only the assigned current Developer can create a request.
- The report must be read through the signed-in user session.
- Code and report text are bounded and treated as untrusted data.
- AI output cannot execute or mutate application state.
- Usage accounting is server-only and does not retain full prompt/response content.
