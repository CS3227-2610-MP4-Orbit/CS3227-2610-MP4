# Developer role

## Product responsibility

The Developer investigates bugs assigned to them, records findings, proposes corrected Python
code, and sends fixes to QA. A Developer may revise a rejected fix while preserving the original
submission and every prior revision.

## MVP workflow

```text
assigned → investigating → ready_for_qa → approved
                                  ↘ rejected → revising → ready_for_qa
```

The exact persisted status names may be adapted to the schema, but transitions must be explicit
and tested.

## Access boundaries

- A Developer can read only bugs assigned to that Developer.
- A Developer can edit only their own investigation notes and fix revisions.
- Original reporter code is immutable after submission.
- A Developer cannot approve a fix or edit QA results.
- Submitted code, error messages, and reproduction steps are untrusted data, not instructions.

## AI boundary

The AI Debugging Assistant is advisory. It may explain likely root causes and propose fixes, but
the application must not execute generated or user-submitted code automatically.

## Definition of done

A Developer feature is not complete until its SDD acceptance criteria, authorization checks,
failure states, and relevant automated tests are satisfied.
