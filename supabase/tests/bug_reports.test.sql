begin;
create extension if not exists pgtap with schema extensions;
select plan(18);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'reporter1@example.test', '', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'reporter2@example.test', '', now(), now(), now());

select is((select role from public.profiles where id = '00000000-0000-0000-0000-000000000001'), 'reporter', 'new user gets reporter role');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
select lives_ok($$ insert into public.bug_reports (reporter_id,title,python_code,error_message,expected_behavior,actual_behavior,reproduction_steps)
  values ('00000000-0000-0000-0000-000000000001','Bug','print(1)','Error','works','fails','run') $$, 'reporter can submit');
select is((select count(*)::int from public.bug_reports), 1, 'reporter can read own report');
select throws_ok($$ insert into public.bug_reports (reporter_id,title,python_code,error_message,expected_behavior,actual_behavior,reproduction_steps)
  values ('00000000-0000-0000-0000-000000000002','Bug','print(1)','Error','works','fails','run') $$, '42501', null, 'cannot submit as someone else');
update public.profiles set role = 'developer' where id = '00000000-0000-0000-0000-000000000001';
select is((select role from public.profiles where id = '00000000-0000-0000-0000-000000000001'), 'reporter', 'cannot change own role');
select throws_ok($$ insert into public.bug_reports (reporter_id,title,python_code,error_message,expected_behavior,actual_behavior,reproduction_steps,status)
  values ('00000000-0000-0000-0000-000000000001','Bug','print(1)','Error','works','fails','run','closed') $$, '42501', null, 'reporter cannot set status');
select throws_ok($$ insert into public.bug_reports (reporter_id,title,python_code,error_message,expected_behavior,actual_behavior,reproduction_steps)
  values ('00000000-0000-0000-0000-000000000001',repeat('x',121),'print(1)','Error','works','fails','run') $$, '23514', null, 'database rejects oversized title');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', true);
select is((select count(*)::int from public.bug_reports), 0, 'another reporter cannot read the report');
select is((select count(*)::int from public.profiles), 1, 'only own profile visible');

reset role;
update public.profiles set role = 'developer' where id = '00000000-0000-0000-0000-000000000002';
set local role authenticated;
select throws_ok($$ insert into public.bug_reports (reporter_id,title,python_code,error_message,expected_behavior,actual_behavior,reproduction_steps)
  values ('00000000-0000-0000-0000-000000000002','Bug','print(1)','Error','works','fails','run') $$, '42501', null, 'developer cannot submit a report');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
select lives_ok($$ update public.bug_reports set title = 'Edited' where reporter_id = '00000000-0000-0000-0000-000000000001' $$, 'reporter can edit own open report');
select is((select title from public.bug_reports where reporter_id = '00000000-0000-0000-0000-000000000001'), 'Edited', 'own edit is visible');
select throws_ok($$ update public.bug_reports set status = 'closed' where reporter_id = '00000000-0000-0000-0000-000000000001' $$, '42501', null, 'reporter cannot change status');
select throws_ok($$ update public.bug_reports set reporter_id = '00000000-0000-0000-0000-000000000002' where reporter_id = '00000000-0000-0000-0000-000000000001' $$, '42501', null, 'reporter cannot change owner');
select throws_ok($$ update public.bug_reports set title = repeat('x',121) where reporter_id = '00000000-0000-0000-0000-000000000001' $$, '23514', null, 'database rejects oversized edit');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', true);
with changed as (update public.bug_reports set title = 'Stolen' where reporter_id = '00000000-0000-0000-0000-000000000001' returning id)
select is((select count(*)::int from changed), 0, 'other role cannot edit foreign report');

reset role;
update public.bug_reports set status = 'closed' where reporter_id = '00000000-0000-0000-0000-000000000001';
insert into public.bug_reports (reporter_id,title,python_code,error_message,expected_behavior,actual_behavior,reproduction_steps)
  values ('00000000-0000-0000-0000-000000000002','Developer old report','print(2)','Error','works','fails','run');
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
with changed as (update public.bug_reports set title = 'Late edit' where reporter_id = '00000000-0000-0000-0000-000000000001' returning id)
select is((select count(*)::int from changed), 0, 'closed report cannot be edited');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', true);
select is((select count(*)::int from public.bug_reports where reporter_id = '00000000-0000-0000-0000-000000000002'), 0, 'developer cannot read a former reporter-owned report');

select * from finish();
rollback;
