# mymg Booking Slot Picker

![Angular](https://img.shields.io/badge/Angular-21-DD0031?logo=angular&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Node](https://img.shields.io/badge/Node-24.20.0-339933?logo=nodedotjs&logoColor=white)

Booking slot picker for MyMG (salon/spa booking software), built with Angular 21, Supabase (local Postgres), and Tailwind CSS. 

### Book a slot

The main screen. Pick a salon, staff member, service, and date, and the
available start times for that combination appear automatically (no
search button — results update as soon as all four fields are chosen).
Only active staff at the selected salon are shown, and only services that
staff member is qualified to perform. Clicking an available time creates
a booking (with a customer name) and immediately refreshes the slot list,
the bookings table, and — if that slot was previously blocked by time off
or an existing booking — the change is reflected without a manual reload.

Availability is computed by a Postgres function (`get_available_slots`)
that checks, for the chosen staff/service/date: the service fits within
working hours, no overlap with an existing (non-cancelled) booking or
time off, the staff member is active and qualified, the slot isn't in the
past, and it falls on a 15-minute boundary. Business hours account for
staff-specific overrides (e.g. a staff member with different hours than
their salon's default on a given day of the week).

### Bookings list

Shown below the slot picker once a staff member and date are selected.
Lists that staff member's bookings for the chosen date — time, customer,
service, and status — with a **Cancel** button on each confirmed booking.
Cancelling sets its status to `cancelled` rather than deleting it, and
immediately frees that time up in the slot picker above.

### Time off

Shown alongside the bookings list. Lists the selected staff member's time
off for the chosen date — start, end, and an optional reason — with
**Add**, **Edit**, and **Delete**. Start/end times are entered and
displayed in the salon's own local time, regardless of what timezone the
browser is in. Adding, editing, or deleting time off immediately updates
the slot picker, since any slots that overlap that block become
unavailable (or become available again if the time off is removed).

## Getting started

```bash
npm install
npx supabase start
npm start
```

Then open `http://localhost:4200`.

`npx supabase start` runs the local Supabase stack in Docker. The seed data
generates dates relative to when it runs, so bookings/time-off will always
be in the future — open the Supabase Studio URL it prints to browse the
seeded tables directly.

To reset the database back to a clean seeded state at any point:

```bash
npx supabase db reset
```

## Node version

v24.20.0

## What I'd do with another four hours

- **Automated tests for the slot logic.** `get_available_slots` is the core
  of the app and the highest-risk piece — I verified it by hand against
  seeded data (staff-specific hour overrides, cancelled bookings not
  blocking slots, exact-boundary overlaps like a slot ending exactly when
  a booking starts) but a pgTAP or plain SQL test suite would catch
  regressions automatically instead of relying on manual re-verification.
- **Request cancellation / debouncing** on slot search. Right now, rapidly
  changing staff/service/date fires a new RPC call each time with no
  cancellation of in-flight requests — a slow earlier response could
  theoretically resolve after a newer one and briefly show stale slots.
- **Multi-day time-off ranges.** The current form only lets you add time
  off within the single date already selected in the slot picker; a real
  version would need its own date range (e.g. "on leave next Mon–Wed").
- **Extract the salon/staff/service selector markup** into its own
  component — it's currently only used once, but duplicating it if a
  second page needed the same selectors would be painful as-is.
- **Friendlier error messages.** Errors from Supabase currently surface
  close to verbatim (e.g. raw constraint violation text) rather than
  being translated into something a salon owner would understand.
- **A loading state for the initial salon list fetch**, and better empty
  states (e.g. what a user sees if a salon has zero active staff).
- **Look into Row Level Security**, even though the task said not to
  spend time on it for this take-home — worth understanding what a real
  multi-tenant version would need before going further.
- **Optimistic UI for booking/cancelling**, rather than waiting for the
  round-trip and full slot-list refetch before the UI updates — would
  make the app feel snappier, especially on a slower connection.

## Known issues / left broken

- **No debouncing on the slot search** — not observed causing
  incorrect results in my testing, but the race is theoretically possible.
- **Deliberate double-submission isn't prevented.** There's a guard against
  a single click firing a handler twice (e.g. a fast double-click before
  the button visually disables), but if a user clicks "Add" or a booking
  slot, waits for it to fully complete, and then clicks again with the
  same inputs, it will create a second identical record — I hit this
  myself while testing time off and confirmed it's expected given the
  current guard's scope, not a bug in the guard itself.
- **No confirmation dialog before destructive actions** (Cancel booking,
  Delete time off) — both fire immediately on click with no "are you
  sure?" step.
- **Minimal client-side form validation.** Time off checks that end time
  is after start time, but doesn't warn if a submitted time-off range
  doesn't actually overlap any bookable hours, or catch other
  not-technically-invalid-but-probably-a-mistake inputs.
- **The Service dropdown depends on the `staff_services` join resolving
  correctly via Supabase's implicit foreign-key relationship** — this
  worked in testing, but I didn't stress-test it against, e.g., a staff
  member qualified for zero services (the dropdown would just be empty,
  which is probably the right behavior, but I didn't explicitly verify
  the empty-state messaging in that exact case).
- **No visual indication while a background refresh is happening** after
  booking/cancelling/adding time off — the slot grid updates correctly,
  but there's no subtle loading state during that specific re-fetch, only
  on the very first search.

## How I used AI

I used Claude (Anthropic) throughout this project for:

- Planning the architecture — deciding to compute slot availability as a
  Postgres function rather than in the Angular layer, given the
  timezone-aware interval logic required.
- Writing the initial `get_available_slots` SQL function, then iteratively
  debugging and verifying it against the seeded data: I ran test queries
  by hand in Supabase Studio and manually cross-checked the output against
  known bookings, time off, and staff-specific business-hours overrides
  before trusting the function.
- Scaffolding the Angular services, models, and the three feature
  components (Book a slot, Bookings list, Time off), which I then wired
  together, tested, and fixed issues in as they came up.
