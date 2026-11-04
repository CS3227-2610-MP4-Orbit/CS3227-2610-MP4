# Project transition: AI-powered bug tracking

The team plan and initial spec are in [workflow/](workflow/README.md). The existing HackHub app, schema, deployment configuration and instructions below are **legacy starter code** and do not implement the planned Reporter / Developer / QA product. Do not deploy them as the new product. Start with `workflow/specs/001-bug-lifecycle/spec.md` and its task plan; resolve the shared decisions before replacing the schema and app. The workflow is initialized, while implementation and deployment remain pending.

## Legacy starter notes

# HackHub

CS3227 MP4 — a hackathon platform for participants, judges and organisers, with AI features
behind a rate-limited, cached LLM gateway.

## Environments

| Branch    | Supabase project | Vercel             | Deployed by                                  |
| --------- | ---------------- | ------------------ | -------------------------------------------- |
| `develop` | hackhub-dev      | Preview + dev alias | `.github/workflows/deploy.yml` on push       |
| `master`  | hackhub-prod     | Production          | same, after a reviewer approves              |

Work on `feature/*` branches and open PRs into `develop`; release with a PR from `develop` into
`master`. `ci.yml` runs on every PR: lint, typecheck, unit tests, build, and every migration plus
pgTAP tests against a throwaway database. Deploys apply migrations (`supabase db push`) before
the app goes live. Vercel's own Git builds are disabled (`vercel.json`).

### First-time setup (once per team)

1. Create two Supabase projects (`hackhub-dev`, `hackhub-prod`, region Singapore).
2. Fill `.env.setup` (gitignored) and run `npm run setup:envs`. It creates the Vercel project and
   its variables, Supabase auth redirects, and the GitHub environments and secrets.

## Local development

```bash
npm install
npx supabase start          # local stack on ports 563xx; prints the local keys
cp .env.example .env.local  # paste the printed URL and keys
npm run dev
```

Database changes go in a new file under `supabase/migrations/`; `npx supabase db reset` reapplies
them locally and `npm run test:db` runs the pgTAP tests in `supabase/tests/`.
