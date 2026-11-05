-- Bug lifecycle schema (specs/001-python-bug-lifecycle, task T001).
-- Replaces the earlier HackHub schema: the project moved to a three-role Python bug tracker.
-- Roles: reporter submits a bug, developer submits fix revisions, qa tests and decides.
-- Status: open -> in_progress -> awaiting_qa -> closed, or awaiting_qa -> in_progress on rejection.
-- Lifecycle changes happen only through the security-definer functions below, so every
-- transition is checked and recorded as a status event in one transaction.
-- Row-level security is enabled on every table and access is denied unless a policy allows it.

-- ---------------------------------------------------------------------------
-- Remove the HackHub schema (applied by 20261031000000_initial_schema.sql)
-- ---------------------------------------------------------------------------

drop trigger if exists on_auth_user_created on auth.users;

drop table if exists
  public.scores,
  public.judge_assignments,
  public.submissions,
  public.team_members,
  public.teams,
  public.rubric_criteria,
  public.tracks,
  public.announcements,
  public.hackathon_staff,
  public.hackathons,
  public.ai_cache,
  public.ai_usage,
  public.profiles
  cascade;

drop function if exists public.is_hackathon_staff(uuid, public.staff_role);
drop function if exists public.is_team_member(uuid);
drop function if exists public.can_see_hackathon(uuid);
drop function if exists public.submission_hackathon(uuid);
drop function if exists public.handle_new_hackathon();
drop function if exists public.bump_submission_version();
drop function if exists public.handle_new_user();

drop type if exists public.staff_role;
drop type if exists public.hackathon_status;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.app_role as enum ('reporter', 'developer', 'qa');
create type public.bug_status as enum ('open', 'in_progress', 'awaiting_qa', 'closed');
create type public.test_outcome as enum ('pass', 'fail');
create type public.qa_verdict as enum ('approve', 'reject');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- Role is set by the team's provisioning process (secret key), never by the user.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 120),
  role public.app_role not null default 'reporter',
  created_at timestamptz not null default now()
);

create table public.bug_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id),
  developer_id uuid references public.profiles (id),
  qa_id uuid references public.profiles (id),
  title text not null check (char_length(title) between 1 and 120),
  code text not null check (char_length(code) between 1 and 20000),
  error_message text not null default '' check (char_length(error_message) <= 5000),
  expected_behavior text not null check (char_length(expected_behavior) between 1 and 5000),
  actual_behavior text not null check (char_length(actual_behavior) between 1 and 5000),
  reproduction_steps text not null check (char_length(reproduction_steps) between 1 and 5000),
  status public.bug_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.investigation_notes (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.bug_reports (id) on delete cascade,
  author_id uuid not null references public.profiles (id),
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);

-- Immutable: rows are only inserted by submit_fix and never updated.
create table public.fix_revisions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.bug_reports (id) on delete cascade,
  revision_number int not null check (revision_number >= 1),
  author_id uuid not null references public.profiles (id),
  code text not null check (char_length(code) between 1 and 20000),
  note text not null default '' check (char_length(note) <= 5000),
  created_at timestamptz not null default now(),
  unique (report_id, revision_number)
);

create table public.test_cases (
  id uuid primary key default gen_random_uuid(),
  revision_id uuid not null references public.fix_revisions (id) on delete cascade,
  qa_id uuid not null references public.profiles (id),
  description text not null check (char_length(description) between 1 and 5000),
  expected_result text not null check (char_length(expected_result) between 1 and 5000),
  actual_result text not null check (char_length(actual_result) between 1 and 5000),
  outcome public.test_outcome not null,
  created_at timestamptz not null default now()
);

-- One decision per revision, so a repeated approve or reject cannot create a duplicate.
create table public.qa_decisions (
  id uuid primary key default gen_random_uuid(),
  revision_id uuid not null unique references public.fix_revisions (id) on delete cascade,
  qa_id uuid not null references public.profiles (id),
  verdict public.qa_verdict not null,
  feedback text not null default '' check (char_length(feedback) <= 5000),
  created_at timestamptz not null default now(),
  -- A rejection must tell the developer what to fix.
  check (verdict = 'approve' or char_length(feedback) >= 1)
);

-- Append-only lifecycle history.
create table public.status_events (
  id bigint generated always as identity primary key,
  report_id uuid not null references public.bug_reports (id) on delete cascade,
  actor_id uuid references public.profiles (id),
  from_status public.bug_status,
  to_status public.bug_status not null,
  created_at timestamptz not null default now()
);

