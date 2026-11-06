begin;
create extension if not exists pgtap with schema extensions;
select plan(15);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'feedback-reporter1@example.test', '', now(), now(), now()),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'feedback-reporter2@example.test', '', now(), now(), now()),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'feedback-developer@example.test', '', now(), now(), now()),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'feedback-qa@example.test', '', now(), now(), now());
update public.profiles set role = 'developer' where id = '10000000-0000-0000-0000-000000000003';
update public.profiles set role = 'qa' where id = '10000000-0000-0000-0000-000000000004';

insert into public.bug_reports (id, reporter_id, title, code, error_message, expected_behavior, actual_behavior, reproduction_steps, status)
values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'First', 'print(1)', 'error', 'works', 'fails', 'run', 'closed'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Second', 'print(2)', 'error', 'works', 'fails', 'run', 'open');

insert into public.bug_feedback (id, report_id, author_id, author_role, body, created_at)
values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'developer', 'Developer note', '2026-11-05 10:00:00+00'),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'qa', 'QA decision', '2026-11-05 11:00:00+00'),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', 'developer', 'Private note', '2026-11-05 12:00:00+00'),
  ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'developer', 'Tie note', '2026-11-05 11:00:00+00');

select ok((select relrowsecurity from pg_class where oid = 'public.bug_feedback'::regclass), 'RLS enabled');
select ok(not has_table_privilege('anon', 'public.bug_feedback', 'SELECT'), 'anonymous cannot select');
select ok(not has_table_privilege('authenticated', 'public.bug_feedback', 'INSERT'), 'browser cannot insert');
select ok(not has_table_privilege('authenticated', 'public.bug_feedback', 'UPDATE'), 'browser cannot update');
select ok(not has_table_privilege('authenticated', 'public.bug_feedback', 'DELETE'), 'browser cannot delete');
select throws_ok($$ insert into public.bug_feedback (report_id,author_id,author_role,body)
  values ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003','reporter','bad') $$,
  '23514', null, 'source role constrained');
select throws_ok($$ insert into public.bug_feedback (report_id,author_id,author_role,body)
  values ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003','developer',repeat('x',2001)) $$,
  '23514', null, 'body length constrained');
select throws_ok($$ insert into public.bug_feedback (report_id,author_id,author_role,body)
  values ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003','developer','  ') $$,
  '23514', null, 'blank body constrained');

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select is((select count(*)::int from public.bug_feedback), 3, 'owner reads feedback on closed own report');
select is((select string_agg(body, ',' order by created_at desc, id desc) from public.bug_feedback),
  'Tie note,QA decision,Developer note', 'owner reads newest first');
select is((select string_agg(body, ',' order by id desc) from public.bug_feedback
  where created_at = '2026-11-05 11:00:00+00'),
  'Tie note,QA decision', 'equal timestamps use descending id as stable tie-break');
select is((select count(*)::int from public.bug_feedback where report_id = '20000000-0000-0000-0000-000000000002'), 0,
  'direct foreign-report query returns no rows');
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);
select is((select count(*)::int from public.bug_feedback), 1, 'second reporter reads only own entry');
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);
select is((select count(*)::int from public.bug_feedback), 0, 'developer cannot read Reporter feedback');
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000004', true);
select is((select count(*)::int from public.bug_feedback), 0, 'QA cannot read Reporter feedback');

select * from finish();
rollback;
