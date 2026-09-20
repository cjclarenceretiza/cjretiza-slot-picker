create or replace function get_available_slots(
  p_staff_id   uuid,
  p_service_id uuid,
  p_date       date
)
returns table (slot_start timestamptz)
language plpgsql
stable
as $$
declare
  v_salon_id   uuid;
  v_tz         text;
  v_duration   int;
  v_is_active  boolean;
  v_qualified  boolean;
  v_dow        int;
  v_opens_at   time;
  v_closes_at  time;
  v_day_start  timestamptz; 
begin
  -- Staff + salon + active flag
  select s.salon_id, sal.timezone, s.is_active
    into v_salon_id, v_tz, v_is_active
  from staff s
  join salons sal on sal.id = s.salon_id
  where s.id = p_staff_id;

  if v_salon_id is null then
    return; -- No such staff member
  end if;

  if not v_is_active then
    return; -- Staff must be active
  end if;

  select exists (
    select 1 from staff_services ss
    where ss.staff_id = p_staff_id and ss.service_id = p_service_id
  ) into v_qualified;

  if not v_qualified then
    return;
  end if;

  select duration_minutes into v_duration
  from services
  where id = p_service_id;

  if v_duration is null then
    return; -- No such service
  end if;

  -- Day_of_week
  v_dow := extract(dow from p_date);

  -- Staff-specific hours for this day_of_week
  select bh.opens_at, bh.closes_at
    into v_opens_at, v_closes_at
  from business_hours bh
  where bh.salon_id = v_salon_id
    and bh.day_of_week = v_dow
    and bh.staff_id = p_staff_id
  limit 1;

  if v_opens_at is null then
    select bh.opens_at, bh.closes_at
      into v_opens_at, v_closes_at
    from business_hours bh
    where bh.salon_id = v_salon_id
      and bh.day_of_week = v_dow
      and bh.staff_id is null
    limit 1;
  end if;

  if v_opens_at is null then
    return; -- Closed that day
  end if;

  -- Salon's timezone
  v_day_start := (p_date::timestamp) at time zone v_tz;

  return query
  with candidate_slots as (
    select gs as slot_start
    from generate_series(
      v_day_start + v_opens_at,
      v_day_start + v_closes_at - (v_duration || ' minutes')::interval,
      interval '15 minutes'
    ) as gs
  )
  select cs.slot_start
  from candidate_slots cs
  where
    -- Not in the past
    cs.slot_start >= now()
    -- No overlap with an active booking for this staff member
    and not exists (
      select 1 from bookings b
      where b.staff_id = p_staff_id
        and b.status <> 'cancelled'
        and cs.slot_start < b.ends_at
        and (cs.slot_start + (v_duration || ' minutes')::interval) > b.starts_at
    )
    -- No overlap with time off for this staff member
    and not exists (
      select 1 from time_off t
      where t.staff_id = p_staff_id
        and cs.slot_start < t.ends_at
        and (cs.slot_start + (v_duration || ' minutes')::interval) > t.starts_at
    )
  order by cs.slot_start;
end;
$$;

grant execute on function get_available_slots(uuid, uuid, date) to anon, authenticated;
