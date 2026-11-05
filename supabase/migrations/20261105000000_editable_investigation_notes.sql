-- Allow a Developer to correct their own investigation note before QA handoff.
-- The note row remains immutable after the report enters awaiting_qa.
alter table public.investigation_notes
  add column updated_at timestamptz not null default now();

create or replace function public.touch_investigation_note_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger investigation_notes_updated_at
  before update on public.investigation_notes
  for each row execute function public.touch_investigation_note_updated_at();

create policy "notes: author edits before qa" on public.investigation_notes
  for update to authenticated
  using (
    author_id = (select auth.uid())
    and exists (
      select 1 from public.bug_reports r
      where r.id = report_id and r.status in ('open', 'in_progress')
    )
  )
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1 from public.bug_reports r
      where r.id = report_id and r.developer_id = (select auth.uid())
        and r.status in ('open', 'in_progress')
    )
  );

revoke update on public.investigation_notes from authenticated;
grant update (body) on public.investigation_notes to authenticated;

