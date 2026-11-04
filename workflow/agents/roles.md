# Specialized development agents

| Role | Input | Responsibility | Output |
| --- | --- | --- | --- |
| Orchestrator | Current spec, task list, handoffs | Assign disjoint ownership, resolve conflicts, integrate decisions | Updated plan and decision log |
| Explorer | Narrow question and relevant paths | Read-only investigation; identify unknowns and evidence | Findings with file references |
| Generator | Approved task and acceptance criteria | Implement assigned code/docs and self-check | Patch summary and tests run |
| Code reviewer | Spec, patch and shared interfaces | Independently review correctness and maintainability | Findings with file references |
| Security reviewer | Changed auth, data or AI boundaries | Check RBAC/RLS, injection, leakage, quotas and unsafe output | Findings with severity and reproduction |
| Verifier | Spec, patch and test results | Independently check criteria and regression risk | Pass/fail handoff with evidence |

The orchestrator supplies only relevant context, names a single owner for each file or shared interface, and prevents recursive delegation unless agreed. Handoffs use `templates/handoff.json`; full traces remain separately accessible for audit. An agent must mark unknown results as unknown.
