# Developer guide

## Current state

The repository is a HackHub starter being transitioned to the planned Python bug resolution product. The Reporter, Developer and QA lifecycle, SoC LLM integration and their security tests are **not implemented**. The authoritative draft requirements and task breakdown are in `workflow/specs/001-bug-lifecycle/`.

## Planned design

Three authenticated roles share reports, revision history, test cases, decisions and audit events. Server-side authorization and database RLS must agree. A single AI gateway will handle SoC LLM calls, bounded context, validation, rate limits, timeouts, usage records and safe rendering. User code remains inert text. These are design targets, not claims about current code.

## Development process

Start at `workflow/README.md`. `workflow/agents/roles.md` and `workflow/agents/coordination.md` define agent ownership and handoffs; `workflow/templates/` holds the JSON handoff and log format; `workflow/scripts/check_workflow.py` checks handoff structure and spec references; `workflow/experiments.md` defines measurements. The existing `.github/workflows/` contains CI and deployment automation for the legacy starter and must be reviewed when the domain migration is implemented. Development and production must use separate configuration and data.

## Acknowledgements

The project requirements and three-role feature plan came from the team's supplied assignment text. The agent roles and resource-aware ideas were adapted from the supplied workflow PDF. The repository already contained a Next.js/Supabase/Vercel HackHub starter; its origin and any reused code must be cited by the team before release. GitHub Spec Kit is an optional toolkit; installation instructions are in `workflow/SpecKit.md`.