-- Server-only AI accounting. Never stores prompts, snippets, responses or keys.
create table public.ai_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  report_id uuid references public.bug_reports (id) on delete set null,
  feature text not null,
  model text not null,
  outcome text not null,
  input_tokens int,
  output_tokens int,
  cached_tokens int,
  latency_ms int,
  retry_count int not null default 0,
  created_at timestamptz not null default now()
);

create index bug_reports_reporter_idx on public.bug_reports (reporter_id, created_at desc);
create index bug_reports_developer_idx on public.bug_reports (developer_id, status);
create index bug_reports_qa_idx on public.bug_reports (qa_id, status);
create index investigation_notes_report_idx on public.investigation_notes (report_id, created_at);
create index fix_revisions_report_idx on public.fix_revisions (report_id, revision_number desc);
create index test_cases_revision_idx on public.test_cases (revision_id);
create index status_events_report_idx on public.status_events (report_id, id);
create index ai_usage_user_recent_idx on public.ai_usage (user_id, feature, created_at desc);

-- ---------------------------------------------------------------------------
-- Helpers (security definer so policies can call them without recursive RLS checks)
-- ---------------------------------------------------------------------------

create function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid())
$$;

-- True when the signed-in user is the report's reporter, assigned developer or assigned QA.
create function public.is_report_participant(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.bug_reports r
    where r.id = target
      and (select auth.uid()) in (r.reporter_id, r.developer_id, r.qa_id)
  )
$$;

create function public.revision_report(target uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select report_id from public.fix_revisions where id = target
$$;

-- Every new auth user gets a reporter profile. Only the display name comes from sign-up metadata.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Assignments must point at accounts holding the matching role.
create function public.check_report_assignment()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.developer_id is not null and not exists (
    select 1 from public.profiles where id = new.developer_id and role = 'developer'
  ) then
    raise exception 'developer_id must belong to a developer' using errcode = '23514';
  end if;
  if new.qa_id is not null and not exists (
    select 1 from public.profiles where id = new.qa_id and role = 'qa'
  ) then
    raise exception 'qa_id must belong to a QA tester' using errcode = '23514';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger check_report_assignment
  before insert or update on public.bug_reports
  for each row execute function public.check_report_assignment();

-- Records the opening event for every new report.
create function public.record_report_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.status_events (report_id, actor_id, from_status, to_status)
  values (new.id, new.reporter_id, null, new.status);
  return new;
end;
$$;

create trigger on_bug_report_created
  after insert on public.bug_reports
  for each row execute function public.record_report_created();

-- ---------------------------------------------------------------------------
-- Lifecycle functions (the only way to change status, add revisions or decide)
-- ---------------------------------------------------------------------------

-- Developer: open -> in_progress.
create function public.start_work(report uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
begin
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

-- Developer: adds the next numbered revision and sends it to QA (in_progress -> awaiting_qa).
create function public.submit_fix(report uuid, fixed_code text, submission_note text default '')
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
  -- Locking the report row serialises concurrent submissions for the same report.
  perform 1 from public.bug_reports
  where id = report and developer_id = me and status = 'in_progress'
  for update;
  if not found then
    raise exception 'report not available for a fix' using errcode = '42501';
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

-- QA: approves (-> closed) or rejects (-> in_progress) the latest awaiting revision.
create function public.decide_fix(revision uuid, verdict public.qa_verdict, feedback text default '')
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  report uuid;
  latest uuid;
  next_status public.bug_status :=
    case when verdict = 'approve' then 'closed'::public.bug_status else 'in_progress'::public.bug_status end;
begin
  select r.id into report
  from public.bug_reports r
  join public.fix_revisions f on f.report_id = r.id
  where f.id = revision and r.qa_id = me and r.status = 'awaiting_qa'
  for update of r;
  if report is null then
    raise exception 'revision not awaiting your decision' using errcode = '42501';
  end if;

  select id into latest from public.fix_revisions
  where report_id = report order by revision_number desc limit 1;
  if latest <> revision then
    raise exception 'only the latest revision can be decided' using errcode = '42501';
  end if;

  insert into public.qa_decisions (revision_id, qa_id, verdict, feedback)
  values (revision, me, verdict, coalesce(feedback, ''));

  update public.bug_reports set status = next_status where id = report;
  insert into public.status_events (report_id, actor_id, from_status, to_status)
  values (report, me, 'awaiting_qa', next_status);
end;
$$;

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.bug_reports enable row level security;
alter table public.investigation_notes enable row level security;
alter table public.fix_revisions enable row level security;
alter table public.test_cases enable row level security;
alter table public.qa_decisions enable row level security;
alter table public.status_events enable row level security;
alter table public.ai_usage enable row level security;

-- profiles: names and roles are visible to signed-in users (needed to show who did what);
-- users may change only their own display name.
create policy "profiles: signed-in users read" on public.profiles
  for select to authenticated using (true);

create policy "profiles: update own name" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- bug_reports: participants read; reporters create and edit their own open reports.
create policy "reports: participants read" on public.bug_reports
  for select to authenticated
  using ((select auth.uid()) in (reporter_id, developer_id, qa_id));

create policy "reports: reporters create own" on public.bug_reports
  for insert to authenticated
  with check (
    reporter_id = (select auth.uid())
    and (select public.current_app_role()) = 'reporter'
    and status = 'open' and developer_id is null and qa_id is null
  );

create policy "reports: reporter edits own open report" on public.bug_reports
  for update to authenticated
  using (reporter_id = (select auth.uid()) and status = 'open')
  with check (reporter_id = (select auth.uid()) and status = 'open');

-- investigation_notes: participants read; the assigned developer adds notes while working.
create policy "notes: participants read" on public.investigation_notes
  for select to authenticated using (public.is_report_participant(report_id));

create policy "notes: assigned developer adds" on public.investigation_notes
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1 from public.bug_reports r
      where r.id = report_id and r.developer_id = (select auth.uid())
        and r.status in ('open', 'in_progress')
    )
  );

