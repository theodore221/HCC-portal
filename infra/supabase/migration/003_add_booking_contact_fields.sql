-- Migration: add booking contact fields and chapel flag
-- Adds columns introduced after initial schema migration and refreshes the snapshot RPC.

alter table public.bookings
  add column if not exists contact_name text;

alter table public.bookings
  add column if not exists contact_phone text;

alter table public.bookings
  add column if not exists event_type text;

alter table public.bookings
  add column if not exists chapel_required boolean not null default false;

-- Backfill chapel_required if any existing reservations include the Chapel space.
update public.bookings b
set chapel_required = true
from public.space_reservations sr
where sr.booking_id = b.id
  and sr.space_id = 'Chapel';

create or replace function public.upsert_booking_snapshot(snap jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  bid uuid;
  start_d date := (snap->'range'->>'start')::date;
  end_d   date := (snap->'range'->>'end')::date;
begin
  insert into public.bookings as b (
    external_id,
    form_response_id,
    customer_email,
    customer_name,
    contact_name,
    contact_phone,
    booking_type,
    event_type,
    is_overnight,
    headcount,
    arrival_date,
    departure_date,
    catering_required,
    chapel_required,
    status,
    notes
  ) values (
    nullif(snap->>'bookingId',''),
    nullif(snap->>'formResponseId',''),
    snap->>'email',
    snap->>'org',
    nullif(snap->>'contactName',''),
    nullif(snap->>'contactPhone',''),
    coalesce(nullif(snap->>'bookingType',''), case when coalesce(snap->>'org','') <> '' then 'Group' else 'Individual' end),
    nullif(snap->>'eventType',''),
    coalesce((snap->>'overnight')::boolean, true),
    coalesce((snap->>'headcount')::int, 0),
    start_d,
    end_d,
    coalesce((snap->'catering'->>'required')::boolean, false),
    coalesce((snap->>'chapelRequired')::boolean, false),
    coalesce(nullif(snap->>'status','')::public.booking_status, 'Pending'),
    snap->>'notes'
  )
  on conflict (external_id) do update set
    customer_email     = excluded.customer_email,
    customer_name      = excluded.customer_name,
    contact_name       = coalesce(excluded.contact_name, b.contact_name),
    contact_phone      = coalesce(excluded.contact_phone, b.contact_phone),
    booking_type       = excluded.booking_type,
    event_type         = coalesce(excluded.event_type, b.event_type),
    is_overnight       = excluded.is_overnight,
    headcount          = excluded.headcount,
    arrival_date       = excluded.arrival_date,
    departure_date     = excluded.departure_date,
    catering_required  = excluded.catering_required,
    chapel_required    = excluded.chapel_required,
    status             = coalesce(nullif(snap->>'status','')::public.booking_status, b.status),
    notes              = excluded.notes
  returning id into bid;

  if bid is null then
    select id into bid from public.bookings where external_id = snap->>'bookingId';
  end if;

  delete from public.space_reservations where booking_id = bid and status = 'Held';

  with requested_spaces as (
    select distinct trim(s)::text as space_id
    from jsonb_array_elements_text(coalesce(snap->'spaces','[]'::jsonb)) as t(s)
  ), whole_centre as (
    select coalesce(bool_or(space_id = 'Whole Centre Day Hire'), false) as has_whole
    from requested_spaces
  ), spaces_for_booking as (
    select s.id as space_id
    from public.spaces s
    where s.active
      and (
        s.id in (select space_id from requested_spaces)
        or (select has_whole from whole_centre)
      )
  )
  insert into public.space_reservations (booking_id, space_id, service_date, status)
  select bid, sf.space_id, g::date, 'Held'
  from spaces_for_booking sf
  cross join generate_series(start_d, end_d, interval '1 day') as g;

  delete from public.meal_jobs where booking_id = bid and status = 'Draft';
  insert into public.meal_jobs (booking_id, service_date, meal, counts_total, counts_by_diet, percolated_coffee, status)
  select
    bid,
    (m->>'date')::date,
    (m->>'meal')::public.meal_type,
    coalesce((m->>'count')::int, 0),
    coalesce(m->'dietaryCounts','{}'::jsonb),
    coalesce((m->>'percolatedCoffee')::boolean, false),
    'Draft'
  from jsonb_array_elements(coalesce(snap->'catering'->'meals','[]'::jsonb)) m;

  insert into public.audit_log(entity, entity_id, action, changes)
  values ('booking', bid, 'snapshot_upsert', jsonb_build_object('v', snap->>'v'));

  return bid;
end;
$$;
