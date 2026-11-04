# Coordination protocol

## Trigger and ownership

1. Orchestrator reads the current spec and tasks, identifies a bounded goal, and names one owner for each changed file or interface.
2. Use Explorer only for a narrow unknown. It returns file references and does not edit.
3. Use Generator for a defined implementation task. Shared schema and API contracts are agreed before role-specific changes.
4. For auth, RLS, AI prompt handling, quotas, secrets or deployment, request an independent Security reviewer. Independent code quality and security reviews can run together.
5. Verifier checks the implementation against acceptance criteria and actual test output after the change. Orchestrator resolves disagreements and owns integration.

Do not invoke every role automatically. Do not delegate further without the orchestrator assigning a distinct task. If an agent is blocked, return a handoff promptly rather than silently consuming retries. For sequential work, the next agent receives a compact handoff plus specific files, not the full transcript.

## Handoff contract

Create a task-specific JSON document based on `workflow/templates/handoff.json` under `workflow/evidence/` when work crosses agents. Include goal, owner, status, spec path, bounded context paths, decisions, findings with evidence, acceptance criteria, artifacts, verification and remaining work. The next owner acknowledges unresolved assumptions. Run `python3 workflow/scripts/check_workflow.py` before merging.

## Conflict and completion

Conflicting findings are recorded with evidence and resolved by the orchestrator against the spec and tests. A task is complete only when its owner supplies an artifact, verifier records pass/fail evidence, and security findings are resolved or explicitly accepted by the team. Log factual coordination and measured resource use in the member's session summary.
