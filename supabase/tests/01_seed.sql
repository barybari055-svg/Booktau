-- Two owners, two shops, so isolation between them can be tested.
-- Shop A is open every day 09:00-18:00 with no lunch break, to keep the
-- business-hours math simple everywhere except the tests that specifically
-- target it.
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'owner-a@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'owner-b@test.local');

insert into shops (id, owner_id, slug, name, category) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'shop-a', 'Shop A', 'barbershop'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'shop-b', 'Shop B', 'barbershop');

insert into shop_hours (shop_id, day_key, closed, open_time, close_time, lunch_start, lunch_end)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', d, false, '09:00', '18:00', null, null
from unnest(array['mon','tue','wed','thu','fri','sat','sun']) as d;

insert into services (id, shop_id, name, price, duration_minutes) values
  ('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Haircut', 5000, 30);

-- Belongs to shop B -- used to test that shop A can't be booked using it.
insert into services (id, shop_id, name, price, duration_minutes) values
  ('d2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Shave', 3000, 15);

insert into blocked_dates (shop_id, date) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2026-12-25');
