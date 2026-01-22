# Holy Cross Centre Portal

A role-aware Next.js (App Router) prototype for the Holy Cross Centre booking portal. It scaffolds admin, staff, caterer and customer experiences using Shadcn-inspired components, an olive colour palette, and mock data that mirrors the product specification.

## App structure

- `/(public)/login` — Supabase auth entry point for internal teams.
- `/(portal)/portal/[bookingRef]` — Customer wizard (Deposit → Catering → Rooming → Summary).
- `/(admin)/admin` — Admin dashboard + bookings, catering jobs, resources, audit log.
- `/(staff)/staff` — Operational views (dashboard, schedule, run sheets).
- `/(caterer)/caterer` — Caterer dashboard and job list.

Shared UI components (StatusChip, ConflictBanner, MealSlotCard, RoomCard, Stepper, AuditTimeline) live under `src/components/ui` and use a lightweight Tailwind 4 + CSS variable theme.

## Getting started

Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000). Navigate via the header shortcuts or visit role-specific routes directly.

To lint the project:

```bash
npm run lint
```

## Development Guidelines

**Important**: Before making UI changes, please review the [Development Guidelines](./docs/claude.md) which includes:
- Responsive design principles for all screen sizes
- Tailwind CSS breakpoint usage
- Layout patterns and best practices
- Component-specific guidelines
- Testing checklist

This ensures consistent, mobile-friendly experiences across the entire application.

## Shadcn UI setup

To regenerate or extend the component library with the official Shadcn CLI, run the following commands from the project root:

```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card badge table tabs combobox
```

You can append other components (e.g. `dialog`, `popover`, `dropdown-menu`) using the same `add` command as you expand the UI surface area.

## Supabase schema blueprint

Set up the following tables to power the workflows described in the UX blueprint. Each table should have Row Level Security enabled, with policies scoped to the roles below.

### Core identity

```sql
create type public.user_role as enum ('Admin', 'Staff', 'Caterer', 'Customer');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null,
  name text,
  email text unique not null,
  created_at timestamptz not null default now()
);
```

Policies:
- Admins can select/insert/update/delete all rows.
- Other roles can `select` their own row (`auth.uid() = id`).

### Bookings & operations

```sql
create type public.booking_status as enum (
  'Pending','InTriage','Approved','DepositPending',
  'DepositReceived','InProgress','Completed','Cancelled'
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  customer_user_id uuid references public.users(id),
  status public.booking_status not null default 'Pending',
  booking_type text check (booking_type in ('Group','Individual')),
  arrival_date date not null,
  departure_date date not null,
  is_overnight boolean not null default true,
  headcount integer not null,
  catering_required boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Related tables:

- `space_reservations (id, booking_id, space_id, service_date, start_time, end_time, status)`.
- `rooms (id, building, name, base_beds, extra_bed_allowed, extra_bed_fee, active)`.
- `room_assignments (id, booking_id, room_id, occupant_name, bed_number, is_extra_bed)`.
- `menu_items (id, label, allergens text[], dietary_tags text[], default_caterer_id uuid)`.
- `caterers (id, name, contact, user_id uuid references public.users(id), active)`.
- `meal_jobs (id, booking_id, service_date, time_slot text, dietary_counts jsonb, percolated_coffee boolean, menu_item_ids uuid[], assigned_caterer_id uuid, assignment_mode text check (assignment_mode in ('Auto','Manual')), status text)`.
- `dietary_profiles (id, booking_id, person_name, diet_type, allergy_type, severity text, notes)`.
- `staff_tasks (id, booking_id, meal_job_id uuid, due_at timestamptz, type text, status text, assigned_to uuid)`.
- `audit_logs (id, entity text, entity_id uuid, actor_id uuid, changes jsonb, created_at timestamptz default now())`.

### Suggested RLS policies

- Admin: full access on all tables.
- Staff: `select` bookings, spaces, rooms, meal_jobs, dietary_profiles; `insert/update` on staff_tasks and run sheet notes.
- Caterer: `select` meal_jobs where `assigned_caterer_id` matches their caterer record; `update` meal_jobs.status for their jobs.
- Customer: `select/update` their booking, meal selections, room assignments, dietary profiles while `status >= 'DepositReceived'`.

### Automation hooks

- `meal_jobs` trigger to create/update `staff_tasks` when `percolated_coffee = true`.
- `audit_logs` trigger on each business table capturing `OLD` vs `NEW` JSON.
- `bookings` trigger to flip `status` transitions (`Pending` → `InTriage` → `Approved` → `DepositPending` → `DepositReceived`).

These structures line up with the mock UI and can be implemented incrementally. Once the schema is in place, replace the mock data in `src/lib/mock-data.ts` with Supabase queries inside server components and route handlers.
