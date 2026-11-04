# Task plan for Spec 001

Status legend: TODO, BLOCKED, DONE. Assign named owners at the team kickoff.

| ID | Status | Suggested owner | Task | Dependency | Evidence required |
| --- | --- | --- | --- | --- | --- |
| T01 | TODO | Team | Settle role ownership, assignment, limits and SoC LLM decisions | None | Recorded decisions in spec |
| T02 | TODO | Team/shared | Replace HackHub domain schema with reports, assignments, revisions, tests, decisions and audit trail | T01 | Migration and RLS tests |
| T03 | TODO | Reporter owner | Report creation/edit/list/detail and status/feedback | T02 | UI and authorization tests |
| T04 | TODO | Developer owner | Assignment, investigation, versioned fixes and diff | T02 | Lifecycle tests |
| T05 | TODO | QA owner | Test cases, approval/rejection and history | T02 | Lifecycle tests |
| T06 | TODO | Team/shared | SoC LLM gateway, validation, quotas, timeouts, usage accounting and safe output rendering | T01, T02 | Unit and failure tests |
| T07 | TODO | Reporter owner | Reporter AI feature using gateway | T03, T06 | Acceptance and injection tests |
| T08 | TODO | Developer owner | Developer AI feature using gateway | T04, T06 | Acceptance and injection tests |
| T09 | TODO | QA owner | QA AI feature using gateway | T05, T06 | Acceptance and injection tests |
| T10 | TODO | Team/shared | CI, dev/prod deployment, product website, guides, reflection experiments and logs | T03–T09 | Release checklist and live smoke test |

Each owner contributes a review or test to shared tasks. A task moves to DONE only when its acceptance evidence is linked in a PR or handoff.
