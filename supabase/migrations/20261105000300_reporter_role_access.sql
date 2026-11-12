-- Keep participant access tied to the account's current role. A profile role
-- change must revoke the former role's direct reads and Reporter edits.
create or replace function public.is_report_participant(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.bug_reports r
    join public.profiles p on p.id = (select auth.uid())
    where r.id = target
      and ((p.role = 'reporter' and r.reporter_id = p.id)
        or (p.role = 'developer' and r.developer_id = p.id)
        or (p.role = 'qa' and r.qa_id = p.id))
  )
$$;

drop policy "reports: participants read" on public.bug_reports;
create policy "reports: participants read" on public.bug_reports
  for select to authenticated
  using (
    ((select public.current_app_role()) = 'reporter' and reporter_id = (select auth.uid()))
    or ((select public.current_app_role()) = 'developer' and developer_id = (select auth.uid()))
    or ((select public.current_app_role()) = 'qa' and qa_id = (select auth.uid()))
  );

drop policy "reports: reporter edits own open report" on public.bug_reports;
create policy "reports: reporter edits own open report" on public.bug_reports
  for update to authenticated
  using (
    reporter_id = (select auth.uid()) and status = 'open'
    and (select public.current_app_role()) = 'reporter'
  )
  with check (
    reporter_id = (select auth.uid()) and status = 'open'
    and (select public.current_app_role()) = 'reporter'
  );
