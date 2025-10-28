# Supabase + Google Apps Script Integration

These steps provision the Supabase schema that mirrors the data model exposed in the Next.js app and wire Google Apps Script (GAS) submissions into the `upsert_booking_snapshot` RPC. The schema aligns with the mock TypeScript models found in `src/lib/mock-data.ts`, so the UI will work once you replace the mock queries with Supabase calls.【F:src/lib/mock-data.ts†L1-L122】 All SQL is checked into version control under `infra/supabase/migration/001_booking_schema.sql`, `infra/supabase/migration/002_seed_spaces_and_snapshot_update.sql`, and `infra/supabase/migration/003_add_booking_contact_fields.sql` for reproducible environments; apply those files (or paste the blocks below) using the Supabase SQL editor.【F:infra/supabase/migration/001_booking_schema.sql†L1-L266】【F:infra/supabase/migration/002_seed_spaces_and_snapshot_update.sql†L1-L94】【F:infra/supabase/migration/003_add_booking_contact_fields.sql†L1-L17】

## 1. Supabase schema & security

Paste the following blocks, in order, into the Supabase SQL editor. They create enums, tables, helpers, policies and the snapshot RPC used by the form automation.

### 1.1 Enums

```sql
-- Domain enums that match the UI state chips and filters.
create type public.booking_status as enum (
  'Pending','InTriage','Approved','DepositPending',
  'DepositReceived','InProgress','Completed','Cancelled'
);

create type public.meal_type as enum (
  'Breakfast','Morning Tea','Lunch','Afternoon Tea','Dinner'
);

create type public.meal_job_status as enum (
  'Draft','PendingAssignment','Assigned','Confirmed','InPrep','Served','Completed','Cancelled'
);

create type public.assignment_mode as enum ('Auto','Manual');
create type public.space_res_status as enum ('Held','Confirmed');
create type public.severity as enum ('Low','Moderate','High','Fatal');
create type public.task_type as enum ('PercolatedCoffee');
create type public.task_status as enum ('Open','Done');
create type public.payment_kind as enum ('Deposit','Balance');
create type public.payment_status as enum ('Pending','Paid','Failed','Cancelled');
```

### 1.2 Reference & registry tables

```sql
create table if not exists public.spaces (
  id text primary key,
  name text not null,
  capacity int,
  features text[] default '{}',
  active boolean not null default true
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  building text,
  name text not null,
  base_beds smallint not null default 2,
  extra_bed_allowed boolean not null default false,
  extra_bed_fee numeric(10,2),
  active boolean not null default true
);

create table if not exists public.caterers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  active boolean not null default true,
  user_id uuid references auth.users(id) on delete set null
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  allergens text[] default '{}',
  dietary_tags text[] default '{}',
  default_caterer_id uuid references public.caterers(id)
);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('Admin','Staff','Caterer','Customer')),
  display_name text,
  caterer_id uuid references public.caterers(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_profiles_role on public.profiles(role);
```

Seed the standard hireable spaces so bookings and Whole Centre hires have the correct inventory.

```sql
insert into public.spaces (id, name)
values
  ('Whole Centre Day Hire','Whole Centre Day Hire'),
  ('Chapel','Chapel'),
  ('Chapter','Chapter'),
  ('Corbett','Corbett Room'),
  ('La Velle','La Velle'),
  ('Morris','Morris Room'),
  ('Dining Hall','Dining Hall'),
  ('Outdoor Picnic Space','Outdoor Picnic Space')
on conflict (id) do update set
  name = excluded.name,
  active = true;
```

The `'Whole Centre Day Hire'` row is special: the ingest RPC expands it to hold every active space for the booking dates so no other hires can overlap.

### 1.3 Core bookings & operations tables

