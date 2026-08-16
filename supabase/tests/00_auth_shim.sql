-- Local-only stand-in for what a real Supabase project provides out of the
-- box (the `auth` schema, `auth.uid()`, and the `anon`/`authenticated`
-- roles). This lets schema.sql run unmodified against a plain local
-- Postgres so the RLS policies and functions can be tested without a
-- network connection to Supabase.
--
-- NEVER run this file against a real Supabase project -- it already has
-- real versions of all of this, and creating a fake auth.users table
-- there would break real authentication.

create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text
);

-- Real Supabase's auth.uid() reads the request JWT. Here we read a
-- session-local setting each test connection sets for itself with
-- `set local myapp.uid = '<uuid>'` to simulate "logged in as this user".
create or replace function auth.uid() returns uuid
language sql stable
as $$
  select nullif(current_setting('myapp.uid', true), '')::uuid;
$$;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
end $$;

grant usage on schema auth to anon, authenticated;
grant usage on schema public to anon, authenticated;
