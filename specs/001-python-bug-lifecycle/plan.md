# Implementation Plan: Python Bug Resolution Lifecycle

**Branch**: `001-python-bug-lifecycle` | **Date**: 2026-11-04 | **Spec**: [spec.md](spec.md)

**Input**: Team-approved lifecycle specification, translated to `spec.md`.

## Summary

Retain the Next.js/Supabase stack, build a three-role Python bug lifecycle, and provide one bounded SoC LLM assistance feature per role. Use authenticated server actions and database RLS for defense in depth. Keep user code inert. The shared AI gateway is configurable; official service limits and credentials must be verified before live release.

### Reporter list/edit increment (2026-11-05)

The submission slice already uses `src/app/reports/new/`, `src/lib/reports/validation.ts`, and `supabase/migrations/20261104000100_bug_reports.sql`. Extend that schema through a new migration: Reporter-only, owner-only SELECT and UPDATE policies; UPDATE granted only for the six editable content columns; the UPDATE policy requires the row to remain `open`. Do not rewrite the applied migration. Add `/reports` for an owner-scoped, newest-first list and `/reports/[id]` for protected detail/edit. Both server rendering and the edit action check the signed-in role and relationship; the action derives ownership from the session and validates the UUID and six fields. Normalize browser textarea CRLF to LF for Python code at form extraction so an unchanged save retains the same stored snippet. Keep request-time Supabase auth work inside a Suspense boundary to satisfy Next.js 16 Cache Components. Test owner access, cross-owner denial, role denial, closed-report denial, and malformed/oversized input in pgTAP and unit checks. The later lifecycle design remains planned; this increment does not implement fix comparison or QA feedback.

### Reporter schema integration (2026-11-05)

The earlier paragraph records the original standalone Reporter implementation. After integrating `develop`, the canonical database schema is `20261104000000_bug_lifecycle.sql`: `bug_reports.code` stores Python source and `profiles.role` uses `app_role`. The two standalone Reporter table/edit migrations were removed from this branch because they duplicated that schema and blocked fresh CI migration. The Reporter form retains its `python_code` field but maps it to `code` in server actions and aliases `code` on detail reads. `20261105000300_reporter_role_access.sql` preserves role-aware reads and open-only Reporter edits. Existing local databases with the old standalone migration history require a separate backup and data-preserving migration plan before applying the merged lifecycle migration; this CI fix does not reset them.

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