```sql
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  external_id text unique,
  form_response_id text unique,

  customer_user_id uuid references auth.users(id) on delete set null,
  customer_email text not null,
  customer_name text,
  contact_name text,
  contact_phone text,

  reference text unique,
  booking_type text not null check (booking_type in ('Group','Individual')),
  event_type text,
  is_overnight boolean not null default true,
  headcount int not null default 0,

  arrival_date date not null,
  departure_date date not null,
  nights int generated always as (greatest(0, (departure_date - arrival_date))) stored,
  date_range daterange generated always as (daterange(arrival_date, departure_date, '[]')) stored,

  catering_required boolean not null default false,
  chapel_required boolean not null default false,
  notes text,

  status public.booking_status not null default 'Pending',
  deposit_amount numeric(10,2),
  deposit_status public.payment_status not null default 'Pending',
  deposit_received_at timestamptz,
  deposit_reference text
);
create index if not exists idx_bookings_status on public.bookings(status);
create index if not exists idx_bookings_range on public.bookings using gist (date_range);

create table if not exists public.space_reservations (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  space_id text not null references public.spaces(id),
  service_date date not null,
  start_time time,
  end_time time,
  status public.space_res_status not null default 'Held'
);
create index if not exists idx_space_reservations_space_date on public.space_reservations(space_id, service_date);

create table if not exists public.room_assignments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  room_id uuid not null references public.rooms(id),
  occupant_name text not null,
  bed_number smallint not null check (bed_number between 1 and 3),
  is_extra_bed boolean not null default false
);
create index if not exists idx_room_assignments_booking on public.room_assignments(booking_id);

create table if not exists public.meal_jobs (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  service_date date not null,
  meal public.meal_type not null,
  service_time time,
  counts_total int not null default 0,
  counts_by_diet jsonb not null default '{}'::jsonb,
  percolated_coffee boolean not null default false,

  assignment_mode public.assignment_mode not null default 'Auto',
  assigned_caterer_id uuid references public.caterers(id),
  status public.meal_job_status not null default 'Draft'
);
create index if not exists idx_meal_jobs_booking on public.meal_jobs(booking_id, service_date);
create index if not exists idx_meal_jobs_caterer on public.meal_jobs(assigned_caterer_id, service_date);

create table if not exists public.meal_job_items (
  meal_job_id uuid references public.meal_jobs(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete restrict,
  primary key (meal_job_id, menu_item_id)
);

create table if not exists public.dietary_profiles (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  person_name text not null,
  diet_type text not null,
  allergy_type text,
  severity public.severity,
  notes text
);

create table if not exists public.staff_tasks (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  meal_job_id uuid references public.meal_jobs(id) on delete cascade,
  due_at timestamptz not null,
  type public.task_type not null,
  status public.task_status not null default 'Open',
  assigned_to uuid references auth.users(id) on delete set null,
  notes text
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  payload jsonb not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  kind public.payment_kind not null,
  amount numeric(10,2) not null check (amount >= 0),
  status public.payment_status not null default 'Pending',
  paid_at timestamptz,
  method text,
  reference text
);
create index if not exists idx_payments_booking on public.payments(booking_id);

create table if not exists public.audit_log (
  id bigserial primary key,
  at timestamptz not null default now(),
  entity text not null,
  entity_id uuid not null,
  actor_id uuid,
  action text not null,
  changes jsonb
);

create table if not exists public.booking_guest_tokens (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  token_hash bytea not null,
  purpose text not null check (purpose in ('edit')),
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
```

### 1.4 Helpers, triggers & views

```sql
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_bookings on public.bookings;
create trigger trg_touch_bookings
before update on public.bookings
for each row execute function public.touch_updated_at();

create or replace view public.v_space_conflicts as
select r1.booking_id, r1.space_id, r1.service_date, r2.booking_id as conflicts_with
from public.space_reservations r1
join public.space_reservations r2
  on r1.space_id = r2.space_id
 and r1.service_date = r2.service_date
 and coalesce(r1.start_time, time '00:00') < coalesce(r2.end_time, time '23:59')
 and coalesce(r2.start_time, time '00:00') < coalesce(r1.end_time, time '23:59')
 and r2.status = 'Confirmed'
 and r1.booking_id <> r2.booking_id;
```

### 1.5 Row Level Security policies

