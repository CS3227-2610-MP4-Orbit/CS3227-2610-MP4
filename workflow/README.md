# Development workflow

This folder starts the spec-driven workflow for the AI-powered bug tracking and code quality platform. The project description is the requirements source; the supplied PDF is a **proposed** process, not an instruction to run every agent on every task. No app agent orchestration is implemented yet.

## Sequence for each feature

1. Create or amend a numbered spec in `specs/` with user stories, acceptance criteria, role permissions, AI inputs/outputs, abuse cases, and measurable limits.
2. Record unresolved decisions in the spec. Get team agreement before changing shared schema or interfaces.
3. Write a task breakdown with one owner per task, dependencies, verification steps, and handoff artifact.
4. Implement on a `feature/*` branch. The owner keeps the spec and code aligned.
5. Run relevant unit, database/RLS, and security tests. Review prompt boundaries and output handling for AI features.
6. Merge through PR into `develop`; release from `develop` to `master` after CI and review. Record concise interaction summaries in `logs/` and experiment results in `docs/Reflections.md`.

The team can adopt GitHub Spec Kit, but the specs and tasks here remain readable Markdown so work can start without depending on a toolkit install. Keep toolkit-generated workflow files here where practical.

## Agent coordination

The orchestrator owns the task plan and final integration. Explorer gathers narrow, read-only evidence. Generator edits only assigned files. Security reviewer checks role boundaries, prompt injection, secrets and AI output safety. Verifier checks acceptance criteria and tests. Use the minimum set needed: a documentation change may need only an owner and verifier; auth, database, and AI changes need security review. Independent reviews may run in parallel; verification follows implementation. See `agents/roles.md` and `templates/handoff.json`.

Track actual model, token, cache, latency, tool-call and retry data where the provider exposes them. Never invent metrics. Keep raw user code and secrets out of prompt logs.

For official Spec Kit setup, see `SpecKit.md`. To check spec and handoff structure locally, run `python3 workflow/scripts/check_workflow.py`. Experiment protocols are in `experiments.md`.
