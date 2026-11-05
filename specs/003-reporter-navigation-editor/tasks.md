# Tasks: Reporter Navigation and Python Editor

**Input**: [spec.md](spec.md), [plan.md](plan.md), [contracts/ui.md](contracts/ui.md)

## Phase 1: Setup

- [x] T001 Confirm Next.js 16 client/server and hydration guidance in `node_modules/next/dist/docs/` and baseline routes in `src/app/`
- [x] T002 Add CodeMirror and Python language dependencies to `package.json` and `package-lock.json`

## Phase 2: Foundational

- [x] T003 Keep `python_code` as one successful field and preserve the no-JavaScript fallback in `src/app/reports/report-form.tsx`

## Phase 3: User Story 1 — Reporter navigation (P1)

**Independent test**: Three existing route links work, active route is indicated; detail section links reach both sections with a keyboard.

- [x] T004 [US1] Build shared responsive route navigation and active state in `src/app/reporter-nav.tsx` and `src/app/globals.css`
- [x] T005 [US1] Integrate navigation in `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/reports/page.tsx`, `src/app/reports/new/page.tsx`, and `src/app/reports/[id]/page.tsx`
- [x] T006 [US1] Add Details and Feedback section links in `src/app/reports/[id]/page.tsx`
- [x] T007 [US1] Add focused active-route/navigation checks in `src/app/reporter-nav.test.tsx`

## Phase 4: User Story 2 — Python editor (P1)

**Independent test**: Multiline indented Python is editable with highlighting and line numbers, submitted exactly once, and retained after errors.

- [x] T008 [P] [US2] Add editor synchronization and fallback checks in `src/app/reports/python-editor.test.tsx`
- [x] T009 [US2] Build Python-aware editor with accessible textarea fallback in `src/app/reports/python-editor.tsx`
- [x] T010 [US2] Integrate editor and error state into `src/app/reports/report-form.tsx`

## Phase 5: Review and evidence

- [x] T011 Run unit, lint, typecheck, build, and browser smoke where possible; record outcomes in `workflow/evidence/F003-reporter-ui-handoff.json`
- [ ] T012 Complete independent review and verification, release claim, member log, and post-turn usage record under `workflow/`

## Dependencies

T001–T003 establish constraints. T004–T007 and T008–T010 can proceed in disjoint files except shared layout/form integration; one generator owns each file. Review and verification follow implementation. User Story 1 alone is the navigation MVP; User Story 2 adds code editing value.

## Completion note (2026-11-05)

T001–T011 are implemented or checked with recorded limits. Unit tests: 13 pass; lint/typecheck/whitespace pass. Generator reported optimized build pass; independent verifier build failed due Turbopack process/port permission, so build remains unverified. Browser UI, hydrated editor, keyboard and narrow-width smoke remain unverified because no browser surface was available. Code-review accessibility blocker was fixed and rechecked. T012 remains open for post-turn token finish and run recording.
