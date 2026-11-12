# Research: Reporter Feedback View

## Decision: read-side feedback relation

- **Decision**: Add an append-only `bug_feedback` relation for attributable Developer/QA entries and no client mutation grant in this slice.
- **Rationale**: The current database contains only profiles and bug reports; there is no feedback source. A secure reader can be implemented and tested now without pretending that Developer/QA writers exist.
- **Alternatives considered**: A placeholder-only UI would not read actual feedback. Storing one feedback string on `bug_reports` loses attribution and history. Reusing planned investigation/decision relations is premature because those schemas and writers are not implemented. Future writers must reconcile this relation with those domain records to avoid duplicate or conflicting histories.

## Decision: access and rendering

- **Decision**: The existing detail page checks the signed-in Reporter and ownership before querying feedback. The table grants browser roles SELECT only, with RLS restricting rows to reports owned by the current Reporter. Display entries as ordinary React text.
- **Rationale**: Server checks plus database RLS protect direct URL/query access; React text escaping keeps markup-like content inert.
- **Alternatives considered**: A service-role read would bypass RLS and increase leakage risk. HTML rendering is unnecessary for short feedback text.

## Decision: verification and limits

- **Decision**: Bound body length to 1–2,000 characters, sort by creation time and ID descending, and distinguish empty data from a query error. Use trusted test fixtures to exercise the read side until role writers are integrated.
- **Rationale**: These checks make the slice independently demonstrable without fabricating feedback from the unfinished workflows.
- **Sources**: Existing Spec 001 and schema; Next.js 16 local docs for request-time rendering; [Supabase RLS guide](https://supabase.com/docs/guides/database/postgres/row-level-security) for explicit grants, policies, and pgTAP coverage.
