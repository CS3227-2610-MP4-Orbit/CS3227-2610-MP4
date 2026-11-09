# Feature 005 AI boundary review

Reviewed on 2026-11-09 against `specs/005-check-report-quality/spec.md`. This is an independent source review; it does not claim a live provider or browser test.

## Finding

- **Low, UI role visibility:** `src/app/reports/new/page.tsx` checks for a signed-in user but passes `qualityCheck` to `ReportForm` for every role. A Developer or QA user can therefore see the Check my report control, although `checkReportQuality` refuses their request before `runAiFeature`. FR-001 limits the offered control to signed-in Reporters. Pass the action only for a Reporter or redirect other roles. Server-side FR-005 enforcement is present.

## Boundary observations

- **Cross-role and anonymous requests:** `src/app/reports/new/check-quality.ts` calls `auth.getUser`, reads the authenticated user's profile role, and returns before parsing or calling the gateway unless the role is `reporter`. Its tests cover anonymous, Developer, and QA requests. The gateway also binds the feature to Reporter.
- **Forged fields:** `parseDraftForQualityCheck` reads only the six allowed names and refuses non-string values, per-field oversize, aggregate oversize, and an all-blank draft. The action ignores an injected `report_id` and passes `reportId: null`; the test checks both extra-field exclusion and zero `bug_reports` access.
- **Prompt injection:** The gateway puts draft fields inside a random boundary marker in a user message and declares them untrusted in the system message. The quality-check task explicitly says not to follow instructions in the draft. This reduces instruction-following risk; model behavior still needs actual evaluation.
- **Output:** `parseCompletion` accepts string content and caps it at 6,000 characters. `ReportForm` renders it as React text with `whitespace-pre-wrap`, not as HTML or executable code. The UI labels it an AI suggestion.
- **Quota and failures:** The existing gateway claims a usage row before the provider call, checks per-user and app limits, applies a 20-second timeout and bounded retry, and returns fixed safe messages. The new action catches unexpected errors and does not expose raw infrastructure details.
- **Data and writes:** The action passes only labeled draft fields to the gateway. The usage table stores feature, model, outcome and token counts, not prompt or response. The new action neither imports `createReport` nor accesses `bug_reports`; only the separate submit action writes a report. No draft logging appears in the new code.

## Remaining verification

The UI role visibility finding was resolved after review: `src/app/reports/new/page.tsx` now reads the authenticated profile role and redirects non-Reporters to `/reports` before rendering `ReportForm`. The server action still checks the role independently. Browser and live-provider behavior, including whether injection-like drafts yield appropriate suggestions, remain for integrated verification.
