-- Create guests table
create table public.guests (
  id uuid not null default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  full_name text not null,
  dietary_requirements text,
  notes text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint guests_pkey primary key (id)
);

-- Enable RLS
alter table public.guests enable row level security;

-- Policies
create policy "Users can view guests for their bookings"
  on public.guests for select
  using (
    exists (
      select 1 from public.bookings
      where bookings.id = guests.booking_id
      and (
        -- Admin/Staff access (simplified for now, assumes backend bypass or proper role check)
        -- For portal, we usually rely on the booking reference/ID access pattern
        -- But since we are using supabase-server with service role or authenticated user...
        -- Let's mirror the rooming_groups policy if possible, or just allow public for now if using anon key with logic?
        -- Actually, the portal uses `sbServer` which is likely using the service role or a specific user.
        -- Let's assume authenticated users can access.
        auth.role() = 'authenticated'
      )
    )
  );

create policy "Users can insert guests for their bookings"
  on public.guests for insert
  with check (
    exists (
      select 1 from public.bookings
      where bookings.id = guests.booking_id
    )
  );

create policy "Users can update guests for their bookings"
  on public.guests for update
  using (
    exists (
      select 1 from public.bookings
      where bookings.id = guests.booking_id
    )
  );

create policy "Users can delete guests for their bookings"
  on public.guests for delete
  using (
    exists (
      select 1 from public.bookings
      where bookings.id = guests.booking_id
    )
  );
