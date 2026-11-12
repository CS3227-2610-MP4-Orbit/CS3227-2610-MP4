-- Enforce current role membership at every Developer lifecycle boundary.
create or replace function public.start_work(report uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
begin
  if (select public.current_app_role()) is distinct from 'developer' then
    raise exception 'only Developers can start work' using errcode = '42501';
  end if;

  update public.bug_reports
  set status = 'in_progress'
  where id = report and developer_id = me and status = 'open';
  if not found then
    raise exception 'report not available to start' using errcode = '42501';
  end if;
  insert into public.status_events (report_id, actor_id, from_status, to_status)
  values (report, me, 'open', 'in_progress');
end;
$$;

create or replace function public.submit_fix(report uuid, fixed_code text, submission_note text default '')
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  next_number int;
  revision uuid;
begin
  if (select public.current_app_role()) is distinct from 'developer' then
    raise exception 'only Developers can submit fixes' using errcode = '42501';
  end if;

  -- Locking the report row serialises concurrent submissions for the same report.
  perform 1 from public.bug_reports
  where id = report and developer_id = me and status = 'in_progress'
  for update;
  if not found then
    raise exception 'report not available for a fix' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.investigation_notes
    where report_id = report and author_id = me
  ) then
    raise exception 'investigation notes required before QA handoff' using errcode = '42501';
  end if;

  select coalesce(max(revision_number), 0) + 1 into next_number
  from public.fix_revisions where report_id = report;

  insert into public.fix_revisions (report_id, revision_number, author_id, code, note)
  values (report, next_number, me, fixed_code, coalesce(submission_note, ''))
  returning id into revision;

  update public.bug_reports set status = 'awaiting_qa' where id = report;
  insert into public.status_events (report_id, actor_id, from_status, to_status)
  values (report, me, 'in_progress', 'awaiting_qa');
  return revision;
end;
$$;

drop policy if exists "notes: assigned developer adds" on public.investigation_notes;
create policy "notes: assigned developer adds" on public.investigation_notes
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and (select public.current_app_role()) = 'developer'
    and exists (
      select 1 from public.bug_reports r
      where r.id = report_id and r.developer_id = (select auth.uid())
        and r.status in ('open', 'in_progress')
    )
  );

drop policy if exists "notes: author edits before qa" on public.investigation_notes;
create policy "notes: author edits before qa" on public.investigation_notes
  for update to authenticated
  using (
    author_id = (select auth.uid())
    and (select public.current_app_role()) = 'developer'
    and exists (
      select 1 from public.bug_reports r
      where r.id = report_id and r.status in ('open', 'in_progress')
    )
  )
  with check (
    author_id = (select auth.uid())
    and (select public.current_app_role()) = 'developer'
    and exists (
      select 1 from public.bug_reports r
      where r.id = report_id and r.developer_id = (select auth.uid())
        and r.status in ('open', 'in_progress')
    )
  );
