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

## Capture development-agent token usage

For the **next** bounded task, run this from the orchestrator before spawning agents (its environment supplies `CODEX_THREAD_ID`):

```sh
python3 workflow/scripts/token_usage.py start TASK-ID
```

After all agent turns and the orchestrator's turn have ended, run from a terminal:

```sh
python3 workflow/scripts/token_usage.py finish TASK-ID --run-file workflow/requests/TASK-ID-run.json
```

`finish` uses the root thread ID saved by `start`, so a terminal does not need `CODEX_THREAD_ID`. Create a valid draft run JSON from `templates/run-record.json` first; `--run-file` fills only token counts, model IDs, and the evidence path. Omit `--run-file` to write a usage summary without updating a draft. The summary is under `workflow/evidence/usage/`. Run `agent_workflow.py record` only after reviewing the draft and its quality/test evidence. A duplicate `start` or `finish` fails rather than overwriting evidence. If a snapshot or attribution fails, leave usage fields `null`.

The collector reads local `~/.codex/sessions/` JSONL but writes only session IDs, agent paths, model IDs, timestamps and numeric usage. It never commits raw Codex logs, prompts, code snippets, tool output or credentials. It subtracts cumulative start counters from finish counters and includes spawned descendants with a `thread_spawn` source while excluding helper/guardian sessions. Model IDs are taken only from turn-context events inside the measured window; an empty model-ID list means the model is unknown for that window, not that no model ran. A child that appears at finish but predates start has unknown usage rather than an assumed zero baseline. Run one measured task per root thread at a time; do not claim attribution when tasks overlap. Usage may arrive after a turn ends, so finish after work has settled. Counts can include the cost of inherited agent context. Cached input is part of input and reasoning output is part of output; do not add those categories twice. Task quality, elapsed time and retries still require separate evidence.

### Claude Code

`claude_usage.py` does the same for Claude Code and writes the same counters, so Codex and Claude Code runs compare in one table. Ask Claude Code to run `start` at the beginning of the task, inside the session that does the work (that session sets `CLAUDE_CODE_SESSION_ID`):

```sh
python3 workflow/scripts/claude_usage.py start TASK-ID
```

When the task's last agent turn has ended, run `finish` (from the same session, or a terminal):

```sh
python3 workflow/scripts/claude_usage.py finish TASK-ID --run-file workflow/requests/TASK-ID-run.json
```

Claude Code writes one transcript per session under `~/.claude/projects/` and one per subagent under `<session>/subagents/`. Each API response records its own usage, not a running total, and is written once per content block with the usage repeated. So the collector sums *unique* responses (by message ID) timestamped between `start` and `finish`, across the session and all its subagents. It labels subagents by type (e.g. `/root/general_purpose`) and also counts tool calls, which fill the run record's `tool_calls`. `input_tokens` includes cache reads and cache writes (as in Codex), `cached_input_tokens` is cache reads, and `reasoning_output_tokens` is thinking tokens, which are part of `output_tokens`. Cache hit rate is `cached_input_tokens / input_tokens`.

Measure one task per session at a time. A session that is compacted keeps its ID, but a new session (e.g. `claude` started again) is not included; pass `--session-id` only for the session that did the work. Unreadable lines make the affected counters null rather than undercounted.

For official Spec Kit setup, see `SpecKit.md`.
