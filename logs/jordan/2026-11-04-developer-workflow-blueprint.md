# 2026-11-04: Developer workflow blueprint and SDD implementation record

Owner: Jordan. Feature: `specs/001-developer-bug-workflow/`. Source session: Codex development thread.

## Goal and result

Established the Developer-owned slice of the Python bug-resolution workflow using the repository's
Spec-Driven Development process. The blueprint defined the Developer role, assigned-report access,
investigation notes, immutable fix revisions, original-versus-revised comparison, QA handoff,
rejected-fix revision, and a later advisory AI assistant. QA approval/rejection actions and screens
remain owned by the QA teammate.

## Blueprint and context engineering

The implementation context was deliberately bounded to the Developer role and the approved SDD
artifacts:

- `AGENTS.md` and `workflow/README.md`
- `specs/001-developer-bug-workflow/spec.md`
- `plan.md`, `data-model.md`, `contracts/developer-workflow.md`, and `tasks.md`
- `.specify/memory/constitution.md` and `checklists/security.md`
- `workflow/developer/context/developer-role.md`
- `workflow/developer/context/developer-feature-context.md`
- `workflow/developer/workflows/developer-feature-workflow.md`

The context pack separated trusted SDD and permission rules from untrusted bug content, submitted
code, notes, and future AI suggestions. Resource-aware decisions were to use the existing Next.js,
Supabase, RLS, lifecycle RPC, and test boundaries; defer AI requests until the non-AI workflow was
complete; and use only assigned-report context for future Developer AI requests. Token, cache,
latency, and retry counters were recorded as unavailable when the environment did not expose them.

## SDD progression and implementation milestones

1. **Foundation and schema:** reused the existing bug-lifecycle schema, server-only Supabase access,
   role/assignment filters, and RLS tests. The workflow checker later showed a Windows-only `fcntl`
   limitation.
2. **US1 and US2:** implemented the assigned Developer dashboard, participant-safe report detail,
   start-work lifecycle action, investigation-note creation/editing, loading/error states, and
   author/status protections. The investigation handoff recorded the main decisions and test limits.
3. **US3:** added immutable revisions, `submit_fix`, revision numbering serialization, text comparison,
   corrected-code form limits, revision history, and original-code protection.
4. **US4:** added the Developer-to-QA handoff boundary, the `awaiting_qa` state, handoff metadata,
   investigation-note prerequisite, and explicit denial of Developer QA decisions.
5. **US5:** added Developer-facing rejection feedback, revision-after-rejection behavior, and tests
   proving rejected feedback and earlier revisions remain available.

Relevant implementation commits include `5367a99`, `a7296fe`, `3a8c120`, `54b90ab`, and the merged
Developer branch commits leading to `develop`.

## Agentic SE workflow

The Developer workflow used bounded ownership and handoffs: SDD planning, implementation, database/RLS
review, security review, verification, and final review. Phase 8 used independent security and code
reviewers in parallel, followed by local command verification. Evidence is stored under
`workflow/evidence/`; this log records the human-readable interaction summary.

## Current status and limitations

The Developer user stories through US5 are implemented and their task markers are complete. Phase 8
found a remaining current-role authorization issue in lifecycle mutations, plus medium comparison and
Python-validation findings. Phase 9 Developer AI work is intentionally deferred until those findings
are resolved. Full validation is limited by missing local CodeMirror/diff packages, Supabase telemetry
`EPERM`, offline Google Fonts access during build, and Windows-incompatible `fcntl` workflow scripts.

The agreed Reporter rule is documented separately: Reporter code edits are allowed while a report is
`open`; once Developer work starts and status becomes `in_progress`, Reporter code edits are blocked.
