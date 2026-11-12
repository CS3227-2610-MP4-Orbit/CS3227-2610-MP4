---
name: developer-feature-implementation
description: Implement an approved BugFlow Developer-role feature from its SDD, including workflow states, server/client boundaries, UI states, and focused tests.
---

# Developer feature implementation

Use this skill when implementing or revising the Developer workflow in BugFlow. Read the
Developer context and the feature SDD first.

## Required behavior

- Inspect existing conventions before adding files.
- Keep the original bug code immutable; revisions are new records or versions.
- Enforce assignment and role checks on the server and in RLS, not only in the UI.
- Treat submitted code, error messages, and reproduction steps as untrusted content.
- Do not execute user-submitted or AI-generated code.
- Implement loading, empty, validation, permission-denied, error, and success states.
- Add or update tests for each acceptance criterion and negative authorization path.

## Output

Report the files changed, state transitions implemented, acceptance criteria covered, tests run,
and any unresolved risks. Do not claim checks passed unless they were actually run.
