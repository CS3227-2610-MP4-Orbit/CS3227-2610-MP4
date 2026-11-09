# Reflections

This is an experiment log, not a claim that the workflow has been validated.

| Date | Question / comparison | Method and task | Agents / models | Input / cached / output tokens | Latency / tool calls / retries | Outcome and limitations |
| --- | --- | --- | --- | --- | --- | --- |

Record concrete examples of handoff quality, idle time, conflicts, failed retries, prompt-context selection, and security review findings. Use `workflow/experiments.md` and the CSV exported by `workflow/scripts/agent_workflow.py` to compare a task-based route with a fixed all-agent route on the same representative tasks. Use provider usage counters where available and mark unavailable data as unavailable. Do not put user code, credentials or full private prompts in this file.

## Developer-role reflection

The Developer role was implemented as a sequence of bounded feature slices rather than one broad
change. The specification and task list established the ownership boundary: Developers can
investigate assigned reports, preserve original code, create immutable revisions, hand a revision
to QA, and respond to QA rejection; QA approval and rejection actions remain teammate-owned.

### Evidence-based lessons

- The first Developer slice exposed a lifecycle gap in investigation-note editing. The database
  review led to an explicit author-and-status rule, so notes are editable only by their author
  before QA handoff and are read-only afterwards.
- During the investigation-notes feature, the implementation was reconciled against the existing
  SDD and tasks after the formal Spec Kit execution step was initially omitted. The process lesson
  was to use the repeatable sequence `analyze → checklist → implement → verify → handoff → commit`.
- Independent security and code reviews found issues that required remediation, including lifecycle
  authorization, diff alignment, Python syntax validation and safe identity display. These findings
  demonstrate the value of independent review; they are not evidence that every manual scenario was
  completed.
- The Developer AI feature was kept advisory-only. Recorded tests cover authentication, current
  role, assigned-report authorization, bounded context forwarding, prompt-injection text,
  malformed provider output, provider failures and the absence of report/revision/status mutation.
- Automated verification recorded 18 test files and 87 tests, plus passing typecheck and lint for
  the AI security review. Manual authenticated quickstart testing remains deferred under T045, so
  no manual usability result is claimed here.

### Technique connection

Spec-Driven Development provided the acceptance criteria and ownership boundary. Context
engineering narrowed implementation work to the relevant Developer files and approved documents.
Resource-aware use bounded AI context and request quotas. Specialized security and verification
reviews supplied independent feedback, while database and application tests acted as the feedback
harness. These are documented implementation practices and historical observations, not a
controlled before-and-after experiment; controlled experiment results belong in
`developer/reflection/agent-experiments.md` and `workflow/evidence/experiments/` after execution.
