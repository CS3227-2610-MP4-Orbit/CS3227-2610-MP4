# UI redesign with shadcn/ui (feat/ui)

I asked Claude Code to redesign every screen with shadcn/ui so BugFlow looks like a polished bug-tracking product, and to show before and after screenshots. Behaviour, data access and server actions are unchanged; this is presentation only.

**References.** It looked at how established tools lay out the same jobs: Linear's issue list and issue view (dense lists, consistent headers), Sentry's issue details page (information hierarchy, progressive disclosure), GitHub's split diff, the shadcn sidebar and dashboard blocks (inset sidebar, stat cards, data table), and the Testify bug-tracking dashboard on Dribbble that I shared (sidebar with a light content area).

**Design decisions.**
- Neutral, slightly cool chrome with an ink-black primary button. Colour is kept for meaning only: grey open, blue in progress, amber awaiting QA, green closed; green pass / red fail; violet for every AI feature. The brand gradient appears only on the logo.
- One shared set of components in `src/components/app/` (status badge and progress stepper, page header, stat cards, AI panel, code block, notices, empty states), so the three roles look like one product.
- A collapsible inset sidebar per workspace replaces the top bar. Sign-in is a full-screen split page.
- Every AI output stays labelled "not checked" or "not verified" in a violet panel, so it never looks like a recorded result or a human decision.

**Problems found while building.**
- Reading the URL in the root layout broke Next 16 prerendering on dynamic routes, so the sidebar moved into a layout per workspace (`reports`, `developer`, `qa`).
- The Developer pages already logged a "`Date.now()` while prerendering" error on develop; they now render inside Suspense after `connection()`, like the other pages.
- At phone width, the screen-reader-only text inside the fix comparison escaped its scroll box and made the whole page scroll sideways (also present before). The scroll box is now `relative`.
- Vitest had no `@/` alias, so tests could not import the new components; `vitest.config.ts` adds it.

**Verification.** `npm run lint`, `npm run typecheck` and `npm test` (117 tests) pass, `next build` succeeds, and every page was screenshotted signed in as each demo role at 1440px and 390px wide against local Supabase. No new AI calls were made, so there are no token figures for this task.

## Browser check before the PR
- Ran the full lifecycle through the UI on the local stack: submit, edit while open, start, note, fix, two QA tests, reject, re-fix, test, approve, then the Reporter's closed view and comparison. Also checked a wrong password, the 404s for other roles' pages, and sign-out. 30 of 31 checks passed.
- The run found nested `<main>` landmarks: shadcn's `SidebarInset` renders `<main>` and each page renders its own. `SidebarInset` is now a `<div>`.
- The one remaining error is React's dev-only Performance.measure "negative time stamp" on the 404 route. Production builds don't record it.
- pgTAP: 141/143 locally. Both failures count every profile and the local database also holds the demo accounts. CI runs them on an empty database.

## Merge with #33 and usage
- Merged develop after Jordan's #33. His AI code improvement advisor sits under the fix form, restyled with the shared AI panel. His logic and tests are unchanged. 132/132 tests pass.
- Fixed a phone hydration mismatch: the sidebar hydrates later inside Suspense, so it now reads the breakpoint itself rather than from context.
- Credits for shadcn/ui, Radix, Lucide, Geist and the design references were added to the Developer Guide acknowledgements.
- Usage: `workflow/evidence/usage/UI001-ui-redesign.usage.json`, 42.7M tokens (98% cached), 175 responses, 187 tool calls. `start` was not run when the task began, so the start file uses the timestamp of the request that started the UI task, taken from the session transcript. The window covers the redesign, the browser checks, the PRs and the merge.

## Release and the fix-submission bug
- Released develop to master (#36). Production Supabase had been paused for inactivity. After it was restored, the deploy applied all 8 migrations, deployed to Vercel and passed the site check. The six demo accounts were seeded on production with the password the User Guide publishes.
- The lifecycle test against production found that **no Developer could submit a fix**. `isValidPythonSyntax` spawned `python` for `ast.parse`, and Vercel's Node runtime has no Python binary, so every fix got "Corrected code must be valid Python syntax." Dev had the same problem since 7 Nov.
- Fix: the check now uses the Lezer Python grammar (already installed for the editor) in JavaScript. Compared with `ast.parse` on 39 snippets, it accepted all valid ones and missed 4 invalid ones (Python 2 `print`, an inconsistent dedent, `1 = x`, mixed tab/space indents). It is lenient in the safe direction: code is never run and QA tests every revision. The vitest suite no longer needs `PYTHON_BIN`.
