# Research: AI Code Improvement

## Decision 1: Reuse the existing AI gateway

**Decision**: Add a distinct `developer_code_improvement` feature to the existing gateway and
usage-accounting boundary.

**Rationale**: The gateway already enforces role ownership, bounded context, timeout/retry,
quota, safe errors, and usage recording. Reusing it avoids a second provider path and keeps the
security behavior consistent with the existing Developer debugging advisor.

**Alternatives considered**: A separate provider client was rejected because it would duplicate
resource limits and increase the chance of inconsistent security handling.

## Decision 2: Advisory structured text, not automatic patches

**Decision**: Return labelled suggestions with category, rationale, benefit/trade-off, and an
optional illustrative snippet. The Developer manually applies accepted changes through the normal
fix-revision workflow.

**Rationale**: The project constitution prohibits unsafe automatic code execution or mutation, and
refactoring can change behavior even when it improves style or performance.

**Alternatives considered**: Automatic patch application and a persistent suggestion table were
rejected for the MVP because they would create a new mutation and audit boundary.

## Decision 3: Minimum relevant context

**Decision**: Send the assigned report's bounded Python code plus only the error/behavior,
reproduction, and recent investigation-note context needed for improvement reasoning.

**Rationale**: Context engineering reduces exposure of unrelated report data and keeps requests
within the existing resource limits. All report content remains untrusted data inside explicit
prompt boundaries.

**Alternatives considered**: Sending the entire report history and all revisions was rejected as
unnecessary context and increased leakage/resource risk.

## Decision 4: No new database entity

**Decision**: Store only usage metadata through the existing `ai_usage` mechanism; do not persist
the improvement response as a revision or product record.

**Rationale**: Suggestions are ephemeral advice and must not be confused with a Developer fix.

**Alternatives considered**: Persisting suggestions was deferred until a separate audit/history
requirement exists.
