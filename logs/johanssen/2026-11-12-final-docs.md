# 2026-11-12: final submission docs, dev E2E run and EXP001

Owner: Johannsen. Tool: Claude Code (Opus 5.5 main session, plus four review subagents for the experiment). Issues #14, #18, #19 and #20. Task request: `workflow/requests/DOC001-final-docs-task.json`. The router planned a single agent ("single-agent simple task").

## Prompts

- "okay what else have we not done?" The audit found 5 open issues, all documentation or evidence.
- "do it all up for me please"

## What was done

- **README:** replaced the stale "not implemented" text with the links to both apps, the website, the guides, Reflections and the logs; the features per role; the team; local setup; and deployment.
- **User Guide, Reporter section:** added the reports list, the status meanings, submitting, editing, the AI explanation and following the fix, using the exact labels from the code.
  - The E2E run then caught one wrong sentence: Reporters do not see investigation notes, only the submission note on each fix. Corrected.
- **Product website:** `website/index.html` with screenshots of the dev app, published by `.github/workflows/pages.yml`.
- **Dev E2E (#20):** `workflow/scripts/e2e_lifecycle.mjs` covers the full lifecycle with every role's AI features, through the UI only. It passed 35/35 on https://hackhub-orbit-dev.vercel.app after 7 attempts; see `workflow/evidence/E2E-dev-2026-11-12.md`.
  - **Defect found:** an AI answer can be lost when the page refreshes during the call. The `ai_usage` table shows the call succeeded and counted against the quota while the panel showed nothing. Recorded as a follow-up, not fixed.
- **Fix:** the Reporter's comparison showed "Developer account <uuid>" because Reporters can't read Developer names. It now says "the Developer". Test updated.
- **EXP001:** four parallel reviewer subagents (Haiku, Sonnet and Opus with a focused bundle, and Sonnet with the full repository) reviewed the pre-#37 syntax check.
  - All four found the missing Python binary as their top finding once told the deploy target.
  - The full-repository arm used 2.77× the input.
  - The Agent tool's token summary (93–101k) undercounted the transcript totals (164–454k), so the transcript numbers are used.
- **Reflections:** every prompt answered, from the usage files, `runs.jsonl`, EXP001 and the app's `ai_usage` table. Unmeasured work is marked as unmeasured.
- **Developer Guide:** the stale paragraph about "legacy starter" workflows now describes CI, deploy, Pages, the usage collectors and the E2E script.

## Checks

- `npm run lint`, `npm run typecheck`: clean.
- Vitest: 151/151, with no `PYTHON_BIN` needed.
- `check_workflow.py`: valid.
- Dev E2E: 35/35.

## Usage

`workflow/evidence/usage/DOC001-final-docs.usage.json`: 87 responses, 89 tool calls, 15.28M input tokens (96.8% cached), 76.1k output tokens (17.9k thinking). The start time was taken from the transcript timestamp of the request, because `start` was not run before the work began.
