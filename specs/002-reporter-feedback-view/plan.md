# Implementation Plan: Reporter Feedback View

**Branch**: `bug-reporter-creation-UI` | **Date**: 2026-11-05 | **Spec**: [spec.md](spec.md)

**Input**: Reporter Feedback View specification and the approved Spec 001 reporter story.

## Summary

Add a secure, read-only feedback timeline to the existing Reporter report detail. A small append-only feedback relation holds attributable Developer/QA entries, but this slice provides no role-specific writer. The Reporter sees real stored entries or an honest empty state. A separate safe error state appears on read failure.

## Technical Context

**Language/Version**: TypeScript 5, Next.js 16.4.2, React 19.3; PostgreSQL SQL.

**Primary Dependencies**: `@supabase/ssr`, `@supabase/supabase-js`, React; no new package.

**Storage**: Supabase PostgreSQL; follow-on migration creates `public.bug_feedback`.

**Testing**: pgTAP for grants/RLS/ownership/read-only access; Vitest server-rendered feedback component for ordering/empty/error/inert text; signed-in local smoke with trusted fixtures.

**Target Platform**: Existing browser and Next.js server with local and hosted Supabase.

**Project Type**: Server-rendered web app.

**Performance Goals**: Fetch only feedback for the already-authorized report and use a report/time index. No unmeasured latency promise.

**Constraints**: User code and feedback remain inert text; no app-level feedback writer in this slice; no secret key in Reporter UI; no unrelated report fields sent to feedback query; Next.js 16 request-time access remains inside Suspense.

**Scale/Scope**: One feedback timeline on one Reporter-owned report; entries bounded to 2,000 characters each. Developer/QA authoring and complete lifecycle history remain separate tasks.

## Constitution Check

*GATE: reviewed before research and after design.*

| Principle | Design evidence | Gate |
| --- | --- | --- |
| I. Spec-driven | This spec defines read-side stories, FRs, SCs and clarification; tasks trace to them | Pass for this slice |
| II. Specialized agents | Coordination task will assign generator, independent code/security review, and verifier | Planned; verify in handoff |
| III. Security | Read-only client grants, owner/role RLS, server relationship check, inert rendering and pgTAP | Pass for design; tests required |
| IV. Context/resource | Bounded task context and token start/finish capture; no fabricated savings | Pass for design; measurements pending |
| V. Delivery | Existing Next/Supabase app, follow-on migration and no new deployment path | Pass for design; deployment not claimed |

**Shared interface decision**: `bug_feedback` is a provisional read-side contract for this slice. The team must review how Developer investigation notes and QA decisions create or map to these entries before their writers integrate. No dependent writer is implemented here.

## Project Structure

### Documentation (this feature)

```text
specs/002-reporter-feedback-view/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/feedback.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
src/app/reports/[id]/page.tsx
src/app/reports/[id]/feedback-section.tsx
src/app/reports/[id]/feedback-section.test.tsx
supabase/migrations/20261105000200_reporter_feedback.sql
supabase/tests/reporter_feedback.test.sql
```

**Structure Decision**: Extend the existing report detail after its role/owner check. Keep the presentation component pure for isolated tests and the table read-only to browser roles.

## Complexity Tracking

No constitution exception is proposed. The provisional shared read contract must be reconciled with Developer/QA writer design before those roles implement against it.
