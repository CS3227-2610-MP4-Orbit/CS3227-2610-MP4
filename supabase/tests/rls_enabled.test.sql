-- Every table in the public schema has row-level security enabled.
begin;

create extension if not exists pgtap with schema extensions;

select plan(1);

select is_empty(
  $$ select tablename from pg_tables where schemaname = 'public' and not rowsecurity $$,
  'every public table has row-level security enabled'
);

select * from finish();

rollback;
