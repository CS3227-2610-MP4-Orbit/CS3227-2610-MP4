-- Read-side history for Reporter feedback. Future role-specific writers must use
-- a trusted contract that derives the author and source role from the session.
create table public.bug_feedback (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.bug_reports(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  author_role text not null check (author_role in ('developer', 'qa')),
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index bug_feedback_report_created_idx
  on public.bug_feedback (report_id, created_at desc, id desc);

alter table public.bug_feedback enable row level security;

-- Supabase browser roles have no mutation privileges on this relation.
revoke all on public.bug_feedback from public, anon, authenticated;
grant select on public.bug_feedback to authenticated;

create policy "reporters read own feedback" on public.bug_feedback
  for select to authenticated
  using (
    exists (
      select 1 from public.bug_reports report
      where report.id = report_id
        and report.reporter_id = (select auth.uid())
    )
    and exists (
      select 1 from public.profiles profile
      where profile.id = (select auth.uid()) and profile.role = 'reporter'
    )
  );
