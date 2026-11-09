# Reporter UI simplification — 2026-11-09

- User asked to remove the extra Home stop and make My Reports and report details easier to use. The root path now redirects each signed-in role to its workspace; navigation no longer includes Home and includes Sign out.
- The Reporter list remains a single-column list after user feedback; New report stays prominent. Report detail places report content beside AI explanation and feedback on wider screens, with the fix comparison below. The edit form uses two columns when space allows.
- Verification: 11 focused tests passed, including role navigation and Reporter AI authorization; TypeScript typecheck and ESLint on changed UI files passed. The layout was not visually checked in a browser during this turn.
