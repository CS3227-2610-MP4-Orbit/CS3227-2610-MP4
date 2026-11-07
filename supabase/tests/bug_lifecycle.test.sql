-- Bug lifecycle and role/relationship access (specs/001-python-bug-lifecycle T002, T005, T009, T012).
-- Walks one report through open -> in_progress -> awaiting_qa -> reject -> revise -> approve -> closed,
-- checking at each step that only the right participant can act and outsiders see nothing.
begin;

create extension if not exists pgtap with schema extensions;

select plan(53);

-- ---------------------------------------------------------------------------
-- Fixtures: two of each role so cross-report and cross-assignment access can be checked.
-- ---------------------------------------------------------------------------

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000000a1', 'reporter@test.local'),
  ('00000000-0000-4000-8000-0000000000a2', 'other-reporter@test.local'),
  ('00000000-0000-4000-8000-0000000000b1', 'developer@test.local'),
  ('00000000-0000-4000-8000-0000000000b2', 'other-developer@test.local'),
  ('00000000-0000-4000-8000-0000000000c1', 'qa@test.local'),
  ('00000000-0000-4000-8000-0000000000c2', 'other-qa@test.local');

select is(
  (select count(*)::int from public.profiles where role = 'reporter'),
  6,
  'new accounts start as reporters'
);

update public.profiles set role = 'developer' where id::text like '%b_';
update public.profiles set role = 'qa' where id::text like '%c_';

