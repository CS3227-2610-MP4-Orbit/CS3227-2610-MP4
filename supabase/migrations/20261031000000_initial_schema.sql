-- Initial HackHub schema: hackathons, teams, submissions, judging and AI usage accounting.
-- Roles are per hackathon (organiser or judge via hackathon_staff); everyone else is a participant.
-- Row-level security is enabled on every table and access is denied unless a policy allows it.
-- Multi-step writes (joining a team by invite code, auto-assigning judges, publishing results)
-- are added later as security-definer functions, each defined by an approved spec.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.staff_role as enum ('organiser', 'judge');
create type public.hackathon_status as enum ('draft', 'open', 'judging', 'closed');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  created_at timestamptz not null default now()
);

create table public.hackathons (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '' check (char_length(description) <= 5000),
  status public.hackathon_status not null default 'draft',
  starts_at timestamptz not null,
  submission_deadline timestamptz not null,
  max_team_size int not null default 4 check (max_team_size between 1 and 10),
  results_published_at timestamptz,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  check (submission_deadline > starts_at)
);

create table public.hackathon_staff (
  hackathon_id uuid not null references public.hackathons (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.staff_role not null,
  created_at timestamptz not null default now(),
  primary key (hackathon_id, user_id, role)
);

create table public.tracks (
  id uuid primary key default gen_random_uuid(),
  hackathon_id uuid not null references public.hackathons (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  description text not null default '' check (char_length(description) <= 1000),
  unique (hackathon_id, name)
);

-- Weights are percentages; the organiser UI requires them to sum to 100 before opening.
create table public.rubric_criteria (
  id uuid primary key default gen_random_uuid(),
  hackathon_id uuid not null references public.hackathons (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  description text not null default '' check (char_length(description) <= 1000),
  weight int not null check (weight between 1 and 100),
  position int not null default 0,
  unique (hackathon_id, name)
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  hackathon_id uuid not null references public.hackathons (id) on delete cascade,
  track_id uuid references public.tracks (id) on delete set null,
  name text not null check (char_length(name) between 1 and 60),
  -- 128 bits of randomness, so invite codes cannot be guessed.
  invite_code text not null unique default encode(extensions.gen_random_bytes(16), 'hex'),
  looking_for_members boolean not null default false,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  unique (hackathon_id, name)
);

-- hackathon_id is repeated here so one person can be in at most one team per hackathon.
create table public.team_members (
  team_id uuid not null references public.teams (id) on delete cascade,
  hackathon_id uuid not null references public.hackathons (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (team_id, user_id),
  unique (hackathon_id, user_id)
);

-- version increases on every edit, so cached AI briefs are tied to one exact submission.
create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null unique references public.teams (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  write_up text not null default '' check (char_length(write_up) <= 20000),
  repo_url text check (repo_url ~ '^https://'),
  demo_url text check (demo_url ~ '^https://'),
  version int not null default 1,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.judge_assignments (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions (id) on delete cascade,
  judge_id uuid not null references public.profiles (id) on delete cascade,
  conflict_declared boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (submission_id, judge_id)
);

create table public.scores (
  assignment_id uuid not null references public.judge_assignments (id) on delete cascade,
  criterion_id uuid not null references public.rubric_criteria (id) on delete cascade,
  score int not null check (score between 1 and 10),
  comment text not null default '' check (char_length(comment) <= 2000),
  updated_at timestamptz not null default now(),
  primary key (assignment_id, criterion_id)
);

-- Body is stored as plain text and must be escaped when rendered.
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  hackathon_id uuid not null references public.hackathons (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

-- Written and read only by the server (secret key) to enforce LLM quotas and budgets.
create table public.ai_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  feature text not null,
  model text not null,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  cache_hit boolean not null default false,
  created_at timestamptz not null default now()
);

-- Server-only cache of AI outputs, e.g. one Submission Brief per (submission, version).
create table public.ai_cache (
  feature text not null,
  cache_key text not null,
  response jsonb not null,
  model text not null,
  created_at timestamptz not null default now(),
  primary key (feature, cache_key)
);

create index hackathon_staff_user_idx on public.hackathon_staff (user_id);
create index team_members_user_idx on public.team_members (user_id);
create index teams_hackathon_idx on public.teams (hackathon_id);
create index judge_assignments_judge_idx on public.judge_assignments (judge_id);
create index announcements_hackathon_idx on public.announcements (hackathon_id, created_at desc);
create index ai_usage_user_recent_idx on public.ai_usage (user_id, feature, created_at desc);

-- ---------------------------------------------------------------------------
-- Helpers (security definer so policies can call them without recursive RLS checks)
-- ---------------------------------------------------------------------------

create function public.is_hackathon_staff(target uuid, wanted public.staff_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.hackathon_staff
    where hackathon_id = target and user_id = (select auth.uid()) and role = wanted
  )
$$;

create function public.is_team_member(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.team_members
    where team_id = target and user_id = (select auth.uid())
  )
$$;

-- Published hackathons are visible to every signed-in user; drafts only to their organisers.
create function public.can_see_hackathon(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.hackathons h
    where h.id = target
      and (h.status <> 'draft' or public.is_hackathon_staff(h.id, 'organiser'))
  )
$$;

create function public.submission_hackathon(target uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select t.hackathon_id from public.submissions s join public.teams t on t.id = s.team_id
  where s.id = target
$$;

-- Every new auth user gets a profile. Only the display name comes from sign-up metadata.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Whoever creates a hackathon becomes its first organiser.
create function public.handle_new_hackathon()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.hackathon_staff (hackathon_id, user_id, role)
  values (new.id, new.created_by, 'organiser');
  return new;
end;
$$;

create trigger on_hackathon_created
  after insert on public.hackathons
  for each row execute function public.handle_new_hackathon();

-- Each edit bumps the version so stale AI briefs are never reused.
create function public.bump_submission_version()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.version := old.version + 1;
  new.updated_at := now();
  return new;
end;
$$;

create trigger on_submission_updated
  before update on public.submissions
  for each row execute function public.bump_submission_version();

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.hackathons enable row level security;
alter table public.hackathon_staff enable row level security;
alter table public.tracks enable row level security;
alter table public.rubric_criteria enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.submissions enable row level security;
alter table public.judge_assignments enable row level security;
alter table public.scores enable row level security;
alter table public.announcements enable row level security;
alter table public.ai_usage enable row level security;
alter table public.ai_cache enable row level security;

-- profiles: display names are visible to signed-in users; each user edits only their own.
create policy "profiles: signed-in users read" on public.profiles
  for select to authenticated using (true);

create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- hackathons
create policy "hackathons: read visible" on public.hackathons
  for select to authenticated using (public.can_see_hackathon(id));

create policy "hackathons: create as self" on public.hackathons
  for insert to authenticated with check (created_by = (select auth.uid()));

create policy "hackathons: organisers update" on public.hackathons
  for update to authenticated
  using (public.is_hackathon_staff(id, 'organiser'))
  with check (public.is_hackathon_staff(id, 'organiser'));

-- hackathon_staff: users see their own roles; organisers see and manage the event's staff.
create policy "staff: read own or as organiser" on public.hackathon_staff
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_hackathon_staff(hackathon_id, 'organiser'));

create policy "staff: organisers add" on public.hackathon_staff
  for insert to authenticated with check (public.is_hackathon_staff(hackathon_id, 'organiser'));

create policy "staff: organisers remove" on public.hackathon_staff
  for delete to authenticated using (public.is_hackathon_staff(hackathon_id, 'organiser'));

-- tracks and rubric_criteria: readable with the hackathon; organisers manage them.
create policy "tracks: read visible" on public.tracks
  for select to authenticated using (public.can_see_hackathon(hackathon_id));

create policy "tracks: organisers manage" on public.tracks
  for all to authenticated
  using (public.is_hackathon_staff(hackathon_id, 'organiser'))
  with check (public.is_hackathon_staff(hackathon_id, 'organiser'));

create policy "rubric: read visible" on public.rubric_criteria
  for select to authenticated using (public.can_see_hackathon(hackathon_id));

create policy "rubric: organisers manage" on public.rubric_criteria
  for all to authenticated
  using (public.is_hackathon_staff(hackathon_id, 'organiser'))
  with check (public.is_hackathon_staff(hackathon_id, 'organiser'));

-- teams: members and organisers see the full row (including the invite code);
-- teams looking for members are listed via a later function that hides the code.
create policy "teams: members and organisers read" on public.teams
  for select to authenticated
  using (public.is_team_member(id) or public.is_hackathon_staff(hackathon_id, 'organiser'));

create policy "teams: members update" on public.teams
  for update to authenticated
  using (public.is_team_member(id))
  with check (public.is_team_member(id));

-- team_members: visible to teammates and organisers; members may leave.
create policy "team_members: teammates and organisers read" on public.team_members
  for select to authenticated
  using (public.is_team_member(team_id) or public.is_hackathon_staff(hackathon_id, 'organiser'));

create policy "team_members: leave own team" on public.team_members
  for delete to authenticated using (user_id = (select auth.uid()));

-- submissions: the team edits until the deadline; assigned judges read only after it.
create policy "submissions: team reads" on public.submissions
  for select to authenticated using (public.is_team_member(team_id));

create policy "submissions: assigned judges read after deadline" on public.submissions
  for select to authenticated
  using (
    exists (
      select 1 from public.judge_assignments a
      join public.teams t on t.id = submissions.team_id
      join public.hackathons h on h.id = t.hackathon_id
      where a.submission_id = submissions.id
        and a.judge_id = (select auth.uid())
        and now() >= h.submission_deadline
    )
  );

create policy "submissions: organisers read" on public.submissions
  for select to authenticated
  using (public.is_hackathon_staff(public.submission_hackathon(id), 'organiser'));

create policy "submissions: team creates before deadline" on public.submissions
  for insert to authenticated
  with check (
    public.is_team_member(team_id)
    and exists (
      select 1 from public.teams t join public.hackathons h on h.id = t.hackathon_id
      where t.id = team_id and now() < h.submission_deadline
    )
  );

create policy "submissions: team edits before deadline" on public.submissions
  for update to authenticated
  using (
    public.is_team_member(team_id)
    and exists (
      select 1 from public.teams t join public.hackathons h on h.id = t.hackathon_id
      where t.id = team_id and now() < h.submission_deadline
    )
  )
  with check (public.is_team_member(team_id));

-- judge_assignments: judges see their own; organisers manage all for their event.
create policy "assignments: judge reads own" on public.judge_assignments
  for select to authenticated using (judge_id = (select auth.uid()));

create policy "assignments: judge declares conflict or completes" on public.judge_assignments
  for update to authenticated
  using (judge_id = (select auth.uid()))
  with check (judge_id = (select auth.uid()));

create policy "assignments: organisers manage" on public.judge_assignments
  for all to authenticated
  using (public.is_hackathon_staff(public.submission_hackathon(submission_id), 'organiser'))
  with check (public.is_hackathon_staff(public.submission_hackathon(submission_id), 'organiser'));

-- scores: a judge writes scores only on their own, conflict-free assignment;
-- organisers read raw scores for their event.
create policy "scores: judge manages own" on public.scores
  for all to authenticated
  using (
    exists (
      select 1 from public.judge_assignments a
      where a.id = assignment_id and a.judge_id = (select auth.uid()) and not a.conflict_declared
    )
  )
  with check (
    exists (
      select 1 from public.judge_assignments a
      where a.id = assignment_id and a.judge_id = (select auth.uid()) and not a.conflict_declared
    )
  );

create policy "scores: organisers read" on public.scores
  for select to authenticated
  using (
    exists (
      select 1 from public.judge_assignments a
      where a.id = assignment_id
        and public.is_hackathon_staff(public.submission_hackathon(a.submission_id), 'organiser')
    )
  );

-- announcements: readable with the hackathon; organisers post.
create policy "announcements: read visible" on public.announcements
  for select to authenticated using (public.can_see_hackathon(hackathon_id));

create policy "announcements: organisers post" on public.announcements
  for insert to authenticated
  with check (
    created_by = (select auth.uid()) and public.is_hackathon_staff(hackathon_id, 'organiser')
  );

-- ai_usage and ai_cache: no policies; only the server's secret key can read or write them.

-- Helper functions are for policies, not for direct calls by anonymous visitors.
revoke execute on function public.is_hackathon_staff(uuid, public.staff_role) from public, anon;
revoke execute on function public.is_team_member(uuid) from public, anon;
revoke execute on function public.can_see_hackathon(uuid) from public, anon;
revoke execute on function public.submission_hackathon(uuid) from public, anon;

-- Column limits: policies decide which rows a user may update, these grants decide which columns.
revoke update on public.teams from authenticated;
grant update (name, track_id, looking_for_members) on public.teams to authenticated;

revoke update on public.judge_assignments from authenticated;
grant update (conflict_declared, completed_at) on public.judge_assignments to authenticated;
grant update on public.judge_assignments to service_role;

revoke update on public.submissions from authenticated;
grant update (title, write_up, repo_url, demo_url) on public.submissions to authenticated;
