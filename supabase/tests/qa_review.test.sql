-- QA review (spec 001 User Story 3, tasks T012-T014): what the assigned QA tester can see,
-- and that a decision's feedback reaches the Reporter through bug_feedback.
begin;

create extension if not exists pgtap with schema extensions;

select plan(17);

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000001a1', 'qa-review-reporter@test.local'),
  ('00000000-0000-4000-8000-0000000001b1', 'qa-review-developer@test.local'),
  ('00000000-0000-4000-8000-0000000001c1', 'qa-review-qa@test.local'),
  ('00000000-0000-4000-8000-0000000001c2', 'qa-review-other-qa@test.local');
update public.profiles set role = 'developer' where id = '00000000-0000-4000-8000-0000000001b1';
update public.profiles set role = 'qa' where id in ('00000000-0000-4000-8000-0000000001c1', '00000000-0000-4000-8000-0000000001c2');

insert into public.bug_reports (reporter_id, developer_id, qa_id, title, code, expected_behavior, actual_behavior, reproduction_steps)
values ('00000000-0000-4000-8000-0000000001a1', '00000000-0000-4000-8000-0000000001b1', '00000000-0000-4000-8000-0000000001c1',
        'QA review report', 'def first(xs):\n    return xs[0]', 'None for []', 'IndexError', 'first([])');
select set_config('test.report', (select id::text from public.bug_reports where title = 'QA review report'), false);

create function pg_temp.act_as(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  select set_config('role', 'authenticated', true);
$$;

-- Developer hands revision 1 to QA.
select pg_temp.act_as('00000000-0000-4000-8000-0000000001b1');
select public.start_work(current_setting('test.report')::uuid);
select public.submit_fix(current_setting('test.report')::uuid, 'def first(xs):\n    return xs[0] if xs else None', 'Guard empty');

-- ---------------------------------------------------------------------------
-- What QA can see
-- ---------------------------------------------------------------------------

select pg_temp.act_as('00000000-0000-4000-8000-0000000001c1');
select results_eq(
  $$ select status::text from public.bug_reports where qa_id = '00000000-0000-4000-8000-0000000001c1' $$,
  $$ values ('awaiting_qa') $$,
  'the assigned QA tester sees the report in their queue'
);
select is(
  (select code from public.fix_revisions where report_id = current_setting('test.report')::uuid and revision_number = 1),
  'def first(xs):\n    return xs[0] if xs else None',
  'QA reads the submitted fix'
);
select is(
  (select code from public.bug_reports where id = current_setting('test.report')::uuid),
  'def first(xs):\n    return xs[0]',
  'QA reads the original code to compare against'
);

select pg_temp.act_as('00000000-0000-4000-8000-0000000001c2');
select is_empty(
  $$ select 1 from public.bug_reports where id = current_setting('test.report')::uuid $$,
  'an unassigned QA tester does not see the report'
);
select is_empty(
  $$ select 1 from public.fix_revisions where report_id = current_setting('test.report')::uuid $$,
  'an unassigned QA tester does not see its revisions'
);

-- ---------------------------------------------------------------------------
-- Reject: feedback reaches both the Developer and the Reporter
-- ---------------------------------------------------------------------------

select pg_temp.act_as('00000000-0000-4000-8000-0000000001c1');
select throws_ok(
  $$ select public.decide_fix((select id from public.fix_revisions where revision_number = 1
       and report_id = current_setting('test.report')::uuid), 'reject', repeat('x', 2001)) $$,
  '22001', null,
  'feedback longer than the Reporter feedback limit is refused'
);
select is(
  (select status::text from public.bug_reports where id = current_setting('test.report')::uuid),
  'awaiting_qa',
  'a refused decision changes nothing'
);
select throws_ok(
  $$ select public.decide_fix((select id from public.fix_revisions where revision_number = 1
       and report_id = current_setting('test.report')::uuid), 'reject', E'\n\t ') $$,
  '23514', null,
  'whitespace-only feedback (newlines, tabs) does not count as a reason to reject'
);

-- An account moved off QA loses the power to decide, even while still the stored qa_id.
reset role;
update public.profiles set role = 'reporter' where id = '00000000-0000-4000-8000-0000000001c1';
select pg_temp.act_as('00000000-0000-4000-8000-0000000001c1');
select throws_ok(
  $$ select public.decide_fix((select id from public.fix_revisions where revision_number = 1
       and report_id = current_setting('test.report')::uuid), 'approve') $$,
  '42501', null,
  'a former QA tester cannot decide a fix still assigned to them'
);
reset role;
update public.profiles set role = 'qa' where id = '00000000-0000-4000-8000-0000000001c1';
select pg_temp.act_as('00000000-0000-4000-8000-0000000001c1');
select is(
  (select status::text from public.bug_reports where id = current_setting('test.report')::uuid),
  'awaiting_qa',
  'refused decisions left the report awaiting QA'
);

select lives_ok(
  $$ select public.decide_fix((select id from public.fix_revisions where revision_number = 1
       and report_id = current_setting('test.report')::uuid), 'reject', '  first([]) should return None, add a test  ') $$,
  'QA rejects revision 1 with feedback'
);

select pg_temp.act_as('00000000-0000-4000-8000-0000000001a1');
select results_eq(
  $$ select author_role, body from public.bug_feedback where report_id = current_setting('test.report')::uuid $$,
  $$ values ('qa'::text, 'first([]) should return None, add a test'::text) $$,
  'the Reporter sees the QA feedback, trimmed and attributed to QA'
);
select is(
  (select author_id::text from public.bug_feedback where report_id = current_setting('test.report')::uuid),
  '00000000-0000-4000-8000-0000000001c1',
  'the feedback author is the deciding QA tester, taken from the session'
);

select pg_temp.act_as('00000000-0000-4000-8000-0000000001b1');
select is(
  (select feedback from public.qa_decisions d join public.fix_revisions f on f.id = d.revision_id
   where f.report_id = current_setting('test.report')::uuid),
  'first([]) should return None, add a test',
  'the Developer sees the same feedback on the decision'
);

-- ---------------------------------------------------------------------------
-- Approve without a note: the report closes and no empty feedback is published
-- ---------------------------------------------------------------------------

select public.submit_fix(current_setting('test.report')::uuid, 'def first(xs):\n    return xs[0] if xs else None\n', 'Add newline');

select pg_temp.act_as('00000000-0000-4000-8000-0000000001c1');
select lives_ok(
  $$ select public.decide_fix((select id from public.fix_revisions where revision_number = 2
       and report_id = current_setting('test.report')::uuid), 'approve', '   ') $$,
  'QA approves revision 2 without a note'
);
select is(
  (select status::text from public.bug_reports where id = current_setting('test.report')::uuid),
  'closed',
  'approval closes the report'
);

select pg_temp.act_as('00000000-0000-4000-8000-0000000001a1');
select is(
  (select count(*)::int from public.bug_feedback where report_id = current_setting('test.report')::uuid),
  1,
  'an approval without a note adds no feedback entry'
);

select * from finish();

rollback;
