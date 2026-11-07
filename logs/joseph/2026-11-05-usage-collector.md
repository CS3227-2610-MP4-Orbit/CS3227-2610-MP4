# Counts-only development-agent usage collector

Added a local Codex usage collector with start/end snapshots and draft-run population for future bounded tasks. It reads cumulative token-count events but writes only safe identifiers, timestamps, scoped model IDs and numeric counters. A generator implemented it; independent code and security reviewers found model attribution, stale child baseline, helper filtering, invalid-draft retry and malformed-record privacy issues. The generator fixed these before verification.

The verifier passed 10 synthetic collector tests, 7 existing workflow tests, the structure check and diff check. A read-only local snapshot found counters but wrote no task usage evidence. This setup task's token fields remain null because capture did not start before its work. No token-savings or value-savings conclusion is claimed. The next task should use the documented start/finish commands and compare resources against accepted quality and test results.
