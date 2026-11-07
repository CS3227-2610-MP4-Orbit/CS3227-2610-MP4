-- Automatic assignment (issue #15). The spec leaves assignment to "a controlled team process";
-- without one, a new report never reaches a Developer or QA tester.
--
-- Rule: a new report goes to the Developer and the QA tester with the fewest unclosed reports
-- assigned to them, ties broken by the oldest account, then by id. Closed reports do not count.
-- Nobody is assigned to a report they filed themselves (for example, a Reporter later made a
-- Developer), so no one fixes or verifies their own bug.
--
-- It runs after the insert, as the function owner, because row-level security checks an insert's
-- WITH CHECK after BEFORE triggers: assigning in a BEFORE trigger would break the rule that a
-- Reporter's insert carries no assignees. That rule and the column grants still stop a Reporter
-- from choosing an assignee. Only a report with no assignees at all is assigned, which is every
-- Reporter submission; a report the team assigns explicitly (with the secret key) is left as the
-- team set it. check_report_assignment still validates the roles.
--
-- A transaction-level advisory lock serialises assignment, so two reports submitted at the same
-- moment see each other's load and are spread across people instead of both going to one. The
-- app submits each report in its own short request transaction, so the lock is held briefly; the
-- submission limit below stops one account flooding the queue or the lock.
--
-- Submission limit: a Reporter may file at most 20 reports an hour. The team's secret-key inserts
-- are not limited.

create function public.assign_report_reviewers()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  developer uuid;
  tester uuid;
begin
  if new.developer_id is not null or new.qa_id is not null then
    return null;
  end if;
  perform pg_advisory_xact_lock(hashtext('public.assign_report_reviewers'));

  select p.id into developer
  from public.profiles p
  where p.role = 'developer' and p.id <> new.reporter_id
  order by (select count(*) from public.bug_reports r where r.developer_id = p.id and r.status <> 'closed'),
           p.created_at, p.id
  limit 1;

  select p.id into tester
  from public.profiles p
  where p.role = 'qa' and p.id <> new.reporter_id
  order by (select count(*) from public.bug_reports r where r.qa_id = p.id and r.status <> 'closed'),
           p.created_at, p.id
  limit 1;

  -- No eligible account: leave the report unassigned rather than fail the Reporter's submission.
  if developer is not null or tester is not null then
    update public.bug_reports set developer_id = developer, qa_id = tester where id = new.id;
  end if;
  return null;
end;
$$;

revoke execute on function public.assign_report_reviewers() from public, anon, authenticated;

create trigger assign_report_reviewers
  after insert on public.bug_reports
  for each row execute function public.assign_report_reviewers();

create function public.limit_report_submissions()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.role()) = 'authenticated' and (
    select count(*) from public.bug_reports
    where reporter_id = new.reporter_id and created_at > now() - interval '1 hour'
  ) >= 20 then
    raise exception 'too many reports in the last hour' using errcode = '54000';
  end if;
  return new;
end;
$$;

revoke execute on function public.limit_report_submissions() from public, anon, authenticated;

create trigger limit_report_submissions
  before insert on public.bug_reports
  for each row execute function public.limit_report_submissions();