```sql
alter table public.bookings             enable row level security;
alter table public.space_reservations   enable row level security;
alter table public.room_assignments     enable row level security;
alter table public.meal_jobs            enable row level security;
alter table public.meal_job_items       enable row level security;
alter table public.dietary_profiles     enable row level security;
alter table public.staff_tasks          enable row level security;
alter table public.notifications        enable row level security;
alter table public.payments             enable row level security;
alter table public.audit_log            enable row level security;
alter table public.profiles             enable row level security;
alter table public.booking_guest_tokens enable row level security;

create or replace view public.v_me as
select u.id as user_id, p.role, p.caterer_id
from auth.users u
left join public.profiles p on p.user_id = u.id
where u.id = auth.uid();

create policy "profiles self" on public.profiles
for select using (auth.uid() = user_id);

create policy "bookings staff read" on public.bookings
for select using (exists (select 1 from public.v_me m where m.role in ('Admin','Staff')));

create policy "bookings staff insert" on public.bookings
for insert with check (exists (select 1 from public.v_me m where m.role in ('Admin','Staff')));

create policy "bookings staff update" on public.bookings
for update using (exists (select 1 from public.v_me m where m.role in ('Admin','Staff')));

create policy "bookings caterer read" on public.bookings
for select using (
  exists (
    select 1
    from public.v_me m
    join public.meal_jobs mj on mj.assigned_caterer_id = m.caterer_id
    where m.role = 'Caterer' and mj.booking_id = bookings.id
  )
);

create policy "bookings customer read" on public.bookings
for select using (
  exists (
    select 1 from public.v_me m
    where m.role = 'Customer' and bookings.customer_user_id = m.user_id
  )
);

create policy "meal_jobs staff all" on public.meal_jobs
for all using (exists (select 1 from public.v_me m where m.role in ('Admin','Staff')))
with check (exists (select 1 from public.v_me m where m.role in ('Admin','Staff')));

create policy "meal_jobs caterer read" on public.meal_jobs
for select using (
  exists (select 1 from public.v_me m where m.role = 'Caterer' and m.caterer_id = meal_jobs.assigned_caterer_id)
);

create policy "space_reservations staff all" on public.space_reservations
for all using (exists (select 1 from public.v_me m where m.role in ('Admin','Staff')))
with check (exists (select 1 from public.v_me m where m.role in ('Admin','Staff')));

create policy "room_assignments staff all" on public.room_assignments
for all using (exists (select 1 from public.v_me m where m.role in ('Admin','Staff')))
with check (exists (select 1 from public.v_me m where m.role in ('Admin','Staff')));

create policy "dietary_profiles staff all" on public.dietary_profiles
for all using (exists (select 1 from public.v_me m where m.role in ('Admin','Staff')))
with check (exists (select 1 from public.v_me m where m.role in ('Admin','Staff')));

create policy "staff_tasks staff all" on public.staff_tasks
for all using (exists (select 1 from public.v_me m where m.role in ('Admin','Staff')))
with check (exists (select 1 from public.v_me m where m.role in ('Admin','Staff')));

create policy "notifications self" on public.notifications
for select using (auth.uid() = user_id);

create policy "booking_tokens staff read" on public.booking_guest_tokens
for select using (exists (select 1 from public.v_me m where m.role in ('Admin','Staff')));
```

Enable Realtime on `bookings`, `space_reservations`, `meal_jobs`, `room_assignments`, and `staff_tasks` via the Supabase dashboard.

### 1.6 RPC: Google snapshot ingest

```sql
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
```

If you've already run `003_add_booking_contact_fields.sql` through the Supabase SQL editor, paste the `create or replace function` block above into a new query and execute it again so the updated `ON CONFLICT` logic is deployed without rerunning the whole migration.

The snapshot payload may optionally include `bookingType`, `status`, `contactName`, `contactPhone`, `eventType`, and `chapelRequired` fields. When omitted they fall back to the derived defaults shown above, so builders can roll the new properties out incrementally across their form logic.

If you've already run the initial schema migration, apply `infra/supabase/migration/002_seed_spaces_and_snapshot_update.sql` to seed the default spaces and enable the Whole Centre hire expansion logic without dropping any data. Then run `infra/supabase/migration/003_add_booking_contact_fields.sql` to add the booking contact fields and `chapel_required` flag to existing environments.

## 2. Google Apps Script wiring

Update your GAS project with the helper below. It posts the booking snapshot payload to the Supabase RPC using the service role key, which is required because the function bypasses RLS to ingest form data.

```javascript
function sbPostSnapshot_(snapshotJsonString) {
  const props = PropertiesService.getScriptProperties();
  const url = props.getProperty('SUPABASE_URL') + '/rest/v1/rpc/upsert_booking_snapshot';
  const key = props.getProperty('SUPABASE_SERVICE_ROLE_KEY');
  const res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ snap: JSON.parse(snapshotJsonString) }),
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    muteHttpExceptions: true,
  });
  if (res.getResponseCode() >= 300) {
    throw new Error(`RPC failed: ${res.getResponseCode()} ${res.getContentText()}`);
  }
  return JSON.parse(res.getContentText());
}

function onFormSubmit(e) {
  const snapshot = buildBookingSnapshotJSON_(e); // existing builder
  const bookingUuid = sbPostSnapshot_(snapshot);
  Logger.log(`Supabase booking UUID: ${bookingUuid}`);
}
```

Store `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` as script properties, deploy the trigger on form submissions, and the production app can read the same tables through Supabase client calls once the mock data is removed.【F:README.md†L60-L116】
