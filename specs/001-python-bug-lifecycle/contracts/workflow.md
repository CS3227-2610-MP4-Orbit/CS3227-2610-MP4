# User-facing workflow contract

| Role | View | Allowed mutation | Rejected mutation |
| --- | --- | --- | --- |
| Reporter | Own reports and their history | Create/edit own open report | Other report, submitted report, assignment or decision |
| Developer | Assigned reports and history | Start work, add notes, submit new fix revision | Unassigned report, QA decision, edit old revision |
| QA | Assigned awaiting fixes and history | Record test result, approve/reject latest revision | Unassigned report, stale revision decision, code edit |

All mutations return a safe validation or authorization error without leaking another report's contents. Status transitions and history are attributable. AI actions verify the same relationship and role before fetching report context. AI output is advisory plain text. Provider failure leaves the manual workflow available.
