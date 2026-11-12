# BugFlow: a Python bug workflow for Reporters, Developers and QA

BugFlow tracks a Python bug from report to verified fix. A **Reporter** submits the broken code and what went wrong. A **Developer** investigates and submits a corrected version. A **QA tester** records tests against that exact version and approves or rejects it. Each role has an AI feature that runs on the SoC LLM and is clearly labelled as unverified advice.

| | |
| --- | --- |
| Production app | https://bugflow-orbit.vercel.app |
| Development app | https://bugflow-orbit-dev.vercel.app |
| Product website | https://cs3227-2610-mp4-orbit.github.io/CS3227-2610-MP4/ |
| User Guide | [docs/UserGuide.md](docs/UserGuide.md) (features, demo accounts, how to test) |
| Developer Guide | [docs/DeveloperGuide.md](docs/DeveloperGuide.md) (design, security, deployment, agent workflow) |
| Reflections | [docs/Reflections.md](docs/Reflections.md) (multi-agent SE, context engineering, measured usage) |
| Agent workflow | [workflow/README.md](workflow/README.md) and the [feature spec](workflow/specs/001-bug-lifecycle/spec.md) |
| Interaction logs | [logs/](logs/) (one folder per team member) |

The production app is also still served at its old address, `hackhub-orbit.vercel.app`.

Demo accounts and their password are listed in the [User Guide](docs/UserGuide.md#test-accounts).

## Features

- **Reporter:** submit a bug with the Python code, the expected and actual behaviour and an optional error message; edit it while it is open; follow its status; see the Developer's fix as a side-by-side comparison and read QA's feedback. AI: explain my code, and check a draft before submitting.
- **Developer:** a queue of assigned bugs; start an investigation, keep notes and submit corrected code as a new revision; read QA's rejection and resubmit. AI: debugging advisor and code improvement advisor.
- **QA tester:** a review queue; record pass/fail tests against the exact submitted revision; approve, or reject with feedback. AI: test ideas and a feedback draft.

Every status change is enforced in the database (row-level security and `SECURITY DEFINER` functions), not only in the UI.

## Team

| Member | Role in the app | GitHub |
| --- | --- | --- |
| Joseph | Reporter | josephkwok001 |
| Jordan | Developer | JordanGoh4 |
| Johannsen | QA tester | JohannsenLum |

## Run locally

Requirements: Node.js 22+, Docker (for local Supabase) and the Supabase CLI.

```bash
npm ci
supabase start                 # local Postgres, Auth and API
cp .env.example .env.local     # then fill in the values printed by `supabase start`
npm run dev                    # http://localhost:3000
```

Checks used in CI:

```bash
npm run lint && npm run typecheck && npm test && npm run build
supabase test db               # pgTAP tests for RLS and the workflow functions
```

The AI features need the SoC LLM variables described in the [Developer Guide](docs/DeveloperGuide.md). Without them the app works and the AI panels show an "unavailable" message.

## Deployment

GitHub Actions (`.github/workflows/deploy.yml`) applies the Supabase migrations and deploys to Vercel. A push to `develop` deploys to the development environment, and a push to `master` deploys to production after a required reviewer approves. The two environments use separate Supabase projects and separate secrets.
