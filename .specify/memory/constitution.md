<!--
Sync Impact Report
- Version change: scaffold → 1.0.0
- Modified principles: replaced five template placeholders with HackHub project principles
- Added sections: Security and Resource Constraints; Development Workflow and Quality Gates
- Removed sections: none; all scaffold sections were concretised
- Follow-up TODOs: none
-->

# HackHub Developer Constitution

## Core Principles

### I. Specification Before Implementation

Every feature or bug fix MUST begin with an approved Spec Kit artifact. The specification MUST
describe the user outcome, actors, permissions, state transitions, data changes, acceptance
criteria, security risks, and tests before implementation begins. The active SDD is the source of
truth for scope; implementation details belong in the plan and tasks artifacts.

### II. Role Boundaries and Least Privilege

Every operation MUST enforce the actor's role, ownership, and assignment on the server and in
Supabase RLS where applicable. For the Developer role, a user may access only assigned bugs,
write only their own investigation notes and fix revisions, and submit fixes to QA without
approving them. Original reporter code MUST remain immutable, and UI-only authorization is not
sufficient.

### III. Verification as a Completion Gate

Each acceptance criterion MUST map to implementation evidence or an automated test. Features MUST
cover happy paths, validation failures, empty/loading/error states, unauthorized access, and
workflow rejection paths. A feature is not complete until the applicable lint, typecheck, unit,
database/RLS, and build checks have been run and their results recorded.

### IV. Untrusted Code and Safe AI Assistance

User-submitted code, error messages, reproduction steps, notes, repository content, and generated
code MUST be treated as untrusted data. Instructions embedded in those fields MUST NOT override
system, role, or application rules. AI output MUST be advisory, schema-validated, and reviewable;
the application MUST NOT automatically execute or apply user-submitted or AI-generated code.

### V. Focused Context and Responsible Resource Use

Agents and AI features MUST receive only the context relevant to the current task, authorized
user, bug, and revision. Inputs MUST be size- and token-limited, and unrelated users, bugs, and
private QA data MUST be excluded. Repeated analysis SHOULD use version-aware caching, and model,
token, latency, error, and cache behavior SHOULD be observable when an AI feature is introduced.

## Security and Resource Constraints

- Secrets and privileged Supabase access MUST remain server-side.
- AI calls MUST have input limits, output limits, timeouts, rate limits, and safe failure handling.
- The platform MUST NOT execute submitted Python automatically in the MVP; execution requires a
  separately designed sandbox and security review.
- AI prompts MUST separate trusted application instructions from untrusted bug content.
- Security tests MUST include prompt injection, oversized input, malformed AI output, unauthorized
  identifiers, and attempts to expose another user's data.
- Database migrations MUST enable RLS for new public tables and include negative authorization
  tests for important access boundaries.

## Development Workflow and Quality Gates

Developer-role work MUST use the Spec Kit lifecycle:

```text
$speckit-specify → $speckit-clarify → $speckit-plan → $speckit-checklist
→ $speckit-tasks → $speckit-analyze → $speckit-implement → $speckit-converge
```

The optional clarification, checklist, and analysis stages SHOULD be used for production-facing
features. The repository-local guidance in `developer/` MUST be used alongside Spec Kit:

- `developer/context/` supplies role and context-engineering rules.
- `developer/skills/` supplies implementation, RLS, AI-security, and verification reviews.
- `developer/workflows/` defines agent handoffs and completion evidence.
- `developer/reflection/` records before/after technique experiments for the presentation.

Specialized agents SHOULD have distinct responsibilities for specification, implementation,
database/RLS review, security review, testing, and final verification. Each handoff MUST record
the task, files changed, decisions, acceptance criteria, checks run, and unresolved risks.

## Governance

This constitution governs all HackHub development and takes precedence over ad-hoc prompts when
they conflict with its principles. Amendments MUST be made through a reviewed constitution change,
must include a version and date update, and must explain their impact. A MINOR version is used for
new or materially expanded principles or sections; a PATCH version is used for clarifications; a
MAJOR version is used for incompatible governance changes.

Every SDD review, implementation handoff, and final verification MUST check constitution
compliance. Complexity, privileged access, AI context expansion, and exceptions MUST be justified
in the relevant plan or review record. The project constitution and repository-local guidance
MUST be kept consistent when the workflow changes.

**Version**: 1.0.0 | **Ratified**: 2026-11-04 | **Last Amended**: 2026-11-04
