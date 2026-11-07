-- QA decisions also publish their feedback to the Reporter (spec 001, User Story 3, scenario 2:
-- rejection feedback must be visible to the Developer and the Reporter).
--
-- The Developer already reads qa_decisions. The Reporter reads bug_feedback, which browsers cannot
-- write: its writers must derive author and role from the session. decide_fix is that trusted
-- writer, so the feedback row is added in the same transaction as the decision and cannot be
-- forged, lost, or recorded without the decision.
--
-- bug_feedback allows at most 2000 characters, fewer than qa_decisions (5000). Rather than
-- truncate silently, longer feedback is refused before anything is written.
--
-- The caller must also still hold the QA role, not just be the stored qa_id, matching the
-- current-role rule 20261105000300_reporter_role_access.sql applied to reads.

create or replace function public.decide_fix(revision uuid, verdict public.qa_verdict, feedback text default '')
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  report uuid;
  latest uuid;
  -- Trim all whitespace (btrim alone strips only spaces), so a newline is not a note.
  note text := regexp_replace(coalesce(feedback, ''), '^\s+|\s+$', '', 'g');
  next_status public.bug_status :=
    case when verdict = 'approve' then 'closed'::public.bug_status else 'in_progress'::public.bug_status end;
begin
  if (select public.current_app_role()) is distinct from 'qa' then
    raise exception 'only QA testers can decide fixes' using errcode = '42501';
  end if;
  if char_length(note) > 2000 then
    raise exception 'feedback must be at most 2000 characters' using errcode = '22001';
  end if;

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

  -- The qa_decisions check still rejects a rejection without feedback.
  insert into public.qa_decisions (revision_id, qa_id, verdict, feedback)
  values (revision, me, verdict, note);

  if note <> '' then
    insert into public.bug_feedback (report_id, author_id, author_role, body)
    values (report, me, 'qa', note);
  end if;

  update public.bug_reports set status = next_status where id = report;
  insert into public.status_events (report_id, actor_id, from_status, to_status)
  values (report, me, 'awaiting_qa', next_status);
end;
$$;
