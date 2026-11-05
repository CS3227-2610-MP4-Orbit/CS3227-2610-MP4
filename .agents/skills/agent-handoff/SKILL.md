---
name: agent-handoff
description: Prepare or review a compact, evidence-backed JSON handoff when one development agent or teammate passes a task to another. Use for task continuation and review, not for storing full transcripts.
---

# Agent handoff

Use `workflow/templates/handoff.json` and `workflow/agents/coordination.md`.

Record the task ID, goal, owner, status, spec, bounded context paths, decisions, findings with evidence, acceptance criteria, artifacts, verification, remaining work, and next owner. Distinguish observed facts from proposals and unknowns. Never copy secrets, raw private snippets, or a full transcript into the handoff.

Save real handoffs under `workflow/evidence/<task-id>-handoff.json`, then run `python3 workflow/scripts/check_workflow.py`. The receiving agent must acknowledge unresolved assumptions before continuing. A handoff is not proof of completion; the verifier must check the artifact and actual test result.
