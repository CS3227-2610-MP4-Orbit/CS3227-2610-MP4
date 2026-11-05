# Developer guide

## Current state

The repository is a minimal Next.js/Supabase starter for the planned Python bug resolution product. The Reporter, Developer and QA lifecycle, SoC LLM integration and their security tests are **not implemented**. The requirements and task breakdown are in `workflow/specs/001-bug-lifecycle/`.

## Planned design

Three authenticated roles share reports, revision history, test cases, decisions and audit events. Server-side authorization and database RLS must agree. A single AI gateway will handle SoC LLM calls, bounded context, validation, rate limits, timeouts, usage records and safe rendering. User code remains inert text. These are design targets, not claims about current code.

## Development process

Start at `workflow/README.md`. `.agents/skills/agent-coordination` and `agent-handoff` provide reusable Codex instructions. `workflow/config.json` defines role budgets; `workflow/agents/prompts/` defines specialist boundaries; `workflow/scripts/agent_workflow.py` plans routes, packs bounded context, records real usage and exports a CSV table. `workflow/templates/` holds task, handoff, memory and log formats; `workflow/scripts/check_workflow.py` validates structure and evidence; `workflow/experiments.md` defines comparisons. The existing `.github/workflows/` contains CI and deployment automation for the legacy starter and must be reviewed when the domain migration is implemented. Development and production must use separate configuration and data.

## Acknowledgements

The project requirements and three-role feature plan came from the team's supplied assignment text. The agent roles and resource-aware ideas were adapted from the supplied workflow PDF. The repository already contained a Next.js/Supabase/Vercel starter; its origin and any reused code must be cited by the team before release. GitHub Spec Kit is an optional toolkit; installation instructions are in `workflow/SpecKit.md`.
