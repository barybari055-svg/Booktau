-- Adds create_shop_with_defaults(), replacing two separate client-side
-- inserts (shops, then shop_hours) that had no error check on the second --
-- a failure there left a shop with zero hours rows and no dashboard-facing
-- way to fix it. Safe to run on top of schema.sql or earlier migrations;
-- only adds one new function, touches nothing existing.
-- Run in Supabase SQL Editor.

create or replace function public.create_shop_with_defaults(p_name text, p_category text)
returns shops
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid := auth.uid();
  v_base_slug text;
  v_slug text;
  v_shop shops%rowtype;
begin
  if v_owner_id is null then
    raise exception using message = 'not_authenticated: You must be logged in to create a shop.';
  end if;

  if p_name is null or trim(p_name) = '' then
    raise exception using message = 'invalid_input: Shop name is required.';
  end if;

  v_base_slug := lower(regexp_replace(trim(p_name), '[^a-zA-Z0-9]+', '', 'g'));
  if v_base_slug = '' then
    v_base_slug := 'myshop';
  end if;

  v_slug := v_base_slug;
  for i in 2..51 loop
    exit when not exists (select 1 from shops where slug = v_slug);
    v_slug := v_base_slug || '-' || i;
  end loop;

  insert into shops (owner_id, name, category, slug)
  values (v_owner_id, trim(p_name), p_category, v_slug)
  returning * into v_shop;

  insert into shop_hours (shop_id, day_key, closed, open_time, close_time, lunch_start, lunch_end)
  values
    (v_shop.id, 'mon', false, '10:00', '19:00', '13:00', '14:00'),
    (v_shop.id, 'tue', false, '10:00', '19:00', '13:00', '14:00'),
    (v_shop.id, 'wed', false, '10:00', '19:00', '13:00', '14:00'),
    (v_shop.id, 'thu', false, '10:00', '19:00', '13:00', '14:00'),
    (v_shop.id, 'fri', false, '10:00', '19:00', '13:00', '14:00'),
    (v_shop.id, 'sat', false, '11:00', '17:00', null, null),
    (v_shop.id, 'sun', true, '10:00', '19:00', null, null);

  return v_shop;
end;
$$;

revoke all on function public.create_shop_with_defaults(text, text) from public;
grant execute on function public.create_shop_with_defaults(text, text) to authenticated;

-- Recovery path for any shop already in the broken state this migration
-- otherwise prevents (a shop with zero shop_hours rows). Safe no-op if
-- hours already exist; only works for a shop the caller actually owns.
create or replace function public.add_default_hours_if_missing(p_shop_id uuid)
returns setof shop_hours
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from shops where id = p_shop_id and owner_id = auth.uid()) then
    raise exception using message = 'not_authorized: You do not own this shop.';
  end if;

  if exists (select 1 from shop_hours where shop_id = p_shop_id) then
    return query select * from shop_hours where shop_id = p_shop_id;
    return;
  end if;

  return query
    insert into shop_hours (shop_id, day_key, closed, open_time, close_time, lunch_start, lunch_end)
    values
      (p_shop_id, 'mon', false, '10:00', '19:00', '13:00', '14:00'),
      (p_shop_id, 'tue', false, '10:00', '19:00', '13:00', '14:00'),
      (p_shop_id, 'wed', false, '10:00', '19:00', '13:00', '14:00'),
      (p_shop_id, 'thu', false, '10:00', '19:00', '13:00', '14:00'),
      (p_shop_id, 'fri', false, '10:00', '19:00', '13:00', '14:00'),
      (p_shop_id, 'sat', false, '11:00', '17:00', null, null),
      (p_shop_id, 'sun', true, '10:00', '19:00', null, null)
    returning *;
end;
$$;

revoke all on function public.add_default_hours_if_missing(uuid) from public;
grant execute on function public.add_default_hours_if_missing(uuid) to authenticated;
