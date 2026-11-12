# Implementation Plan: Reporter Navigation and Python Editor

**Branch**: `bug-reporter-creation-UI` | **Date**: 2026-11-05 | **Spec**: [spec.md](spec.md)

## Summary

Add a reusable responsive Reporter navigation with active route state; add in-page detail/feedback tabs; replace the raw code textarea with a progressively enhanced CodeMirror Python editor while preserving the real textarea for form submission and non-JavaScript fallback.

## Technical Context

**Language/Version**: Next.js 16.4.2, React 19.3, TypeScript 5, Tailwind 4.  
**Dependencies**: Existing Supabase SSR/auth; CodeMirror 6 and `@codemirror/lang-python` for Python language support.  
**Storage**: Existing report schema, no migration.  
**Testing**: UI component tests and existing form/validation unit tests; lint/typecheck/build and browser smoke if environment permits.  
**Constraint**: No code execution; existing server actions and role/owner checks unchanged. The textarea retains `name=python_code` and is the submitted source of truth.  
**Navigation**: Home, My reports, New report route links with `aria-current`; detail links to Details/Feedback anchors or tabs with accessible semantics. Keep responsive and keyboard navigable.

## Constitution Check

- Spec precedes code; this plan and tasks trace to FR-001–005.
- Reusable navigation/editor files have one generator owner and independent verification.
- No new server operation, database policy, AI call, or user code execution. Existing authorization remains.
- Bounded context and actual token usage are recorded. No resource savings inferred from cache rate alone.
- No deployment claim until the team reviews and tests the build.

## Project Structure

- `src/app/layout.tsx`, `src/app/globals.css`: shared shell styling.
- `src/app/reporter-nav.tsx`: active route links.
- `src/app/page.tsx`, `src/app/reports/page.tsx`, `src/app/reports/new/page.tsx`, `src/app/reports/[id]/page.tsx`: integrate navigation and detail sections.
- `src/app/reports/report-form.tsx`, `src/app/reports/python-editor.tsx`: form and progressive editor.
- `src/app/reports/python-editor.test.tsx`, `src/app/reporter-nav.test.tsx`: focused behavior checks.
- `package.json`, `package-lock.json`: editor dependencies.

## Design gate

CodeMirror's official guide describes `basicSetup` as including line numbers, history, indentation and key bindings; `@codemirror/lang-python` provides Python highlighting. The generator must verify the editor does not create a second submitted value and that server action error updates reach the editor. See [research.md](research.md) and [quickstart.md](quickstart.md).
