# Implementation Plan: Developer Bug Workflow

**Branch**: `branch-developer-agent` | **Date**: 2026-11-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-developer-bug-workflow/spec.md`

## Summary

Implement Jordan's Developer-owned slice of the Python bug-resolution workflow. The feature will
let an assigned Developer start work, read the report, record investigation notes, submit
immutable fix revisions, compare original and revised code, and hand the latest revision to QA.
The existing bug-lifecycle migration already provides the core tables, RLS, and security-definer
functions; implementation should use those contracts and add only missing application routes,
server actions, UI states, and focused tests.

## Technical Context

**Language/Version**: TypeScript 5, Next.js 16.4.2, React 19.3, Node 24

**Primary Dependencies**: Next.js App Router, Supabase SSR client, Supabase JS client, Zod, Tailwind CSS

**Storage**: Supabase PostgreSQL with RLS; existing bug-lifecycle migration

**Testing**: Vitest for application tests; pgTAP/Supabase tests for RLS and lifecycle behavior;
lint, typecheck, and production build

**Target Platform**: Deployed Next.js web application with separate development and production
Supabase/Vercel environments

**Project Type**: Next.js web application with server actions/server components and Supabase data

**Performance Goals**: A Developer dashboard should show its assigned report list within normal web
application expectations; no unverified latency claim is introduced by this feature

**Constraints**: Enforce existing 20,000-character code and 5,000-character report/note limits;
never execute submitted code; preserve RLS and security-definer lifecycle boundaries; do not add
AI calls in this non-AI feature slice

**Scale/Scope**: One authenticated Developer workflow for assigned reports; one current Developer
assignment per report; QA UI and Developer AI are separate features

## Constitution Check

*GATE: PASS*

- **Spec-first**: `spec.md` defines user stories, permissions, lifecycle, security, edge cases,
  and measurable acceptance criteria.
- **Role boundaries**: Server actions and database policies must restrict access to assigned
  Developers; original code and revision history remain protected.
- **Security**: Submitted code remains inert text; no execution or automatic patch application;
  security review is required for auth, database, and lifecycle changes.
- **Context/resource discipline**: This feature sends no LLM request. Future AI work must use a
  separate task and the shared bounded-context policy.
- **Verification**: Implementation must map acceptance criteria to unit/database/RLS tests and run
  the repository checks before handoff.
- **Coordination**: Work is routed through the workflow roles; the generator owns disjoint files,
  the security reviewer checks access boundaries, and the verifier checks evidence.

## Project Structure

### Documentation (this feature)

```text
specs/001-developer-bug-workflow/
├── plan.md              # This file
├── research.md          # Phase 0 decisions
├── data-model.md        # Existing schema used by the feature
├── quickstart.md        # Validation guide
├── contracts/           # Developer workflow contract
└── tasks.md             # Generated later by $speckit-tasks
```

### Source Code (repository root)

```text
src/
├── app/
│   └── developer/
│       ├── page.tsx                 # assigned-report dashboard
│       ├── loading.tsx              # dashboard loading state
│       ├── error.tsx                # dashboard error boundary
│       └── [reportId]/
│           ├── page.tsx              # report detail and revision history
│           ├── loading.tsx           # detail loading state
│           └── actions.ts            # server actions for start/notes/fix handoff
└── lib/
    └── developer/                    # only if shared query/validation logic is justified

supabase/
├── migrations/                       # only if the approved schema is insufficient
└── tests/
    └── bug_lifecycle.test.sql        # extend only for uncovered Developer behavior

workflow/
├── templates/                        # task and handoff formats
├── agents/                           # specialist prompts and role boundaries
└── evidence/                         # real handoffs and verification evidence
```

**Structure Decision**: Use the existing Next.js App Router and Supabase structure. Keep
Developer UI and server actions colocated under `src/app/developer/`; use the existing lifecycle
RPCs for state-changing operations; keep database/RLS tests in `supabase/tests/`. Add no second
backend or duplicate repository/service layer unless a concrete shared boundary requires it.

## Complexity Tracking

No constitution violations are expected. The design stays within the existing web application,
database, and workflow structure.
