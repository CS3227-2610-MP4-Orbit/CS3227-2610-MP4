# Contract: Developer AI Code Improvement

This is the internal contract between the Developer UI, server action, shared AI gateway, and
existing report/revision workflow.

## Request

Input: authenticated session and a report identifier.

Preconditions:

- The caller is authenticated.
- The caller's current profile role is `developer`.
- The report is assigned to the caller.
- The report contains bounded Python code.

The action loads the report and recent notes through the caller's session, not a privileged
client. It passes only the minimum bounded context to the shared AI gateway.

## Success response

Returns an advisory result containing zero or more suggestions. Each suggestion should identify:

- improvement category;
- explanation/rationale;
- expected benefit;
- material trade-off or behavior risk, when applicable; and
- optional illustrative code labelled as suggested text.

The UI labels the result as AI-generated advisory guidance and does not provide an apply, execute,
submit, or status-change control.

## Failure response

Returns a fixed safe message for unauthenticated, wrong-role, unassigned, oversized, quota,
timeout, provider, malformed-output, and unavailable cases. User-facing errors must not echo full
code, report content, provider details, prompts, keys, or URLs.

## Non-effects

The request MUST NOT:

- update `bug_reports`;
- insert or update `investigation_notes`;
- insert or update `fix_revisions`;
- change report status or assignments;
- execute submitted or generated Python; or
- expose QA-only decisions.
