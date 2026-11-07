# Implementation Plan: Reporter Fix Comparison

**Branch**: `bug-reporter-code-diff` | **Date**: 2026-11-06 | **Spec**: [spec.md](spec.md)

## Summary

Read existing `fix_revisions` only after the Reporter detail page verifies role and ownership. Show a client-side revision selector and side-by-side line comparison against the report's original `code`, with revision author/time/note. An explicit empty state remains until a real revision exists. A clearly labeled fixed sample preview is available only in development for UI inspection; it is never stored or shown in production.

## Technical Context

**Language/Version**: Next.js 16.4.2, React 19.3, TypeScript 5; PostgreSQL 17 pgTAP.  
**Dependencies**: Existing Supabase SSR; `diff` (jsdiff) for `diffLines` with fixed character/line/edit limits and a text fallback; no new database table.  
**Storage**: Existing `public.bug_reports` and `public.fix_revisions` from the shared lifecycle migration.  
**Testing**: Vitest rendering/line-diff/revision selection tests, pgTAP direct role/owner read checks, lint/typecheck/build, optional signed-in browser smoke.  
**Security**: Server role and report owner check precede revision query; `fix_revisions` RLS uses role-aware participant relation; all code/note displayed as React text; no client mutation or execution.  
**Performance**: Fetch only one report's revisions; bound line-diff computation and show a text-only fallback for pathological inputs.

## Constitution Check

- Spec, clarification, plan and tasks precede code; acceptance criteria trace to the Reporter comparison story.
- One generator owns the UI/query/test files; independent code/security review and verifier follow.
- Shared schema is reused rather than changed. The Developer handoff records the exact read columns and RLS expectation.
- Task context is bounded; token capture starts before agents. Missing provider counters remain null and cache savings are not inferred.
- No deployment or real Developer submission is claimed for this slice.

## Project Structure

- `src/app/reports/[id]/page.tsx`: owner-gated revision query and comparison integration.
- `src/app/reports/[id]/comparison.tsx`: pure client selection/presentation and sample preview.
- `src/lib/reports/line-diff.ts`: bounded line comparison and fallback model.
- `src/app/reports/[id]/comparison.test.tsx`, `src/lib/reports/line-diff.test.ts`: behavior and inert rendering.
- `supabase/tests/reporter_comparison.test.sql`: direct read matrix with trusted fixtures.
- `package.json`, `package-lock.json`: jsdiff dependency.

## Design gate

`fix_revisions` is already immutable and has `(id, report_id, revision_number, author_id, code, note, created_at)`. `profiles.full_name` is optional display metadata. The UI must keep sample entries physically separate from actual fetched revisions. No role-specific writer is added.
