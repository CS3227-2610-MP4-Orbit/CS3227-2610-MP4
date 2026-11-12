# Data Model: Check Report Quality

This feature adds no stored report draft or suggestion and requires no database migration.

## Report draft

| Field | Meaning | Validation for a check |
| --- | --- | --- |
| Title | Short report summary | String, at most 120 characters |
| Python code | Snippet being reported | String, at most 20,000 characters |
| Error message | Observed error or absence of one | String, at most 2,000 characters |
| Expected behavior | Intended result | String, at most 2,000 characters |
| Actual behavior | Observed result | String, at most 2,000 characters |
| Reproduction steps | How to reproduce | String, at most 2,000 characters |

The six strings come from the current New Report form. A check permits missing individual fields; submission keeps its existing required-field rules. An all-blank draft is refused without provider usage. Existing gateway bounds still apply to each field and the combined context.

## Quality suggestion

Temporary client-visible text tied to the version of the six draft fields used for one successful check. State consists of text, a safe failure message if the latest request failed, a pending state, and whether the current draft has changed since the successful check. It is never stored in a bug report. Editing any field marks the displayed suggestion stale; a successful new check makes it current again.

## Usage record

Use the existing `ai_usage` entity with feature `reporter_quality_check`, signed-in Reporter ID, `report_id = null`, model, outcome, token counts when available, latency, and retry count. The record contains no draft content, prompt, or suggestion. Existing gateway limits and stale-pending behavior apply.

## State transitions

```text
No suggestion → Checking → Current suggestion
No suggestion → Checking → Safe failure
Current suggestion → Draft edited → Stale suggestion
Current or stale suggestion → Checking → Current suggestion
Current or stale suggestion → Checking → Prior suggestion + safe failure
```

The submitted bug-report lifecycle does not change. Only the existing Submit report action creates a report.
