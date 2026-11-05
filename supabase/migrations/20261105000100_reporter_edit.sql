-- Extend the submitted-report schema for the reporter list/edit slice.
-- A role change revokes reads as well as writes on the next request.
drop policy "reporters read own reports" on public.bug_reports;
create policy "reporters read own reports" on public.bug_reports for select to authenticated
  using (
    reporter_id = (select auth.uid())
    and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'reporter')
  );

revoke update on public.bug_reports from anon, authenticated;
grant update (title, python_code, error_message, expected_behavior, actual_behavior, reproduction_steps)
  on public.bug_reports to authenticated;

create policy "reporters edit own open reports" on public.bug_reports for update to authenticated
  using (
    reporter_id = (select auth.uid())
    and status = 'open'
    and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'reporter')
  )
  with check (
    reporter_id = (select auth.uid())
    and status = 'open'
    and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'reporter')
  );
