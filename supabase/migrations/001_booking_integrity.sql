-- Booking integrity: secure public slot reads + validated booking creation.
-- Run in Supabase SQL Editor AFTER the base schema, or use on fresh installs via schema.sql.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.time_to_minutes(t text)
returns integer
language sql
immutable
as $$
  select (split_part(t, ':', 1)::integer * 60 + split_part(t, ':', 2)::integer);
$$;

-- Two half-open intervals [start, start+duration) overlap when start < other_end AND end > other_start.
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

-- ---------------------------------------------------------------------------
-- Public slot reads (no customer PII)
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- Validated booking creation (single source of truth for writes)
-- ---------------------------------------------------------------------------

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
  -- Input hygiene
  p_customer_name := nullif(trim(p_customer_name), '');
  p_customer_phone := nullif(trim(p_customer_phone), '');

  if p_customer_name is null then
    raise exception using message = 'invalid_input: Customer name is required';
  end if;
  if p_customer_phone is null or length(p_customer_phone) < 6 then
    raise exception using message = 'invalid_input: Valid phone number is required';
  end if;
  if p_booking_time !~ '^\d{2}:\d{2}$' then
    raise exception using message = 'invalid_input: Invalid booking time format';
  end if;

  -- Service must exist and belong to this shop
  select * into v_service
  from services
  where id = p_service_id and shop_id = p_shop_id;

  if not found then
    raise exception using message = 'invalid_service: Service not found for this shop';
  end if;

  -- Blocked date
  if exists (
    select 1 from blocked_dates
    where shop_id = p_shop_id and date = p_booking_date
  ) then
    raise exception using message = 'blocked_date: This date is not available';
  end if;

  -- Working hours for this weekday (matches JS getDayKey: Sun=0 … Sat=6)
  v_day_key := case extract(dow from p_booking_date)
    when 0 then 'sun' when 1 then 'mon' when 2 then 'tue' when 3 then 'wed'
    when 4 then 'thu' when 5 then 'fri' when 6 then 'sat'
  end;

  select * into v_day_hours
  from shop_hours
  where shop_id = p_shop_id and day_key = v_day_key;

  if not found or v_day_hours.closed or v_day_hours.open_time is null or v_day_hours.close_time is null then
    raise exception using message = 'shop_closed: Shop is closed on this day';
  end if;

  v_open_min := public.time_to_minutes(v_day_hours.open_time);
  v_close_min := public.time_to_minutes(v_day_hours.close_time);
  v_start_min := public.time_to_minutes(p_booking_time);
  v_end_min := v_start_min + v_service.duration_minutes;

  if v_start_min < v_open_min or v_end_min > v_close_min then
    raise exception using message = 'outside_hours: Selected time is outside working hours';
  end if;

  if v_day_hours.lunch_start is not null and v_day_hours.lunch_end is not null then
    v_lunch_start := public.time_to_minutes(v_day_hours.lunch_start);
    v_lunch_end := public.time_to_minutes(v_day_hours.lunch_end);
    if public.booking_intervals_overlap(v_start_min, v_service.duration_minutes, v_lunch_start, v_lunch_end - v_lunch_start) then
      raise exception using message = 'lunch_break: Selected time overlaps lunch break';
    end if;
  end if;

  -- Past slots: use Asia/Almaty until shops have their own timezone column (ADR-001)
  v_today := (now() at time zone 'Asia/Almaty')::date;
  v_now_min := (
    extract(hour from (now() at time zone 'Asia/Almaty'))::integer * 60
    + extract(minute from (now() at time zone 'Asia/Almaty'))::integer
  );

  if p_booking_date < v_today then
    raise exception using message = 'past_date: Cannot book in the past';
  end if;
  if p_booking_date = v_today and v_start_min <= v_now_min then
    raise exception using message = 'past_time: Cannot book a time that has already passed';
  end if;

  -- Rate limits (same caps as RLS policies; enforced here because SECURITY DEFINER bypasses RLS)
  if public.recent_booking_count_for_shop(p_shop_id, 10) >= 20 then
    raise exception using message = 'rate_limited: Too many bookings for this shop — try again later';
  end if;
  if public.recent_booking_count_for_phone(p_customer_phone, 10) >= 5 then
    raise exception using message = 'rate_limited: Too many bookings from this phone — try again later';
  end if;

  -- Serialize concurrent bookings for the same shop/day
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
    raise exception using message = 'slot_taken: This time slot was just taken — pick another';
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

-- ---------------------------------------------------------------------------
-- Lock down direct client inserts (bookings must go through create_booking)
-- ---------------------------------------------------------------------------

drop policy if exists "Public can create bookings" on bookings;
