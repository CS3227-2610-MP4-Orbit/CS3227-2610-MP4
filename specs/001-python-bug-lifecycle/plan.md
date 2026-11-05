# Implementation Plan: Python Bug Resolution Lifecycle

**Branch**: `001-python-bug-lifecycle` | **Date**: 2026-11-04 | **Spec**: [spec.md](spec.md)

**Input**: Team-approved lifecycle specification, translated to `spec.md`.

## Summary

Retain the Next.js/Supabase stack, build a three-role Python bug lifecycle, and provide one bounded SoC LLM assistance feature per role. Use authenticated server actions and database RLS for defense in depth. Keep user code inert. The shared AI gateway is configurable; official service limits and credentials must be verified before live release.

## Technical Context

**Language/Version**: TypeScript 5, Next.js 16.4.2, React 19.3; SQL for PostgreSQL.

**Primary Dependencies**: `@supabase/ssr`, `@supabase/supabase-js`, Zod 4, Tailwind CSS 4.

**Storage**: Supabase PostgreSQL with migrations, RLS, and Auth; no executable code storage path.

**Testing**: Vitest for validation and AI gateway; Supabase pgTAP for RLS and lifecycle; manual end-to-end role acceptance run.

**Target Platform**: Browser and Node.js server on the team's GitHub Actions to Vercel pipeline.

**Project Type**: Server-rendered web app with server actions and a server-only AI gateway.

**Performance Goals**: Manual report workflow works without AI; AI timeout is bounded by configuration. Do not assert unmeasured latency targets.

**Constraints**: SoC LLM only for product AI; server-side credentials; no snippet execution; separate dev/prod projects; Next local docs must be consulted for changed APIs.

**Scale/Scope**: Three roles, Python text snippets, one AI feature per role, one report-to-closure loop.

## Constitution Check

*GATE: reviewed before research and after design.*

| Principle | Design evidence | Gate |
| --- | --- | --- |
| I. Spec-driven | Approved source spec and numbered FR/SC/US acceptance in this feature | Pass |
| II. Specialized agents | `workflow/agents/coordination.md`, bounded research handoff, task ownership and verification evidence | Pass for design; implementation evidence pending |
| III. Security | RLS plus action checks, inert code, AI injection/failure tests planned | Pass for design; tests pending |
| IV. Context/resource | Minimal per-role context, gateway limits, usage metrics and explicit unknown provider values | Pass for design; live configuration pending |
| V. Delivery | CI, separate dev/prod automation and guides are planned | Pass for design; release pending |

## Project Structure

### Documentation (this feature)

```text
specs/001-python-bug-lifecycle/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md
```

### Source Code (repository root)

```text
src/app/
├── login/
├── reports/
│   ├── actions.ts
│   ├── page.tsx
│   └── [id]/page.tsx
├── ai/actions.ts
└── page.tsx
src/lib/
├── auth.ts
├── reports/validation.ts
├── ai/gateway.ts
└── supabase/
supabase/migrations/
supabase/tests/
```

**Structure Decision**: One Next.js app with shared server-side validation and AI gateway. Reports are protected at action and query boundaries. The existing Supabase clients and CI/deploy workflow are adapted, not duplicated. The first product migration will create the bug-domain schema.

## Complexity Tracking

No constitution violations are proposed. The provider's exact API contract and limits remain an external release prerequisite; implementation uses bounded configuration without claiming live compatibility.
