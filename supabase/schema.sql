-- Booktau database schema
-- Run this once in Supabase → SQL Editor

create extension if not exists "pgcrypto";

create table shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id),
  slug text unique not null,
  name text not null,
  category text not null default 'barbershop',
  created_at timestamptz default now()
);

create table shop_hours (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references shops(id) on delete cascade,
  day_key text not null check (day_key in ('mon','tue','wed','thu','fri','sat','sun')),
  closed boolean not null default false,
  open_time text,
  close_time text,
  lunch_start text,
  lunch_end text,
  unique(shop_id, day_key)
);

create table services (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references shops(id) on delete cascade,
  name text not null,
  price integer not null,
  duration_minutes integer not null,
  created_at timestamptz default now()
);

create table blocked_dates (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references shops(id) on delete cascade,
  date date not null,
  unique(shop_id, date)
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references shops(id) on delete cascade,
  service_id uuid references services(id),
  service_name text not null,
  price integer not null,
  duration_minutes integer not null,
  booking_date date not null,
  booking_time text not null,
  customer_name text not null,
  customer_phone text not null,
  created_at timestamptz default now()
);

create index idx_bookings_shop_date on bookings(shop_id, booking_date);
create index idx_bookings_phone on bookings(customer_phone);

-- Row Level Security
alter table shops enable row level security;
alter table shop_hours enable row level security;
alter table services enable row level security;
alter table blocked_dates enable row level security;
alter table bookings enable row level security;

-- Anyone can read shop info, hours, services, blocked dates — needed for the public booking page
create policy "Public read shops" on shops for select using (true);
create policy "Public read hours" on shop_hours for select using (true);
create policy "Public read services" on services for select using (true);
create policy "Public read blocked dates" on blocked_dates for select using (true);

-- Bookings are created only via public.create_booking() — not direct INSERT from clients.
-- See supabase/migrations/001_booking_integrity.sql for get_shop_booking_slots + create_booking.

-- These are RESTRICTIVE, not permissive — Postgres OR's multiple permissive
-- policies together, so a plain policy here would do nothing against the
-- "with check (true)" policy above. Restrictive policies AND with the permissive
-- ones instead, so both of these actually subtract from what's allowed.
--
-- The count check runs through a SECURITY DEFINER function rather than a plain
-- subquery on `bookings` directly — a subquery on the same table a policy
-- protects re-triggers that policy, causing "infinite recursion detected in
-- policy" and breaking every insert, not just the ones over the limit. A
-- SECURITY DEFINER function runs as its owner rather than the calling role,
-- which sidesteps that recursion. This was an actual bug caught by running it
-- against a real Postgres instance, not just reading the SQL — worth knowing
-- if you extend these policies later.
create or replace function public.recent_booking_count_for_shop(p_shop_id uuid, p_minutes int)
returns bigint
language sql
security definer
set search_path = public
as $$
  select count(*) from bookings
  where shop_id = p_shop_id
  and created_at > now() - (p_minutes || ' minutes')::interval;
$$;

create or replace function public.recent_booking_count_for_phone(p_phone text, p_minutes int)
returns bigint
language sql
security definer
set search_path = public
as $$
  select count(*) from bookings
  where customer_phone = p_phone
  and created_at > now() - (p_minutes || ' minutes')::interval;
$$;

-- Caps how many bookings one shop can receive in a short window, so a script
-- can't flood a shop's calendar with fake bookings and fill up their real slots.
-- Verified: 20 sequential inserts for one shop succeed, the 21st is rejected.
create policy "Rate limit bookings per shop" on bookings as restrictive for insert with check (
  public.recent_booking_count_for_shop(shop_id, 10) < 20
);

