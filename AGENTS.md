<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project workflow

This repository contains the development workflow and an approved spec for a three-role Python bug resolution product. For feature work, read `workflow/README.md`, the relevant numbered spec, and its tasks before editing. Do not present planned product behavior as implemented.

Use `$agent-coordination` and the task request under `workflow/templates/` when a task benefits from distinct ownership or independent review. The orchestrator records assignments and integrates handoffs. Explorers are read-only; generators own disjoint files; security review is required for auth, database access and AI boundaries; verification follows changes. Follow `workflow/agents/roles.md` and `workflow/agents/coordination.md`. Do not invent usage metrics or test outcomes. Summarize meaningful AI-assisted work in the appropriate member folder under `logs/`.
