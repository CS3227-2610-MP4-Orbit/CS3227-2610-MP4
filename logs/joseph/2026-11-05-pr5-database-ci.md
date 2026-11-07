# PR #5 database CI repair — 2026-11-05

- CI job 127185110148 failed applying Reporter migration because develop lifecycle migration already created public.profiles.
- Fetched and merged develop locally without committing, then reconciled the Reporter branch with canonical bug_reports.code and app_role schema. Removed duplicate standalone Reporter migrations and added role-aware participant/Reporter policy migration.
- Used a separate disposable Supabase project in /private/tmp; original local database was not reset or migrated. Fresh migration succeeded; 74 pgTAP assertions and warning-level database lint passed.
- Independent code/security reviews and verifier found no CI-fix blocker. Verifier passed 13 unit tests, lint, typecheck, workflow check and whitespace. Local production build remains environment-blocked by Turbopack process/port permission.
- Existing local Reporter databases have divergent migration history; develop migration drops old tables. Back up and plan data-preserving migration before applying it there. Existing Developer/QA role-change action gap is separate from this CI fix.
- Handoff: workflow/evidence/C005-database-merge-handoff.json.
