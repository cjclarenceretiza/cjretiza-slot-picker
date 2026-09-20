select slot_start at time zone 'Australia/Brisbane' as slot_local
from get_available_slots(
  'aaaaaaa1-0000-0000-0000-000000000002', -- Josh Petrov
  'ccccccc3-0000-0000-0000-000000000001', -- Fringe Trim, 15 min
  -- pick a Wednesday: adjust offset so dow = 3
  (select d::date from generate_series(current_date, current_date+13, interval '1 day') d
   where extract(dow from d) = 3 limit 1)
);