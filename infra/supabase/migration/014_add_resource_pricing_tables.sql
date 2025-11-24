-- 014_add_resource_pricing_tables.sql

-- 2. Create new tables
create table if not exists public.meal_prices (
  id uuid primary key default gen_random_uuid(),
  meal_type public.meal_type not null unique,
  price numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.room_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  price numeric(10,2) not null default 0,
  capacity int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Update existing tables
alter table public.spaces 
add column if not exists price numeric(10,2);

alter table public.menu_items
add column if not exists meal_type public.meal_type;

alter table public.rooms
add column if not exists room_type_id uuid references public.room_types(id);

-- 4. Seed Data
-- Meal Prices
insert into public.meal_prices (meal_type, price) values
  ('Breakfast', 19.00),
  ('Morning Tea', 11.00),
  ('Lunch', 24.00),
  ('Afternoon Tea', 11.00),
  ('Dinner', 30.00),
  ('Dessert', 15.00),
  ('Supper', 6.00)
on conflict (meal_type) do update set price = excluded.price;

-- Room Types
insert into public.room_types (name, price, capacity, description) values
  ('Single Bed', 110.00, 1, 'Single bed accommodation'),
  ('Double Bed', 149.00, 2, 'Double bed accommodation'),
  ('Double Bed + Ensuite', 199.00, 2, 'Double bed with ensuite bathroom'),
  ('Double Bed + Ensuite + Priv Study', 250.00, 2, 'Double bed with ensuite and private study area')
on conflict (name) do update set 
  price = excluded.price,
  capacity = excluded.capacity,
  description = excluded.description;

-- 5. RLS Policies
alter table public.meal_prices enable row level security;
alter table public.room_types enable row level security;

create policy "meal_prices read all" on public.meal_prices
  for select using (true);

create policy "meal_prices staff all" on public.meal_prices
  for all using (exists (select 1 from public.v_me m where m.role in ('admin','staff')))
  with check (exists (select 1 from public.v_me m where m.role in ('admin','staff')));

create policy "room_types read all" on public.room_types
  for select using (true);

create policy "room_types staff all" on public.room_types
  for all using (exists (select 1 from public.v_me m where m.role in ('admin','staff')))
  with check (exists (select 1 from public.v_me m where m.role in ('admin','staff')));

-- 6. Triggers for updated_at
create trigger trg_touch_meal_prices
  before update on public.meal_prices
  for each row execute function public.touch_updated_at();

create trigger trg_touch_room_types
  before update on public.room_types
  for each row execute function public.touch_updated_at();
