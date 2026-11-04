# Development workflow

This folder implements the **development-agent workflow** for the AI-powered bug tracking and code quality platform. The project description is the requirements source; the supplied PDF guides the multi-agent process. These assets route and document development work; they do not implement product AI features or automatically spawn agents.

## Sequence for each feature

1. Create or amend a numbered spec in `specs/` with user stories, acceptance criteria, role permissions, AI inputs/outputs, abuse cases, and measurable limits.
2. Record unresolved decisions in the spec. Get team agreement before changing shared schema or interfaces.
3. Write a task breakdown with one owner per task, dependencies, verification steps, and handoff artifact.
4. Implement on a `feature/*` branch. The owner keeps the spec and code aligned.
5. Run relevant unit, database/RLS, and security tests. Review prompt boundaries and output handling for AI features.
6. Merge through PR into `develop`; release from `develop` to `master` after CI and review. Record concise interaction summaries in `logs/` and experiment results in `docs/Reflections.md`.

GitHub Spec Kit manages specifications, plans and tasks in `.specify/` and `specs/`. This `workflow/` layer adds task-based agent routing, bounded context, handoffs and resource evidence. The team-approved product scope also remains readable in `workflow/specs/`.

## Agent coordination

The orchestrator owns the task plan and final integration. Explorer gathers narrow, read-only evidence. Generator edits only assigned files. Code and security reviewers inspect the completed artifact independently; verifier checks acceptance criteria and test evidence. Simple tasks can stay with one agent. See `agents/roles.md` and `templates/handoff.json`.

Track actual model, token, cache, latency, tool-call and retry data where the provider exposes them. Never invent metrics. Keep raw user code and secrets out of prompt logs.

## Run one task

1. Copy `templates/task-request.json` to a task-specific JSON file. Fill in the approved spec, acceptance criteria, security sensitivity, owner and narrow file/line references. `examples/security-task.json` is a safe dry-run example, not evidence that agents worked.
2. Run `python3 workflow/scripts/agent_workflow.py plan <task.json>` to see the selected roles, model tiers and budgets. Run `python3 workflow/scripts/agent_workflow.py context <task.json>` for bounded, labeled excerpts. Use `claim <task.json>` to reserve owned paths on `assignments.json`; overlapping active assignments are rejected.
3. Invoke only the selected agents with their prompts under `agents/prompts/`. Use `$agent-coordination` for orchestration and `$agent-handoff` when work passes between agents. Record real handoffs in `evidence/`. Use `release <task.json>` after the orchestrator accepts completion or stops the task.
4. After actual work, fill `templates/run-record.json` with measured data and run `python3 workflow/scripts/agent_workflow.py record <run.json>`. Use `python3 workflow/scripts/agent_workflow.py export` for a CSV table. Null means unavailable, not zero.
5. Run `python3 workflow/scripts/check_workflow.py` and `python3 workflow/scripts/test_agent_workflow.py`. Summarize the interaction in the initiating member's `logs/` folder. Compare routes and context choices using `experiments.md` before writing conclusions in `docs/Reflections.md`.

For official Spec Kit setup, see `SpecKit.md`.
