-- Reporter read-only fix comparison against the shared lifecycle schema.
begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

insert into auth.users (id, email) values
  ('40000000-0000-4000-8000-000000000001', 'compare-reporter1@example.test'),
  ('40000000-0000-4000-8000-000000000002', 'compare-reporter2@example.test'),
  ('40000000-0000-4000-8000-000000000003', 'compare-developer@example.test'),
  ('40000000-0000-4000-8000-000000000004', 'compare-qa@example.test');
update public.profiles set role = 'developer' where id = '40000000-0000-4000-8000-000000000003';
update public.profiles set role = 'qa' where id = '40000000-0000-4000-8000-000000000004';

insert into public.bug_reports (id, reporter_id, developer_id, title, code, expected_behavior, actual_behavior, reproduction_steps, status)
values
  ('50000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000003', 'Closed comparison', 'print(0)', 'Works', 'Fails', 'Run', 'closed'),
  ('50000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000002', null, 'Other comparison', 'print(9)', 'Works', 'Fails', 'Run', 'open');
insert into public.fix_revisions (id, report_id, revision_number, author_id, code, note, created_at)
values
  ('60000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001', 1, '40000000-0000-4000-8000-000000000003', 'print(1)', 'First fix', '2026-11-06 10:00:00+00'),
  ('60000000-0000-4000-8000-000000000002', '50000000-0000-4000-8000-000000000001', 2, '40000000-0000-4000-8000-000000000003', 'print(2)', 'Second fix', '2026-11-06 09:00:00+00'),
  ('60000000-0000-4000-8000-000000000003', '50000000-0000-4000-8000-000000000002', 1, '40000000-0000-4000-8000-000000000003', 'print(10)', 'Private fix', '2026-11-06 11:00:00+00');

select ok((select relrowsecurity from pg_class where oid = 'public.fix_revisions'::regclass), 'revision RLS enabled');
select ok(not has_table_privilege('authenticated', 'public.fix_revisions', 'INSERT'), 'Reporter cannot insert revision');
select ok(not has_table_privilege('authenticated', 'public.fix_revisions', 'UPDATE'), 'Reporter cannot update revision');
select ok(not has_table_privilege('authenticated', 'public.fix_revisions', 'DELETE'), 'Reporter cannot delete revision');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"40000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select is((select count(*)::int from public.fix_revisions), 2, 'owner sees two revisions on closed report');
select is((select string_agg(revision_number::text, ',' order by revision_number desc) from public.fix_revisions), '2,1', 'version number determines latest despite timestamps');
select is((select count(*)::int from public.fix_revisions where report_id = '50000000-0000-4000-8000-000000000002'), 0, 'direct foreign revision query returns no rows');
select is((select status::text from public.bug_reports where id = '50000000-0000-4000-8000-000000000001'), 'closed', 'closed report remains visible');
select set_config('request.jwt.claims', '{"sub":"40000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
select is((select count(*)::int from public.fix_revisions), 1, 'second Reporter sees only own revision');
select set_config('request.jwt.claims', '{"sub":"40000000-0000-4000-8000-000000000004","role":"authenticated"}', true);
select is((select count(*)::int from public.fix_revisions), 0, 'unassigned QA cannot read Reporter revision');

reset role;
update public.profiles set role = 'developer' where id = '40000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"40000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select is((select count(*)::int from public.fix_revisions), 0, 'role change revokes former Reporter read');
select is((select count(*)::int from public.bug_reports where id = '50000000-0000-4000-8000-000000000001'), 0, 'role change revokes former Reporter report read');

reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select is((select count(*)::int from public.fix_revisions where report_id = '50000000-0000-4000-8000-000000000001'), 0, 'anonymous direct revision query returns no rows');

select * from finish();
rollback;
