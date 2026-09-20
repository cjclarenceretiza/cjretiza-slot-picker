create table salons (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  timezone    text not null,          -- IANA timezone name
  created_at  timestamptz not null default now()
);

create table staff (
  id          uuid primary key default gen_random_uuid(),
  salon_id    uuid not null references salons(id) on delete cascade,
  full_name   text not null,
  is_active   boolean not null default true
);

create table services (
  id                uuid primary key default gen_random_uuid(),
  salon_id          uuid not null references salons(id) on delete cascade,
  name              text not null,
  duration_minutes  int not null check (duration_minutes > 0),
  price_cents       int not null
);

-- Which staff member can perform which service.
create table staff_services (
  staff_id    uuid not null references staff(id) on delete cascade,
  service_id  uuid not null references services(id) on delete cascade,
  primary key (staff_id, service_id)
);

-- Opening hours, stored as LOCAL wall-clock time for the salon.
-- day_of_week: 0 = Sunday ... 6 = Saturday
-- staff_id null     = the salon's hours for that day.
-- staff_id not null = that person's hours for that day, replacing the salon's.
create table business_hours (
  id          uuid primary key default gen_random_uuid(),
  salon_id    uuid not null references salons(id) on delete cascade,
  staff_id    uuid references staff(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  opens_at    time not null,
  closes_at   time not null,
  check (closes_at > opens_at)
);

create table time_off (
  id          uuid primary key default gen_random_uuid(),
  staff_id    uuid not null references staff(id) on delete cascade,
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  reason      text,
  check (ends_at > starts_at)
);

create table bookings (
  id             uuid primary key default gen_random_uuid(),
  salon_id       uuid not null references salons(id) on delete cascade,
  staff_id       uuid not null references staff(id),
  service_id     uuid not null references services(id),
  customer_name  text not null,
  starts_at      timestamptz not null,
  ends_at        timestamptz not null,
  status         text not null default 'confirmed'
                 check (status in ('confirmed','cancelled','no_show')),
  created_at     timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index on bookings (staff_id, starts_at);
create index on time_off (staff_id, starts_at);

-- Lets the browser read and write these tables with the anon / publishable key.
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
