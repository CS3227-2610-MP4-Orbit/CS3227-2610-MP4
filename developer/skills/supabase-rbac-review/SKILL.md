---
name: supabase-rbac-review
description: Review HackHub Supabase migrations and RLS for assignment-based Developer access, immutable bug history, and role isolation.
---

# Supabase RBAC review

Use this skill when a Developer feature changes tables, policies, functions, triggers, grants, or
server access.

## Review focus

- Confirm every new table has RLS enabled.
- Verify authenticated Developers can access only assigned bugs.
- Verify Developers can write only their own notes and fix revisions.
- Verify original code cannot be updated or deleted through the application role.
- Verify QA access is limited to fixes submitted for QA.
- Check ownership and assignment joins for missing or bypassable predicates.
- Add pgTAP or equivalent negative tests for unauthorised reads and writes.
- Use the service role only for server-only operations with an explicit permission check.

## Output

Return findings grouped by severity, the policies or grants inspected, required migration changes,
and tests proving both allowed and denied paths.
