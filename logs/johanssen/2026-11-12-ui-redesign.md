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
