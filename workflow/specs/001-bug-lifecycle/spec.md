# Spec 001: Python bug resolution lifecycle

Status: team approved on 2026-11-04. Role ownership was confirmed afterward; the remaining implementation decisions are listed below.

## Goal and scope

Three authenticated roles collaborate on Python snippet bugs: Reporter submits and clarifies; Developer investigates and submits revisions; QA records test cases and approves or returns a fix. User-supplied code is displayed and compared as text, never executed by the application. MVP includes one LLM feature per role and a complete resolution loop.

## Stories and acceptance criteria

1. **Reporter:** Create a report with title, Python code, error message, expected and actual behavior, and reproduction steps. Edit own report while it is open, see its status and feedback, and compare submitted and proposed code. Invalid or oversized fields fail validation without losing entered text.
2. **Developer:** See assigned reports, add investigation notes, submit a versioned corrected snippet for QA, and revise after rejection. Every revision preserves author, timestamp and prior code.
3. **QA:** See fixes awaiting verification, compare versions, record test cases with expected and actual results, and approve or reject with feedback. Approval closes the report; rejection returns it to the Developer. Decision history remains visible to authorized participants.
4. **Authorization:** Every server mutation checks the signed-in role and record relationship. Database RLS enforces the same access rules. A user cannot read or modify another report by changing a URL or request body.
5. **AI:** Reporter can request a code explanation or bug identification; Developer can request debugging advice; QA can request suggested pytest tests or edge cases. MVP may implement only one per role. AI outputs are suggestions, labeled as such, never applied or executed automatically.
6. **Security and resource limits:** Server sends the minimum relevant report fields, treats code/comments/error text as untrusted data, bounds input/output size, rate-limits requests, handles SoC LLM errors, and stores usage without logging secrets or full prompts. Tests cover injection attempts, authorization, quota exhaustion, malformed model output and provider failure.

## Lifecycle

`open → in_progress → awaiting_qa → closed` on approval; `awaiting_qa → in_progress` on rejection. Record each transition with actor and timestamp. Define assignment policy before implementation.

## Shared design decisions to resolve

- Confirmed owners: Joseph — Reporter; Jordan — Developer; Johannsen — QA tester.
- Decide account provisioning and whether a person may hold multiple roles.
- Decide developer/QA assignment and who can access unassigned reports.
- Starting application limits: title 120 characters; Python snippet 20,000 characters; each other report, note, and feedback text field 5,000 characters. Send at most 8,000 characters of relevant code and 4,000 characters of other context per AI request; cap model output at 700 tokens. Allow a burst of up to five requests per user per minute and 50 per day, subject to the SoC service's actual quota.
- Use the SoC service's default supported chat model, configured through `SOCLAAS_MODEL` when credentials are issued. Keep endpoint and credentials server-side. Verify the provider's exact model ID and limits before enabling live AI.

## Out of scope for MVP

Running submitted code, arbitrary repository imports, automated patch application, and AI decisions that close a report.
