-- Automatic assignment (issue #15): least-loaded Developer and QA tester, closed reports ignored,
-- explicit assignments kept, no eligible account leaves the report unassigned.
begin;

create extension if not exists pgtap with schema extensions;

select plan(16);

create function pg_temp.act_as(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  select set_config('role', 'authenticated', true);
$$;

create function pg_temp.report(title text) returns uuid language sql as $$
  insert into public.bug_reports (reporter_id, title, code, expected_behavior, actual_behavior, reproduction_steps)
  values ('00000000-0000-4000-8000-0000000002a1', title, 'x = 1', 'e', 'a', 'r')
  returning id;
$$;

insert into auth.users (id, email) values ('00000000-0000-4000-8000-0000000002a1', 'assign-reporter@test.local');

-- Other tests' fixtures are rolled back, but seed data could exist: start from no Developers or QA.
update public.profiles set role = 'reporter' where role in ('developer', 'qa');

-- ---------------------------------------------------------------------------
-- Nobody to assign yet
-- ---------------------------------------------------------------------------

select pg_temp.act_as('00000000-0000-4000-8000-0000000002a1');
select lives_ok($$ select pg_temp.report('before any staff') $$, 'a report can be submitted with no Developer or QA account');
reset role;
select results_eq(
  $$ select developer_id, qa_id from public.bug_reports where title = 'before any staff' $$,
  $$ values (null::uuid, null::uuid) $$,
  'with no eligible accounts the report stays unassigned'
);

-- ---------------------------------------------------------------------------
-- Two Developers and two QA testers; the older account wins ties
-- ---------------------------------------------------------------------------

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000002b1', 'assign-dev-old@test.local'),
  ('00000000-0000-4000-8000-0000000002b2', 'assign-dev-new@test.local'),
  ('00000000-0000-4000-8000-0000000002c1', 'assign-qa-old@test.local'),
  ('00000000-0000-4000-8000-0000000002c2', 'assign-qa-new@test.local');
update public.profiles set role = 'developer', created_at = now() - interval '2 days' where id = '00000000-0000-4000-8000-0000000002b1';
update public.profiles set role = 'developer', created_at = now() - interval '1 day' where id = '00000000-0000-4000-8000-0000000002b2';
update public.profiles set role = 'qa', created_at = now() - interval '2 days' where id = '00000000-0000-4000-8000-0000000002c1';
update public.profiles set role = 'qa', created_at = now() - interval '1 day' where id = '00000000-0000-4000-8000-0000000002c2';

select pg_temp.act_as('00000000-0000-4000-8000-0000000002a1');
select pg_temp.report('first');
select pg_temp.report('second');
select pg_temp.report('third');
reset role;

select results_eq(
  $$ select developer_id::text, qa_id::text from public.bug_reports where title = 'first' $$,
  $$ values ('00000000-0000-4000-8000-0000000002b1', '00000000-0000-4000-8000-0000000002c1') $$,
  'the first report goes to the oldest Developer and QA tester when loads are equal'
);
select results_eq(
  $$ select developer_id::text, qa_id::text from public.bug_reports where title = 'second' $$,
  $$ values ('00000000-0000-4000-8000-0000000002b2', '00000000-0000-4000-8000-0000000002c2') $$,
  'the next report goes to the less-loaded people'
);
select results_eq(
  $$ select developer_id::text from public.bug_reports where title = 'third' $$,
  $$ values ('00000000-0000-4000-8000-0000000002b1') $$,
  'with loads equal again, assignment returns to the oldest account'
);

-- ---------------------------------------------------------------------------
-- Closed reports do not count as load
-- ---------------------------------------------------------------------------

update public.bug_reports set status = 'closed' where title in ('first', 'third');
select pg_temp.act_as('00000000-0000-4000-8000-0000000002a1');
select pg_temp.report('after closing');
reset role;
select results_eq(
  $$ select developer_id::text from public.bug_reports where title = 'after closing' $$,
  $$ values ('00000000-0000-4000-8000-0000000002b1') $$,
  'closed reports are not counted, so the Developer who closed two is free again'
);

-- ---------------------------------------------------------------------------
-- The assigned people can act; a Reporter still cannot choose
-- ---------------------------------------------------------------------------

select pg_temp.act_as('00000000-0000-4000-8000-0000000002b2');
select isnt_empty(
  $$ select 1 from public.bug_reports where title = 'second' $$,
  'the automatically assigned Developer sees the report'
);
select lives_ok(
  $$ select public.start_work((select id from public.bug_reports where title = 'second')) $$,
  'and can start work on it'
);

select pg_temp.act_as('00000000-0000-4000-8000-0000000002a1');
select throws_ok(
  $$ insert into public.bug_reports (reporter_id, developer_id, title, code, expected_behavior, actual_behavior, reproduction_steps)
     values ('00000000-0000-4000-8000-0000000002a1', '00000000-0000-4000-8000-0000000002b2', 't', 'c', 'e', 'a', 'r') $$,
  '42501', null,
  'a Reporter cannot choose the Developer'
);
reset role;

insert into public.bug_reports (reporter_id, developer_id, qa_id, title, code, expected_behavior, actual_behavior, reproduction_steps)
values ('00000000-0000-4000-8000-0000000002a1', '00000000-0000-4000-8000-0000000002b2',
        '00000000-0000-4000-8000-0000000002c2', 'explicit', 'c', 'e', 'a', 'r');
select results_eq(
  $$ select developer_id::text, qa_id::text from public.bug_reports where title = 'explicit' $$,
  $$ values ('00000000-0000-4000-8000-0000000002b2', '00000000-0000-4000-8000-0000000002c2') $$,
  'an explicit team assignment is kept'
);

insert into public.bug_reports (reporter_id, developer_id, title, code, expected_behavior, actual_behavior, reproduction_steps)
values ('00000000-0000-4000-8000-0000000002a1', '00000000-0000-4000-8000-0000000002b1', 'developer only', 'c', 'e', 'a', 'r');
select is(
  (select qa_id from public.bug_reports where title = 'developer only'),
  null,
  'a partly assigned report is left as the team set it'
);

-- A Developer is never given a report they filed. With b1 briefly not a Developer, b2 is the only
-- Developer, and b2 filed this report, so nobody is eligible.
update public.profiles set role = 'reporter' where id = '00000000-0000-4000-8000-0000000002b1';
insert into public.bug_reports (reporter_id, title, code, expected_behavior, actual_behavior, reproduction_steps)
values ('00000000-0000-4000-8000-0000000002b2', 'filed by a future developer', 'c', 'e', 'a', 'r');
update public.profiles set role = 'developer' where id = '00000000-0000-4000-8000-0000000002b1';
select is(
  (select developer_id from public.bug_reports where title = 'filed by a future developer'),
  null,
  'nobody is assigned to fix a report they filed themselves'
);

-- ---------------------------------------------------------------------------
-- Submission limit: 20 reports an hour per Reporter
-- ---------------------------------------------------------------------------

insert into auth.users (id, email) values ('00000000-0000-4000-8000-0000000002a2', 'assign-flood@test.local');
insert into public.bug_reports (reporter_id, title, code, expected_behavior, actual_behavior, reproduction_steps)
select '00000000-0000-4000-8000-0000000002a2', 'flood ' || n, 'c', 'e', 'a', 'r' from generate_series(1, 19) n;
select pg_temp.act_as('00000000-0000-4000-8000-0000000002a2');
select lives_ok(
  $$ insert into public.bug_reports (reporter_id, title, code, expected_behavior, actual_behavior, reproduction_steps)
     values ('00000000-0000-4000-8000-0000000002a2', 'flood 20', 'c', 'e', 'a', 'r') $$,
  'a Reporter can file a 20th report in an hour'
);
select throws_ok(
  $$ insert into public.bug_reports (reporter_id, title, code, expected_behavior, actual_behavior, reproduction_steps)
     values ('00000000-0000-4000-8000-0000000002a2', 'flood 21', 'c', 'e', 'a', 'r') $$,
  '54000', null,
  'the 21st report in an hour is refused'
);
reset role;
-- Requests made with the secret key carry the service_role claim.
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select lives_ok(
  $$ insert into public.bug_reports (reporter_id, title, code, expected_behavior, actual_behavior, reproduction_steps)
     values ('00000000-0000-4000-8000-0000000002a2', 'team import', 'c', 'e', 'a', 'r') $$,
  'the team''s own inserts are not limited'
);

select ok(
  not has_function_privilege('authenticated', 'public.assign_report_reviewers()', 'execute'),
  'users cannot call the assignment function directly'
);

select * from finish();

rollback;