-- Separately caps how many bookings a single phone number can create in that
-- same window — catches a script that rotates target shops but reuses (or
-- doesn't bother varying) the phone number.
-- Verified: 5 sequential inserts from one phone succeed, the 6th is rejected.
create policy "Rate limit bookings per phone" on bookings as restrictive for insert with check (
  public.recent_booking_count_for_phone(customer_phone, 10) < 5
);

-- Only the authenticated owner can create or edit their own shop
create policy "Owners can create own shop" on shops for insert with check (auth.uid() = owner_id);
create policy "Owners can update own shop" on shops for update using (auth.uid() = owner_id);

-- Only the authenticated owner can manage their own hours, services, and blocked dates
create policy "Owners can manage own hours" on shop_hours for all using (
  shop_id in (select id from shops where owner_id = auth.uid())
);
create policy "Owners can manage own services" on services for all using (
  shop_id in (select id from shops where owner_id = auth.uid())
);
create policy "Owners can manage own blocked dates" on blocked_dates for all using (
  shop_id in (select id from shops where owner_id = auth.uid())
);

-- Only the authenticated owner can read their own shop's bookings
create policy "Owners can view own bookings" on bookings for select using (
  shop_id in (select id from shops where owner_id = auth.uid())
);

-- Only the authenticated owner can cancel their own shop's bookings
create policy "Owners can cancel own bookings" on bookings for delete using (
  shop_id in (select id from shops where owner_id = auth.uid())
);

-- ---------------------------------------------------------------------------
-- Booking integrity functions (public slot reads + validated writes)
-- ---------------------------------------------------------------------------

create or replace function public.time_to_minutes(t text)
returns integer
language sql
immutable
as $$
  select (split_part(t, ':', 1)::integer * 60 + split_part(t, ':', 2)::integer);
$$;

create or replace function public.booking_intervals_overlap(
  p_start_a integer,
  p_duration_a integer,
  p_start_b integer,
  p_duration_b integer
)
returns boolean
language sql
immutable
as $$
  select p_start_a < (p_start_b + p_duration_b) and (p_start_a + p_duration_a) > p_start_b;
$$;

create or replace function public.get_shop_booking_slots(p_shop_id uuid)
returns table (
  booking_date date,
  booking_time text,
  duration_minutes integer
)
language sql
security definer
set search_path = public
stable
as $$
  select b.booking_date, b.booking_time, b.duration_minutes
  from bookings b
  where b.shop_id = p_shop_id;
$$;

revoke all on function public.get_shop_booking_slots(uuid) from public;
grant execute on function public.get_shop_booking_slots(uuid) to anon, authenticated;

create or replace function public.create_booking(
  p_shop_id uuid,
  p_service_id uuid,
  p_booking_date date,
  p_booking_time text,
  p_customer_name text,
  p_customer_phone text
)
returns bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_service services%rowtype;
  v_day_key text;
  v_day_hours shop_hours%rowtype;
  v_open_min integer;
  v_close_min integer;
  v_start_min integer;
  v_end_min integer;
  v_lunch_start integer;
  v_lunch_end integer;
  v_today date;
  v_now_min integer;
  v_booking bookings%rowtype;
begin
  p_customer_name := nullif(trim(p_customer_name), '');
  p_customer_phone := nullif(trim(p_customer_phone), '');

  if p_customer_name is null then
    raise exception 'invalid_input' using message = 'Customer name is required';
  end if;
  if p_customer_phone is null or length(p_customer_phone) < 6 then
    raise exception 'invalid_input' using message = 'Valid phone number is required';
  end if;
  if p_booking_time !~ '^\d{2}:\d{2}$' then
    raise exception 'invalid_input' using message = 'Invalid booking time format';
  end if;

  select * into v_service
  from services
  where id = p_service_id and shop_id = p_shop_id;

  if not found then
    raise exception 'invalid_service' using message = 'Service not found for this shop';
  end if;

  if exists (
    select 1 from blocked_dates
    where shop_id = p_shop_id and date = p_booking_date
  ) then
    raise exception 'blocked_date' using message = 'This date is not available';
  end if;

  v_day_key := case extract(dow from p_booking_date)
    when 0 then 'sun' when 1 then 'mon' when 2 then 'tue' when 3 then 'wed'
    when 4 then 'thu' when 5 then 'fri' when 6 then 'sat'
  end;

  select * into v_day_hours
  from shop_hours
  where shop_id = p_shop_id and day_key = v_day_key;

  if not found or v_day_hours.closed or v_day_hours.open_time is null or v_day_hours.close_time is null then
    raise exception 'shop_closed' using message = 'Shop is closed on this day';
  end if;

  v_open_min := public.time_to_minutes(v_day_hours.open_time);
  v_close_min := public.time_to_minutes(v_day_hours.close_time);
  v_start_min := public.time_to_minutes(p_booking_time);
  v_end_min := v_start_min + v_service.duration_minutes;

  if v_start_min < v_open_min or v_end_min > v_close_min then
    raise exception 'outside_hours' using message = 'Selected time is outside working hours';
  end if;

  if v_day_hours.lunch_start is not null and v_day_hours.lunch_end is not null then
    v_lunch_start := public.time_to_minutes(v_day_hours.lunch_start);
    v_lunch_end := public.time_to_minutes(v_day_hours.lunch_end);
    if public.booking_intervals_overlap(v_start_min, v_service.duration_minutes, v_lunch_start, v_lunch_end - v_lunch_start) then
      raise exception 'lunch_break' using message = 'Selected time overlaps lunch break';
    end if;
  end if;

  v_today := (now() at time zone 'Asia/Almaty')::date;
  v_now_min := (
    extract(hour from (now() at time zone 'Asia/Almaty'))::integer * 60
    + extract(minute from (now() at time zone 'Asia/Almaty'))::integer
  );

  if p_booking_date < v_today then
    raise exception 'past_date' using message = 'Cannot book in the past';
  end if;
  if p_booking_date = v_today and v_start_min <= v_now_min then
    raise exception 'past_time' using message = 'Cannot book a time that has already passed';
  end if;

  if public.recent_booking_count_for_shop(p_shop_id, 10) >= 20 then
    raise exception 'rate_limited' using message = 'Too many bookings for this shop — try again later';
  end if;
  if public.recent_booking_count_for_phone(p_customer_phone, 10) >= 5 then
    raise exception 'rate_limited' using message = 'Too many bookings from this phone — try again later';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_shop_id::text || ':' || p_booking_date::text));

  if exists (
    select 1
    from bookings b
    where b.shop_id = p_shop_id
      and b.booking_date = p_booking_date
      and public.booking_intervals_overlap(
        v_start_min,
        v_service.duration_minutes,
        public.time_to_minutes(b.booking_time),
        b.duration_minutes
      )
  ) then
    raise exception 'slot_taken' using message = 'This time slot was just taken — pick another';
  end if;

  insert into bookings (
    shop_id,
    service_id,
    service_name,
    price,
    duration_minutes,
    booking_date,
    booking_time,
    customer_name,
    customer_phone
  ) values (
    p_shop_id,
    v_service.id,
    v_service.name,
    v_service.price,
    v_service.duration_minutes,
    p_booking_date,
    p_booking_time,
    p_customer_name,
    p_customer_phone
  )
  returning * into v_booking;

  return v_booking;
end;
$$;

revoke all on function public.create_booking(uuid, uuid, date, text, text, text) from public;
grant execute on function public.create_booking(uuid, uuid, date, text, text, text) to anon, authenticated;

-- NOTE: owners read/edit only their own shop; public reads shop info via RLS;
-- bookings are written only through create_booking(). Re-verify on a live Supabase project.
