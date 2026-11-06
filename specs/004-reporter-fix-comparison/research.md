# Research

- The shared migration already creates `public.fix_revisions` and grants participant reads through RLS. `20261105000300_reporter_role_access.sql` makes participant checks role-aware. This slice needs no new data table or server mutation.
- jsdiff's official README documents `diffLines(oldStr, newStr, {maxEditLength})`; reaching the edit bound may return `undefined`. Fixed 20,000-character and 1,500-line prechecks plus that edit bound give a deterministic text-only fallback across server rendering and hydration. Source: https://github.com/kpdecker/jsdiff/blob/master/README.md.
- Next.js 16 local page documentation uses promised `params` and `searchParams`. Existing detail page already calls `connection()` inside Suspense before auth; retain that boundary.
- The sample pair should be a fixed arithmetic bug example, not derived from a user's report. Its note is marked sample, and server code supplies it only when `NODE_ENV=development`.
