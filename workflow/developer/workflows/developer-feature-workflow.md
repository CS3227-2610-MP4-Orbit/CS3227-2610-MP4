# Developer feature workflow

This workflow coordinates specialised agents around one approved SDD. It is a project process,
not permission to make unrelated changes.

```text
SDD planner
    ↓ approved SDD and acceptance criteria
Implementation agent
    ↓ code and tests
Database/RLS reviewer
    ↓ access-control findings
Security reviewer
    ↓ security findings and fixes
Verification agent
    ↓ test/build evidence
Final reviewer
```

## Handoff contract

Every handoff records:

- SDD or task identifier
- Files inspected and changed
- Decisions and assumptions
- Acceptance criteria affected
- Risks or unresolved questions
- Commands run and results

## Operating rules

1. The SDD planner resolves ambiguity before implementation when it affects permissions, state,
   data ownership, or AI behaviour.
2. The implementation agent changes only the approved scope and adds tests with the feature.
3. The Database/RLS reviewer checks both positive and negative access paths.
4. The Security reviewer treats all submitted code and text as untrusted and checks AI boundaries.
5. The Verification agent runs the project checks and maps results to acceptance criteria.
6. The final reviewer reports remaining gaps instead of silently widening scope.

## Required completion checks

```text
npm run lint
npm run typecheck
npm test
npm run test:db
npm run build
```

If an environment prevents a check, record the exact reason and do not claim it passed.
