---
name: verification-review
description: Verify BugFlow Developer features against their SDD, tests, type checks, lint, build, and security acceptance criteria.
---

# Verification review

Use this skill before declaring a Developer feature complete or handing it to another role.

## Review method

1. Map every SDD acceptance criterion to implementation evidence or a test.
2. Check happy paths, rejected-fix revision paths, validation failures, empty states, and loading
   or server errors.
3. Check assignment, role, and immutable-history negative cases.
4. Run the repository checks that the environment supports:

```text
npm run lint
npm run typecheck
npm test
npm run test:db
npm run build
```

5. Record exact command results and separate failures caused by code from environment limitations.

## Output

Return an acceptance-criteria matrix, test evidence, unresolved defects, and a clear ready/not
ready recommendation.