-- fix_revisions, qa_decisions, status_events: read-only to participants; written by functions.
create policy "revisions: participants read" on public.fix_revisions
  for select to authenticated using (public.is_report_participant(report_id));

create policy "decisions: participants read" on public.qa_decisions
  for select to authenticated using (public.is_report_participant(public.revision_report(revision_id)));

create policy "events: participants read" on public.status_events
  for select to authenticated using (public.is_report_participant(report_id));

-- test_cases: participants read; the assigned QA records tests on the latest awaiting revision.
create policy "tests: participants read" on public.test_cases
  for select to authenticated using (public.is_report_participant(public.revision_report(revision_id)));

create policy "tests: assigned qa records on latest revision" on public.test_cases
  for insert to authenticated
  with check (
    qa_id = (select auth.uid())
    and exists (
      select 1 from public.fix_revisions f
      join public.bug_reports r on r.id = f.report_id
      where f.id = revision_id
        and r.qa_id = (select auth.uid())
        and r.status = 'awaiting_qa'
        and f.revision_number = (
          select max(revision_number) from public.fix_revisions where report_id = r.id
        )
    )
  );

-- ai_usage: no policies; only the server's secret key can read or write it.

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------

-- Column limits: policies decide which rows, these grants decide which columns.
revoke insert, update on public.bug_reports from authenticated;
grant insert (reporter_id, title, code, error_message, expected_behavior, actual_behavior, reproduction_steps)
  on public.bug_reports to authenticated;
grant update (title, code, error_message, expected_behavior, actual_behavior, reproduction_steps)
  on public.bug_reports to authenticated;

revoke update on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;

-- History tables are append-only for everyone except the service role.
revoke update, delete on public.investigation_notes, public.test_cases from authenticated;
revoke insert, update, delete on public.fix_revisions, public.qa_decisions, public.status_events
  from authenticated;
revoke delete on public.bug_reports from authenticated;

-- Helpers are for policies; lifecycle functions are for signed-in users only.
revoke execute on function public.current_app_role() from public, anon;
revoke execute on function public.is_report_participant(uuid) from public, anon;
revoke execute on function public.revision_report(uuid) from public, anon;
revoke execute on function public.start_work(uuid) from public, anon;
revoke execute on function public.submit_fix(uuid, text, text) from public, anon;
revoke execute on function public.decide_fix(uuid, public.qa_verdict, text) from public, anon;
grant execute on function public.start_work(uuid) to authenticated;
grant execute on function public.submit_fix(uuid, text, text) to authenticated;
grant execute on function public.decide_fix(uuid, public.qa_verdict, text) to authenticated;
