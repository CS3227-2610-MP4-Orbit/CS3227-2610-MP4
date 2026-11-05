# Coordination protocol

## Trigger and ownership

1. Orchestrator reads the current spec and tasks, identifies a bounded goal, names one owner for each changed file or interface, and claims those paths on `workflow/assignments.json` with `agent_workflow.py claim`.
2. Use Explorer only for a narrow unknown. It returns file references and does not edit.
3. Use Generator for a defined implementation task. Shared schema and API contracts are agreed before role-specific changes.
4. For auth, RLS, AI prompt handling, quotas, secrets or deployment, request an independent Security reviewer. A Code reviewer and Security reviewer can inspect the completed generator artifact in parallel because neither depends on the other's findings.
5. Verifier checks the implementation against acceptance criteria, both review handoffs and actual test output after the reviews. Orchestrator resolves disagreements and owns integration.

Do not invoke every role automatically. Do not delegate further without the orchestrator assigning a distinct task. If an agent is blocked, return a handoff promptly rather than silently consuming retries. For sequential work, the next agent receives a compact handoff plus specific files, not the full transcript.

## Context and resource contract

Put stable role and security instructions first, then coding standards, then the task-specific request and retrieved excerpts. Keep that prefix stable for possible prompt caching; never claim a cache hit without provider counters. `workflow/scripts/agent_workflow.py context` packs only specified line ranges and labels them as untrusted data. The orchestrator MAY retrieve another narrow range when a finding requires it, recording the reason in task memory. Do not include `.env` files, secrets, full transcripts, or unrelated code.

`workflow/config.json` sets output, iteration, tool-call and retry ceilings per role. `plan` chooses lightweight or strong *tiers*, not actual model IDs; the team maps tiers to available models for the current environment. A retry is for a transient failure or newly supplied evidence, not repeated analysis of unchanged context. If a budget is exceeded, stop and hand back a blocker with the required next input. Keep the main orchestrator available to the user while independent reviewers work.

## Handoff contract

Create a task-specific JSON document based on `workflow/templates/handoff.json` under `workflow/evidence/` when work crosses agents. Include goal, owner, status, spec path, bounded context paths, decisions, findings with evidence, acceptance criteria, artifacts, verification and remaining work. The next owner acknowledges unresolved assumptions. Run `python3 workflow/scripts/check_workflow.py` before merging.

For work that spans sessions, keep a compact `workflow/templates/task-memory.md` copy with the current goal, decisions, findings and remaining work. The handoff JSON is the agent-to-agent contract; the task memory is the human-readable resume note. Record actual per-run metrics with `agent_workflow.py record`; `agent_workflow.py export` produces a table for reflection analysis.

## Conflict and completion

Conflicting findings are recorded with evidence and resolved by the orchestrator against the spec and tests. A task is complete only when its owner supplies an artifact, verifier records pass/fail evidence, and security findings are resolved or explicitly accepted by the team. The orchestrator releases the file claim after completion or stopping work. Log factual coordination and measured resource use in the member's session summary.
