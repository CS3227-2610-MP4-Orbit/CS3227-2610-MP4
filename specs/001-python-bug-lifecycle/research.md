# Research and decisions

## Existing stack

**Decision**: Retain Next.js 16, React 19, TypeScript, Supabase Auth/PostgreSQL/RLS, Zod, Vitest, GitHub Actions, and Vercel. **Rationale**: Already configured in `package.json`, `src/lib/supabase/`, and `.github/workflows/`; avoids a stack migration during the assignment. **Alternative**: Rebuild on another stack, rejected for time and duplicated setup.

## Server boundaries

**Decision**: Use Server Actions for forms, checking auth and authorization in every action, and RLS for database access. **Rationale**: Local Next.js 16 guides `node_modules/next/dist/docs/01-app/02-guides/forms.md` and `authentication.md` require authorization inside each action; Proxy is not a full authorization mechanism. **Alternative**: Proxy-only checks, rejected as insufficient.

## Legacy data

**Decision**: Add the new bug domain in a new migration and leave the existing HackHub tables untouched until remote data status is known. **Rationale**: A GitHub remote exists and remote database contents could not be verified; an additive migration is reversible and avoids accidental data loss. **Alternative**: Rewrite the initial migration, rejected until the team confirms every target environment is disposable. Legacy tables remain unused by the new app and must be reviewed before release.

## AI provider

**Decision**: Keep endpoint, model, key, timeout and quota settings server-side; call the required SoC LLM through one gateway. **Rationale**: `.env.example` already reserves SoC LLM fields and the assignment requires that provider. The official service guide was inaccessible during planning, so exact model names, URL shape, rate limits and usage response cannot be verified. **Alternative**: Hard-code guessed limits or use another provider, rejected. Live enablement requires team verification of service documentation and a real smoke test.

## Assignment and role defaults

**Decision**: One role per account; reports are assigned to a Developer and QA Tester through a controlled team process. **Rationale**: The approved source spec left assignment open and this default prevents arbitrary cross-report access. **Alternative**: Open queues, rejected for MVP privacy and authorization simplicity. The team may amend this decision before implementation.
