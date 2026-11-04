# Task plan for Spec 001

Status legend: TODO, BLOCKED, DONE. Role owners are confirmed; shared task ownership and remaining decisions still need agreement.

| ID | Status | Suggested owner | Task | Dependency | Evidence required |
| --- | --- | --- | --- | --- | --- |
| T03 | TODO | Joseph (Reporter) | Bug schema, report creation/edit/list/detail and status/feedback | None | Migration, UI and authorization tests |
| T04 | TODO | Jordan (Developer) | Assignment, investigation, versioned fixes and diff | T03 | Lifecycle tests |
| T05 | TODO | Johanssen (QA) | Test cases, approval/rejection and history | T04 | Lifecycle tests |
| T06 | TODO | Team/shared | SoC LLM gateway, validation, quotas, timeouts, usage accounting and safe output rendering | T03 | Unit and failure tests |
| T07 | TODO | Joseph (Reporter) | Reporter AI feature using gateway | T03, T06 | Acceptance and injection tests |
| T08 | TODO | Jordan (Developer) | Developer AI feature using gateway | T04, T06 | Acceptance and injection tests |
| T09 | TODO | Johanssen (QA) | QA AI feature using gateway | T05, T06 | Acceptance and injection tests |
| T10 | TODO | Team/shared | CI, dev/prod deployment, product website, guides, reflection experiments and logs | T03–T09 | Release checklist and live smoke test |

Each owner contributes a review or test to shared tasks. A task moves to DONE only when its acceptance evidence is linked in a PR or handoff.
