# Research: Developer Bug Workflow

## Decision 1: Reuse the approved bug-lifecycle schema

- **Decision**: Use the existing `bug_reports`, `investigation_notes`, `fix_revisions`,
  `qa_decisions`, and `status_events` tables and the `start_work` and `submit_fix` functions.
- **Rationale**: The migration already encodes assignment checks, immutable revisions, lifecycle
  transitions, concurrency locking, role checks, append-only history, and RLS. A second Developer
  schema would split the shared Reporter → Developer → QA contract.
- **Alternatives considered**: Add a new Developer-only schema; rejected because it would duplicate
  entities and create cross-role integration risk.

## Decision 2: Use server actions/server components for the first UI slice

- **Decision**: Keep report reads in server components or server-side query functions and keep
  mutations behind validated server actions that call the existing Supabase client/RPC boundaries.
- **Rationale**: The starter already uses the Next.js App Router and Supabase SSR client. This
  preserves authenticated cookies and keeps authorization close to the operation.
- **Alternatives considered**: Add a separate API service; rejected because the feature does not
  require another deployment or protocol boundary.

## Decision 3: Do not add AI calls to the non-AI Developer workflow

- **Decision**: Implement the workflow baseline first; specify the Developer AI feature separately
  under shared task T08.
- **Rationale**: This isolates lifecycle and authorization behavior so the later AI experiment can
  measure the effect of context engineering and resource controls without mixing unrelated bugs.
- **Alternatives considered**: Add the AI Debugging Assistant in the same feature; rejected because
  the approved task plan separates T04 workflow work from T08 AI work.

## Decision 4: Use explicit workflow handoff artifacts

- **Decision**: Route the implementation through the repository workflow's orchestrator, generator,
  security reviewer, and verifier roles, with a handoff artifact for each boundary.
- **Rationale**: The constitution requires bounded context, named ownership, independent security
  review, and evidence-backed verification.
- **Alternatives considered**: One unrestricted coding-agent prompt; rejected because it would not
  demonstrate or enforce the required multi-agent coordination.

## Decision 5: Preserve text-only code handling

- **Decision**: Display and compare Python snippets as text; never execute them in the application.
- **Rationale**: This is an explicit product and security constraint in the approved spec and
  constitution. It avoids introducing an untrusted-code sandbox into the MVP.
- **Alternatives considered**: Execute snippets during Developer or QA flows; deferred until a
  separate sandbox design and security review exist.
