# Tasks: AI Code Improvement

**Input**: Design documents from `/specs/006-developer-code-improvement/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/developer-code-improvement.md`, and `checklists/security.md`

## Phase 1: Setup and evidence

- [X] T001 Record the implementation scope, acceptance scenarios, and presentation evidence targets in `docs/developer-agentic-se/`.
- [X] T002 Add the feature request and selected-specialist context to `workflow/requests/006-code-improvement-task.json`.
- [X] T003 Add the implementation handoff and verification expectations to `workflow/evidence/006-code-improvement-handoff.json`.

## Phase 2: Foundational shared AI work

- [X] T004 Review the existing AI gateway, prompt builder, server action, usage logging, and relevant security skills; record the reuse decisions in `specs/006-developer-code-improvement/research.md`.
- [X] T005 Add the code-improvement feature key, categories, output shape, and bounded prompt-context rules to `src/lib/ai/prompt.ts`.
- [X] T006 Define request validation and safe error behavior at the existing server-action boundary in `src/app/ai/actions.ts`.
- [X] T007 Add shared action fixtures for assigned, unauthorized, malformed, oversized, and provider-failure cases in `src/app/ai/actions.test.ts`.

## Phase 3: User Story 1 - Request an improvement review (P1)

- [X] T008 Add server-side tests for the current Developer role, assigned report, stale assignment, unassigned report, and non-Developer denial cases in `src/app/ai/actions.test.ts`.
- [X] T009 Add prompt-context tests proving only the relevant Python code, bug context, and explicit rules are sent to the model in `src/lib/ai/prompt.test.ts`.
- [X] T010 Add UI behavior tests for loading, successful review, safe error, and advisory-only presentation in `src/app/developer/[reportId]/ai-code-improvement.test.tsx`.
- [X] T011 Implement the server action for the bounded AI Code Improvement request in `src/app/ai/actions.ts`.
- [X] T012 Implement the Developer-facing advisory panel in `src/app/developer/[reportId]/ai-code-improvement.tsx`.
- [X] T013 Integrate the panel into `src/app/developer/[reportId]/page.tsx` without changing bug workflow state or revision data.

## Phase 4: User Story 2 - Understand and control suggestions (P1)

- [X] T014 Add structured-output parsing and malformed-output tests in `src/lib/ai/code-improvement.test.ts`.
- [X] T015 Add rendering tests for category, rationale, benefit, tradeoff, and optional illustrative code in `src/app/developer/[reportId]/ai-code-improvement.test.tsx`.
- [X] T016 Add prompt rules that require explanations, tradeoffs, and advisory labeling to `src/lib/ai/prompt.ts`.
- [X] T017 Normalize gateway responses into the bounded display contract in `src/lib/ai/code-improvement.ts`.

## Phase 5: User Story 3 - Safe failures and resource controls (P1)

- [X] T018 Add adversarial prompt-injection, boundary-marker, oversized-input, and unsafe-code-display tests in `src/lib/ai/code-improvement.security.test.ts`.
- [X] T019 Add unauthorized, stale-assignment, quota, timeout, provider-failure, malformed-response, and no-mutation tests in `src/app/ai/actions.security.test.ts`.
- [X] T020 Run or update the database/RLS regression test in `supabase/tests/bug_lifecycle.test.sql` to confirm the new feature preserves protected data access rules.
- [X] T021 Confirm the feature uses shared input, output, timeout, retry, and quota limits in `src/lib/ai/gateway.ts` and `src/app/ai/actions.ts`.
- [X] T022 Confirm the feature records privacy-preserving usage metadata and makes no revision, note, status, assignment, or code-execution calls in `src/app/ai/actions.ts`.

## Phase 6: Review, verification, and documentation

- [X] T023 Run the AI security review using `workflow/developer/skills/ai-security-review/SKILL.md` and resolve findings.
- [X] T024 Run the developer feature review using `workflow/developer/skills/developer-feature-implementation/SKILL.md` and resolve findings.
- [X] T025 Run the verification review using `workflow/developer/skills/verification-review/SKILL.md` and resolve findings.
- [X] T026 Update `docs/DeveloperGuide.md`, `docs/UserGuide.md`, and the relevant `docs/developer-agentic-se/` evidence file to describe verified behavior.
- [X] T027 Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` from the repository root.
- [X] T028 Run the repository CI-equivalent workflow checks and database tests when applicable.
- [X] T029 Complete the manual scenarios in `specs/006-developer-code-improvement/quickstart.md` and record evidence.

## Dependencies and implementation order

- Setup tasks T001-T003 precede all implementation work.
- Foundational tasks T004-T007 precede the user stories.
- T008-T013 deliver the minimum end-to-end request flow.
- T014-T017 add structured, explainable suggestions and depend on the first flow.
- T018-T022 harden the feature and must pass before review tasks.
- T023-T029 are final review, verification, documentation, and evidence tasks.

## Parallel work opportunities

- T008, T009, and T010 can be developed in parallel after T004-T007.
- T014 and T015 can be developed in parallel after T011-T013.
- T018 and T019 can be developed in parallel after the feature flow exists.
