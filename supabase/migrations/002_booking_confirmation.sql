-- Adds get_booking_for_confirmation(), used by the send-confirmation API
-- route. Safe to run on top of schema.sql or migrations/001 -- only adds
-- one new function, touches nothing existing.
-- Run in Supabase SQL Editor.

create or replace function public.get_booking_for_confirmation(p_booking_id uuid, p_phone text)
returns table (
  shop_name text,
  service_name text,
  booking_date date,
  booking_time text
)
language sql
security definer
set search_path = public
stable
as $$
  select s.name, b.service_name, b.booking_date, b.booking_time
  from bookings b
  join shops s on s.id = b.shop_id
  where b.id = p_booking_id
    and b.customer_phone = p_phone;
$$;

revoke all on function public.get_booking_for_confirmation(uuid, text) from public;
grant execute on function public.get_booking_for_confirmation(uuid, text) to anon, authenticated;
