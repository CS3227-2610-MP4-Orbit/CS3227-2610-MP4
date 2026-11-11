# Implementation Plan: AI Code Improvement

**Branch**: `developer-ai-code` | **Date**: 2026-11-11 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `$speckit-plan` command; its definition describes the execution workflow.

## Summary

Add a second, advisory-only Developer AI capability that reviews assigned Python code and
returns categorized improvement suggestions. Reuse the existing server-only AI gateway and
session/RLS context loading. Do not create a new revision or database table.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript, Next.js 16.4.2, React 19.3, Node 24

**Primary Dependencies**: Existing AI gateway, Supabase SSR client, Zod, React server actions

**Storage**: Existing server-only `ai_usage` records; no improvement-result persistence

**Testing**: Vitest, lint, TypeScript typecheck, build, and focused AI security tests

**Target Platform**: Next.js web application deployed through the existing Vercel workflow

**Project Type**: Server-rendered web application with server actions

**Performance Goals**: Respect the existing 20-second AI timeout and shared per-user/app limits;
  refused requests must fail before provider use.

**Constraints**: Advisory-only output; no code execution, automatic patching, workflow mutation,
  prompt/response storage, or unauthorized report context.

**Scale/Scope**: One feature for assigned Developer reports, Python snippets up to the existing
  bounded context limits, with one improvement review request at a time per user/feature.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

PASS. The design follows Spec-Driven Development, uses the existing coordinated workflow,
keeps code and AI output inert, enforces server-side role/assignment authorization, uses bounded
context and resource limits, and records usage without storing prompts or responses. No new
constitution exception is required.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file ($speckit-plan command output)
├── research.md          # Phase 0 output ($speckit-plan command)
├── data-model.md        # Phase 1 output ($speckit-plan command)
├── quickstart.md        # Phase 1 output ($speckit-plan command)
├── contracts/           # Phase 1 output ($speckit-plan command)
└── tasks.md             # Phase 2 output ($speckit-tasks command - NOT created by $speckit-plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
src/
├── app/ai/
│   ├── actions.ts                 # Existing server actions; add a separate improvement action
│   └── actions.test.ts            # Action authorization and safe-error tests
├── app/developer/[reportId]/
│   ├── ai-code-improvement.tsx    # Advisory UI
│   └── page.tsx                   # Integrate the feature without mutation controls
└── lib/ai/
    ├── prompt.ts                  # Feature key, bounded context and output parsing
    ├── gateway.ts                 # Existing shared limits and provider boundary
    └── gateway.test.ts             # Prompt, injection, quota and failure tests

specs/006-developer-code-improvement/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── checklists/
```

**Structure Decision**: Extend the existing Developer AI action and shared gateway. Keep the
feature UI beside the existing Developer AI advisor and keep prompt/gateway behavior in the
shared AI library. No second backend or new persistence layer is introduced.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
