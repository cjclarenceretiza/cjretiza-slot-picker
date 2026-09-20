insert into salons (id, name, timezone) values
  ('11111111-1111-1111-1111-111111111111', 'Range Beauty Co',   'Australia/Brisbane'),
  ('22222222-2222-2222-2222-222222222222', 'Ponsonby Hair Bar', 'Pacific/Auckland');

insert into staff (id, salon_id, full_name, is_active) values
  ('aaaaaaa1-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Marnie Cole',    true),
  ('aaaaaaa1-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Josh Petrov',    true),
  ('aaaaaaa1-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Dana Whitfield', false),
  ('bbbbbbb2-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Tui Rangi',      true),
  ('bbbbbbb2-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Elise Moreau',   true);

insert into services (id, salon_id, name, duration_minutes, price_cents) values
  ('ccccccc3-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Fringe Trim',      15,  2500),
  ('ccccccc3-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Cut & Blow Wave',  45,  8500),
  ('ccccccc3-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Full Colour',     120, 24000),
  ('ccccccc3-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'Scalp Treatment',  30,  5500),
  ('ddddddd4-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Mens Cut',         30,  4500),
  ('ddddddd4-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Balayage',        180, 32000);

insert into staff_services (staff_id, service_id) values
  ('aaaaaaa1-0000-0000-0000-000000000001', 'ccccccc3-0000-0000-0000-000000000001'),
  ('aaaaaaa1-0000-0000-0000-000000000001', 'ccccccc3-0000-0000-0000-000000000002'),
  ('aaaaaaa1-0000-0000-0000-000000000001', 'ccccccc3-0000-0000-0000-000000000003'),
  ('aaaaaaa1-0000-0000-0000-000000000001', 'ccccccc3-0000-0000-0000-000000000004'),
  ('aaaaaaa1-0000-0000-0000-000000000002', 'ccccccc3-0000-0000-0000-000000000001'),
  ('aaaaaaa1-0000-0000-0000-000000000002', 'ccccccc3-0000-0000-0000-000000000002'),
  ('aaaaaaa1-0000-0000-0000-000000000002', 'ccccccc3-0000-0000-0000-000000000004'),
  ('aaaaaaa1-0000-0000-0000-000000000003', 'ccccccc3-0000-0000-0000-000000000002'),
  ('bbbbbbb2-0000-0000-0000-000000000001', 'ddddddd4-0000-0000-0000-000000000001'),
  ('bbbbbbb2-0000-0000-0000-000000000001', 'ddddddd4-0000-0000-0000-000000000002'),
  ('bbbbbbb2-0000-0000-0000-000000000002', 'ddddddd4-0000-0000-0000-000000000001');

-- Business hours
insert into business_hours (salon_id, staff_id, day_of_week, opens_at, closes_at)
select s.id, null, d, '09:00', '17:00'
from salons s, generate_series(1, 5) d;

insert into business_hours (salon_id, staff_id, day_of_week, opens_at, closes_at)
select s.id, null, 6, '09:00', '13:00' from salons s;

insert into business_hours (salon_id, staff_id, day_of_week, opens_at, closes_at) values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaa1-0000-0000-0000-000000000002', 3, '12:00', '17:00');

-- Bookings: Range Beauty Co, each of the next six weeks
with weeks as (
  select date_trunc('week', now() at time zone 'Australia/Brisbane')::date + 7 * w as monday
  from generate_series(1, 6) w
)
insert into bookings (salon_id, staff_id, service_id, customer_name, starts_at, ends_at, status)
select '11111111-1111-1111-1111-111111111111',
       b.staff_id::uuid,
       b.service_id::uuid,
       b.customer_name,
       ((weeks.monday + b.day_offset) + b.starts) at time zone 'Australia/Brisbane',
       ((weeks.monday + b.day_offset) + b.ends)   at time zone 'Australia/Brisbane',
       b.status
from weeks
cross join (values
  ('aaaaaaa1-0000-0000-0000-000000000001', 'ccccccc3-0000-0000-0000-000000000002', 'Priya N',  0, time '09:00', time '09:45', 'confirmed'),
  ('aaaaaaa1-0000-0000-0000-000000000001', 'ccccccc3-0000-0000-0000-000000000003', 'Hannah L', 0, time '11:00', time '13:00', 'confirmed'),
  ('aaaaaaa1-0000-0000-0000-000000000001', 'ccccccc3-0000-0000-0000-000000000004', 'Rob T',    0, time '14:00', time '14:30', 'cancelled'),
  ('aaaaaaa1-0000-0000-0000-000000000002', 'ccccccc3-0000-0000-0000-000000000002', 'Kim A',    2, time '13:00', time '13:45', 'confirmed')
) as b(staff_id, service_id, customer_name, day_offset, starts, ends, status);

-- Time off: Range Beauty Co, each of the next six weeks
with weeks as (
  select date_trunc('week', now() at time zone 'Australia/Brisbane')::date + 7 * w as monday
  from generate_series(1, 6) w
)
insert into time_off (staff_id, starts_at, ends_at, reason)
select 'aaaaaaa1-0000-0000-0000-000000000001',
       ((weeks.monday + 1) + time '13:00') at time zone 'Australia/Brisbane',
       ((weeks.monday + 1) + time '17:00') at time zone 'Australia/Brisbane',
       'School pickup'
from weeks;

-- Bookings: Ponsonby Hair Bar
with change_day as (
  select g.d::date as sunday
  from generate_series((current_date + 26)::timestamp, (current_date + 420)::timestamp, interval '1 day') as g(d)
  where (((g.d::date + 1)::timestamp at time zone 'Pacific/Auckland')
       - ((g.d::date)::timestamp     at time zone 'Pacific/Auckland')) <> interval '24 hours'
  order by g.d
  limit 1
)
insert into bookings (salon_id, staff_id, service_id, customer_name, starts_at, ends_at, status)
select '22222222-2222-2222-2222-222222222222',
       'bbbbbbb2-0000-0000-0000-000000000001',
       'ddddddd4-0000-0000-0000-000000000001',
       b.customer_name,
       ((change_day.sunday + b.day_offset) + time '10:00') at time zone 'Pacific/Auckland',
       ((change_day.sunday + b.day_offset) + time '10:30') at time zone 'Pacific/Auckland',
       'confirmed'
from change_day
cross join (values ('Sam W', -5), ('Aroha K', 2)) as b(customer_name, day_offset);