create function pg_temp.act_as(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  select set_config('role', 'authenticated', true);
$$;

-- ---------------------------------------------------------------------------
-- Reporter
-- ---------------------------------------------------------------------------

select pg_temp.act_as('00000000-0000-4000-8000-0000000000a1');

select lives_ok(
  $$ insert into public.bug_reports (reporter_id, title, code, expected_behavior, actual_behavior, reproduction_steps)
     values ('00000000-0000-4000-8000-0000000000a1',
             'Average crashes on empty list', 'def avg(xs):\n    return sum(xs) / len(xs)',
             'Returns 0 for []', 'ZeroDivisionError', 'Call avg([])') $$,
  'reporter creates a report'
);

-- Remember the generated id so later steps can name the report.
reset role;
select set_config('test.report', (select id::text from public.bug_reports where title = 'Average crashes on empty list'), false);
select pg_temp.act_as('00000000-0000-4000-8000-0000000000a1');

select is(
  (select status::text from public.bug_reports where id = current_setting('test.report')::uuid),
  'open',
  'a new report is open'
);

select throws_ok(
  $$ insert into public.bug_reports (reporter_id, title, code, expected_behavior, actual_behavior, reproduction_steps)
     values ('00000000-0000-4000-8000-0000000000a2', 't', 'c', 'e', 'a', 'r') $$,
  '42501', null,
  'reporter cannot file a report as someone else'
);

select throws_ok(
  $$ insert into public.bug_reports (reporter_id, title, code, expected_behavior, actual_behavior, reproduction_steps)
     values ('00000000-0000-4000-8000-0000000000a1', '', 'c', 'e', 'a', 'r') $$,
  '23514', null,
  'an empty title is rejected'
);

select throws_ok(
  $$ update public.bug_reports set status = 'closed' where id = current_setting('test.report')::uuid $$,
  '42501', null,
  'reporter cannot change status directly'
);

select throws_ok(
  $$ update public.profiles set role = 'qa' where id = '00000000-0000-4000-8000-0000000000a1' $$,
  '42501', null,
  'users cannot change their own role'
);

update public.bug_reports set title = 'avg() crashes on an empty list'
where id = current_setting('test.report')::uuid;
select is(
  (select title from public.bug_reports where id = current_setting('test.report')::uuid),
  'avg() crashes on an empty list',
  'reporter edits their own open report'
);

select pg_temp.act_as('00000000-0000-4000-8000-0000000000a2');
select is_empty(
  $$ select 1 from public.bug_reports where id = current_setting('test.report')::uuid $$,
  'another reporter cannot see the report'
);
update public.bug_reports set title = 'hijacked' where id = current_setting('test.report')::uuid;

select throws_ok(
  $$ insert into public.bug_reports (reporter_id, title, code, expected_behavior, actual_behavior, reproduction_steps)
     values ('00000000-0000-4000-8000-0000000000b1', 't', 'c', 'e', 'a', 'r') $$,
  '42501', null,
  'cannot file a report on behalf of a developer'
);

-- ---------------------------------------------------------------------------
-- Assignment (team process, done with the service role)
-- ---------------------------------------------------------------------------

reset role;
select is(
  (select title from public.bug_reports where id = current_setting('test.report')::uuid),
  'avg() crashes on an empty list',
  'another reporter''s edit changed nothing'
);

select throws_ok(
  $$ update public.bug_reports set developer_id = '00000000-0000-4000-8000-0000000000c1'
     where id = current_setting('test.report')::uuid $$,
  '23514', null,
  'developer assignment must be a developer account'
);

update public.bug_reports
set developer_id = '00000000-0000-4000-8000-0000000000b1', qa_id = '00000000-0000-4000-8000-0000000000c1'
where id = current_setting('test.report')::uuid;

-- ---------------------------------------------------------------------------
-- Developer
-- ---------------------------------------------------------------------------

select pg_temp.act_as('00000000-0000-4000-8000-0000000000b2');
select is_empty(
  $$ select 1 from public.bug_reports where id = current_setting('test.report')::uuid $$,
  'an unassigned developer cannot see the report'
);
select throws_ok(
  $$ select public.start_work(current_setting('test.report')::uuid) $$,
  '42501', null,
  'an unassigned developer cannot start work'
);

select pg_temp.act_as('00000000-0000-4000-8000-0000000000b1');
select isnt_empty(
  $$ select 1 from public.bug_reports where id = current_setting('test.report')::uuid $$,
  'the assigned developer sees the report'
);
select throws_ok(
  $$ select public.submit_fix(current_setting('test.report')::uuid, 'x') $$,
  '42501', null,
  'a fix cannot be submitted before work starts'
);
select lives_ok(
  $$ select public.start_work(current_setting('test.report')::uuid) $$,
  'the assigned developer starts work'
);
select throws_ok(
  $$ select public.submit_fix(current_setting('test.report')::uuid, 'print(1)') $$,
  '42501', null,
  'the developer cannot hand off without investigation notes'
);
select lives_ok(
  $$ insert into public.investigation_notes (report_id, author_id, body)
     values (current_setting('test.report')::uuid, '00000000-0000-4000-8000-0000000000b1',
             'len([]) is 0, so the division fails') $$,
  'the developer records an investigation note'
);
select lives_ok(
  $$ update public.investigation_notes set body = 'len([]) is 0; guard the empty case'
     where report_id = current_setting('test.report')::uuid
       and author_id = '00000000-0000-4000-8000-0000000000b1' $$,
  'the note author can edit before QA handoff'
);
select is(
  (select body from public.investigation_notes where report_id = current_setting('test.report')::uuid),
  'len([]) is 0; guard the empty case',
  'the edited investigation note is stored'
);
select pg_temp.act_as('00000000-0000-4000-8000-0000000000b2');
select lives_ok(
  $$ update public.investigation_notes set body = 'unauthorized edit'
     where report_id = current_setting('test.report')::uuid $$,
  'an unassigned developer cannot edit the investigation note'
);
select pg_temp.act_as('00000000-0000-4000-8000-0000000000b1');
select is(
  (select body from public.investigation_notes where report_id = current_setting('test.report')::uuid),
  'len([]) is 0; guard the empty case',
  'an unauthorized note edit changes nothing'
);
update public.bug_reports set title = 'changed by dev' where id = current_setting('test.report')::uuid;
select is(
  (select title from public.bug_reports where id = current_setting('test.report')::uuid),
  'avg() crashes on an empty list',
  'the developer cannot edit the report itself'
);
update public.bug_reports set code = 'hijacked' where id = current_setting('test.report')::uuid;
select is(
  (select code from public.bug_reports where id = current_setting('test.report')::uuid),
  'def avg(xs):\n    return sum(xs) / len(xs)',
  'the developer cannot edit original code'
);
select throws_ok(
  $$ insert into public.investigation_notes (report_id, author_id, body, created_at)
     values (current_setting('test.report')::uuid, '00000000-0000-4000-8000-0000000000b1', 'old', '2020-01-01') $$,
  '42501', null,
  'history entries cannot be backdated'
);
select lives_ok(
  $$ select public.submit_fix(current_setting('test.report')::uuid,
       'def avg(xs):\n    return sum(xs) / len(xs) if xs else 0', 'Guard the empty case') $$,
  'the developer submits revision 1'
);
select is(
  (select position('for update' in lower(pg_get_functiondef('public.submit_fix(uuid, text, text)'::regprocedure))) > 0),
  true,
  'submit_fix locks the report before numbering revisions'
);
select is(
  (select status::text from public.bug_reports where id = current_setting('test.report')::uuid),
  'awaiting_qa',
  'submitting a revision creates the QA handoff state'
);
select is(
  (select author_id from public.fix_revisions where report_id = current_setting('test.report')::uuid and revision_number = 1),
  '00000000-0000-4000-8000-0000000000b1'::uuid,
  'the QA handoff identifies the submitting developer'
);
select is(
  has_table_privilege('authenticated', 'public.fix_revisions', 'UPDATE'),
  false,
  'authenticated cannot update revisions directly'
);
select is(
  (select code from public.fix_revisions where report_id = current_setting('test.report')::uuid and revision_number = 1),
  'def avg(xs):\n    return sum(xs) / len(xs) if xs else 0',
  'revision 1 remains immutable'
);
select lives_ok(
  $$ update public.investigation_notes set body = 'late edit'
     where report_id = current_setting('test.report')::uuid
       and author_id = '00000000-0000-4000-8000-0000000000b1' $$,
  'post-handoff note edits are filtered by row-level security'
);
select is(
  (select body from public.investigation_notes where report_id = current_setting('test.report')::uuid),
  'len([]) is 0; guard the empty case',
  'the note remains unchanged after QA handoff'
);
select throws_ok(
  $$ insert into public.fix_revisions (report_id, revision_number, author_id, code)
     values (current_setting('test.report')::uuid, 9, '00000000-0000-4000-8000-0000000000b1', 'x') $$,
  '42501', null,
  'revisions cannot be inserted directly'
);
select throws_ok(
  $$ select public.decide_fix((select id from public.fix_revisions limit 1), 'approve') $$,
  '42501', null,
  'the developer cannot approve their own fix'
);
select throws_ok(
  $$ select public.decide_fix((select id from public.fix_revisions limit 1), 'reject', 'not a QA action') $$,
  '42501', null,
  'the developer cannot reject their own fix'
);

-- ---------------------------------------------------------------------------
-- QA: reject revision 1
-- ---------------------------------------------------------------------------

select pg_temp.act_as('00000000-0000-4000-8000-0000000000c2');
select throws_ok(
  $$ select public.decide_fix((select id from public.fix_revisions where revision_number = 1), 'approve') $$,
  '42501', null,
  'an unassigned QA tester cannot decide'
);

select pg_temp.act_as('00000000-0000-4000-8000-0000000000c1');
select lives_ok(
  $$ insert into public.test_cases (revision_id, qa_id, description, expected_result, actual_result, outcome)
     select id, '00000000-0000-4000-8000-0000000000c1', 'avg([]) returns 0.0', '0.0', '0', 'fail'
     from public.fix_revisions where revision_number = 1 $$,
  'QA records a test case on the latest revision'
);
select throws_ok(
  $$ select public.decide_fix((select id from public.fix_revisions where revision_number = 1), 'reject', '') $$,
  '23514', null,
  'a rejection needs feedback'
);
select lives_ok(
  $$ select public.decide_fix((select id from public.fix_revisions where revision_number = 1), 'reject',
       'Return a float: avg([]) should be 0.0') $$,
  'QA rejects revision 1 with feedback'
);
select is(
  (select status::text from public.bug_reports where id = current_setting('test.report')::uuid),
  'in_progress',
  'a rejection returns the report to the developer'
);

-- ---------------------------------------------------------------------------
-- Developer revises, QA approves revision 2
-- ---------------------------------------------------------------------------

select pg_temp.act_as('00000000-0000-4000-8000-0000000000b1');
select isnt_empty(
  $$ select 1 from public.qa_decisions where verdict = 'reject' $$,
  'the developer sees the rejection feedback'
);
select lives_ok(
  $$ select public.submit_fix(current_setting('test.report')::uuid,
       'def avg(xs):\n    return sum(xs) / len(xs) if xs else 0.0', 'Return 0.0') $$,
  'the developer submits revision 2'
);

select pg_temp.act_as('00000000-0000-4000-8000-0000000000c1');
select throws_ok(
  $$ insert into public.test_cases (revision_id, qa_id, description, expected_result, actual_result, outcome)
     select id, '00000000-0000-4000-8000-0000000000c1', 'stale', 'x', 'y', 'pass'
     from public.fix_revisions where revision_number = 1 $$,
  '42501', null,
  'tests cannot be recorded on an older revision'
);
select lives_ok(
  $$ select public.decide_fix((select id from public.fix_revisions where revision_number = 2), 'approve') $$,
  'QA approves revision 2'
);
select throws_ok(
  $$ select public.decide_fix((select id from public.fix_revisions where revision_number = 2), 'approve') $$,
  '42501', null,
  'a repeated decision is refused'
);
select is(
  (select status::text from public.bug_reports where id = current_setting('test.report')::uuid),
  'closed',
  'approval closes the report'
);

-- ---------------------------------------------------------------------------
-- History and server-only data
-- ---------------------------------------------------------------------------

select pg_temp.act_as('00000000-0000-4000-8000-0000000000a1');
select results_eq(
  $$ select coalesce(from_status::text, '-') || '>' || to_status::text
     from public.status_events where report_id = current_setting('test.report')::uuid order by id $$,
  $$ values ('->open'), ('open>in_progress'), ('in_progress>awaiting_qa'), ('awaiting_qa>in_progress'),
            ('in_progress>awaiting_qa'), ('awaiting_qa>closed') $$,
  'the reporter sees the full, ordered status history'
);
select is(
  (select count(*)::int from public.fix_revisions where report_id = current_setting('test.report')::uuid),
  2,
  'the reporter sees both revisions'
);
update public.bug_reports set title = 'late edit' where id = current_setting('test.report')::uuid;
select is(
  (select title from public.bug_reports where id = current_setting('test.report')::uuid),
  'avg() crashes on an empty list',
  'the reporter cannot edit a closed report'
);
select throws_ok(
  $$ delete from public.status_events $$,
  '42501', null,
  'history cannot be deleted'
);

reset role;
insert into public.ai_usage (user_id, feature, model, outcome)
values ('00000000-0000-4000-8000-0000000000a1', 'code_explanation', 'test-model', 'ok');
select pg_temp.act_as('00000000-0000-4000-8000-0000000000a1');
select is_empty(
  $$ select 1 from public.ai_usage $$,
  'AI usage records are server-only'
);

select * from finish();

rollback;
