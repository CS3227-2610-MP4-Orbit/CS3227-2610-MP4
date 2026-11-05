# Validation quickstart

1. Install dependencies with `npm ci`. Start local Supabase with `npx supabase start`, copy `.env.example` to `.env.local`, and enter the printed local URL and keys. Obtain verified SoC LLM settings separately; do not commit them.
2. Apply migrations with `npx supabase db reset`; run `npm run test:db`, `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
3. Start `npm run dev`. Provision one Reporter, Developer and QA account through the documented controlled process.
4. As Reporter, submit and edit an open report. As Developer, submit a fix. As QA, record a failed test and reject it. As Developer, submit revision 2. As QA, approve it. Confirm status and full authorized history.
5. Attempt direct links and altered requests with each wrong role and another report owner; expect denials. Test hostile code comments, quota exhaustion and provider errors; expect no code execution or status mutation.
6. Repeat smoke tests in development deployment. Release to production only after official SoC LLM configuration, separate production data, passing CI, and team review are verified.

Refer to `contracts/workflow.md` and `data-model.md` for expected behavior.
