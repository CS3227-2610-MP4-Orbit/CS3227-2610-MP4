-- New accounts receive the least privileged product role. Elevated roles require
-- a separate trusted provisioning process, still to be agreed by the team.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'reporter' check (role in ('reporter', 'developer', 'qa'))
);
alter table public.profiles enable row level security;
create policy "read own profile" on public.profiles for select to authenticated
  using (id = (select auth.uid()));
grant select on public.profiles to authenticated;

create function public.create_reporter_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, role) values (new.id, 'reporter');
  return new;
end;
$$;
revoke all on function public.create_reporter_profile() from public, anon, authenticated;
create trigger create_reporter_profile_after_signup after insert on auth.users
  for each row execute function public.create_reporter_profile();
insert into public.profiles (id, role)
select id, 'reporter' from auth.users on conflict (id) do nothing;

create table public.bug_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id),
  title text not null check (char_length(btrim(title)) between 1 and 120),
  python_code text not null check (char_length(btrim(python_code)) between 1 and 20000),
  error_message text not null check (char_length(btrim(error_message)) between 1 and 2000),
  expected_behavior text not null check (char_length(btrim(expected_behavior)) between 1 and 2000),
  actual_behavior text not null check (char_length(btrim(actual_behavior)) between 1 and 2000),
  reproduction_steps text not null check (char_length(btrim(reproduction_steps)) between 1 and 2000),
  status text not null default 'open' check (status in ('open', 'in_progress', 'awaiting_qa', 'closed')),
  created_at timestamptz not null default now()
);
create index bug_reports_reporter_created_idx on public.bug_reports (reporter_id, created_at desc);
alter table public.bug_reports enable row level security;

create policy "reporters read own reports" on public.bug_reports for select to authenticated
  using (reporter_id = (select auth.uid()));
create policy "reporters submit own reports" on public.bug_reports for insert to authenticated
  with check (
    reporter_id = (select auth.uid())
    and status = 'open'
    and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'reporter')
  );
grant select on public.bug_reports to authenticated;
grant insert (reporter_id, title, python_code, error_message, expected_behavior, actual_behavior, reproduction_steps)
  on public.bug_reports to authenticated;
