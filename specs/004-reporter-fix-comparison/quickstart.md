# Comparison verification

1. Run unit, type, lint, database and build checks. In an isolated local database, insert a report and two trusted `fix_revisions` fixtures with distinct version numbers; sign in as the owning Reporter.
2. Open its detail: latest revision should be selected, with original and proposed source, changed-line markings, author/time/note. Select the earlier revision; original remains fixed.
3. Use a closed owned report and confirm revisions remain readable. Open another Reporter's report URL and query revisions directly; no code should be disclosed.
4. With no revision, confirm the waiting state and no sample comparison in development or production.
5. Use markup-like and long code fixtures; confirm inert text and bounded diff fallback. Do not execute submitted code.
