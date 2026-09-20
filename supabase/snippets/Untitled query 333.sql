select slot_start at time zone 'Australia/Brisbane' as slot_local
from get_available_slots(
  'aaaaaaa1-0000-0000-0000-000000000001',
  'ccccccc3-0000-0000-0000-000000000002',
  (current_date + 8)::date
)
order by slot_start desc
limit 5;