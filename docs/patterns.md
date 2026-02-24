# Code Patterns & Examples

Detailed code patterns for the HCC Portal. Read the root `CLAUDE.md` for rules and principles — this file provides the full examples.

## Data Fetching Patterns

### React cache() for Deduplication

Wrap expensive server functions with `cache()` to deduplicate calls within a single render tree.

```typescript
import { cache } from "react";

async function _getCurrentProfile() { /* ... */ }
export const getCurrentProfile = cache(_getCurrentProfile);
```

**When to use**: Any function called multiple times during SSR (auth checks, profile lookups). Example: `getCurrentProfile()` is called by both layouts and pages — cache eliminates redundant Supabase calls.

### Promise.all Parallelization

Always parallelize independent queries. Never fetch sequentially unless there's a data dependency.

```typescript
// ❌ BAD: Sequential waterfall
const booking = await getBooking(id);
const meals = await getMeals(id);
const rooms = await getRooms(id);

// ✅ GOOD: Parallel fetching
const [booking, meals, rooms] = await Promise.all([
  getBooking(id),
  getMeals(id),
  getRooms(id),
]);
```

Real impact: Booking detail pages went from 13 sequential queries (70ms) to 1 `Promise.all` (12ms).

### Postgres RPCs for Complex Reads

Use RPCs to collapse multiple HTTP round-trips into a single database call.

```typescript
// Single call returns booking + meal jobs + rooms + dietary profiles + conflicts
const detail = await supabase.rpc('get_booking_detail', { p_booking_id: id });
```

**Available Read RPCs**:
- `get_booking_detail(p_booking_id)` — Booking + meal jobs + rooms + dietary profiles + conflicts
- `get_room_status(p_date)` — Rooms + assignments + status logs for a date
- `get_dietary_meal_attendance(p_booking_id)` — Dietary profiles with meal attendance counts

**When to use**: Detail pages with 5+ related queries.

### Database-Level Filtering

Always filter in SQL — never fetch entire tables and filter client-side.

```typescript
// ❌ BAD: Fetch all, filter client-side
const allBookings = await sb.from("bookings").select("*");
const active = allBookings.filter(b => b.status !== "Cancelled");

// ✅ GOOD: Filter in database
const active = await sb.from("bookings").select("*").neq("status", "Cancelled");
```

Dashboard queries scope auxiliary data to fetched booking IDs using `.in("booking_id", ids)`.

### Tag-Based Cache Revalidation

Use `unstable_cache` with tags for frequently accessed, slowly changing data.

```typescript
import { unstable_cache } from "next/cache";

export const getCateringOptions = () =>
  unstable_cache(
    async () => await getCateringOptionsUncached(),
    ["catering-options"],
    { tags: ["catering"], revalidate: 300 } // 5 min TTL
  )();
```

**Revalidation rules**:
- Booking created/updated → `BOOKINGS`, `SPACE_RESERVATIONS`, `ROOM_ASSIGNMENTS`
- Meal job created/updated → `MEAL_JOBS`, `BOOKINGS`
- Room assignment changed → `ROOM_ASSIGNMENTS`, `BOOKINGS`
- Dietary profile updated → `DIETARY_PROFILES`, `BOOKINGS`

**Helper functions**:
```typescript
import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache";

// Single tag
revalidateTag(CACHE_TAGS.BOOKINGS, {});

// Multiple tags
[CACHE_TAGS.BOOKINGS, CACHE_TAGS.MEAL_JOBS].forEach(tag => revalidateTag(tag, {}));

// Booking-specific (see src/lib/cache.ts)
import { revalidateBookingCaches } from "@/lib/cache";
revalidateBookingCaches(bookingId);
```

### Module-Level Hoisting

Expensive instantiations should be created once at module scope.

```typescript
// ✅ Created once, reused
const dateFormatter = new Intl.DateTimeFormat("en-AU", { ... });

export function formatDate(date: Date) {
  return dateFormatter.format(date);
}
```

## Mutation Patterns

### Postgres RPCs for Atomic Mutations

Use SECURITY DEFINER RPCs for multi-step mutations requiring transactional safety.

```sql
CREATE OR REPLACE FUNCTION delete_booking_cascade(p_booking_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM meal_job_items WHERE meal_job_id IN (...);
  DELETE FROM meal_jobs WHERE booking_id = p_booking_id;
  -- ... all related deletes in single transaction
  RETURN jsonb_build_object('success', true);
END;
$$;
```

**Available Mutation RPCs**:
- `delete_booking_cascade(p_booking_id)` — Atomic deletion of booking + all related records
- `update_meal_job_items(p_meal_job_id, p_menu_item_ids)` — Atomic delete-then-insert for meal items
- `allocate_room(p_booking_id, p_room_id, ...)` — Conflict check + insert with row-level locking
- `upsert_booking_snapshot(snap)` — Google Apps Script integration for form submissions

### Row-Level Locking

Use `FOR UPDATE` in RPCs to prevent concurrent modification (TOCTOU races).

```sql
SELECT COUNT(*) INTO v_conflict_count
FROM room_assignments
WHERE room_id = p_room_id
FOR UPDATE; -- Other transactions wait
```

### Server Actions

Located alongside page components in `actions.ts` files.

```typescript
"use server";
import { sbServer } from "@/lib/supabase-server";
import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache";

export async function updateBooking(bookingId: string, data: BookingUpdate) {
  const sb = await sbServer();
  const { data: result, error } = await sb
    .from("bookings")
    .update(data)
    .eq("id", bookingId)
    .select()
    .single();

  if (error) throw error;
  revalidateTag(CACHE_TAGS.BOOKINGS, {});
  return result;
}
```

### Privileged Operations (Service-Role)

```typescript
import { sbAdmin } from "@/lib/supabase-admin";

export async function provisionProfile(userId: string) {
  const sb = sbAdmin(); // Singleton, no RLS, elevated permissions

  const { data, error } = await sb
    .from("profiles")
    .insert({ id: userId, ... })
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

### Using RPCs from Server Actions

```typescript
"use server";
import { sbServer } from "@/lib/supabase-server";

export async function deleteBookingWithCascade(bookingId: string) {
  const supabase: any = await sbServer();

  const { data, error } = await supabase.rpc('delete_booking_cascade', {
    p_booking_id: bookingId
  });

  if (error) throw new Error(`Failed to delete booking: ${error.message}`);
  revalidateTag(CACHE_TAGS.BOOKINGS, {});
  return data;
}
```

## Component Patterns

### Parallelized Server Component

```typescript
import { Suspense } from "react";
import { getCurrentProfile } from "@/lib/auth/server";
import { getBooking, getMealJobs, getRooms } from "@/lib/queries/bookings.server";

export default async function BookingDetailPage({ params }: { params: { id: string } }) {
  const booking = await getBooking(params.id);

  const [meals, rooms, profile] = await Promise.all([
    getMealJobs(booking.id),
    getRooms(booking.id),
    getCurrentProfile(), // Deduplicated via cache()
  ]);

  return <BookingDetail booking={booking} meals={meals} rooms={rooms} />;
}
```

### Client Component with Realtime

```typescript
"use client";
import { sbBrowser } from "@/lib/supabase-browser";
import { useEffect, useState } from "react";

export function BookingList() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const channel = sbBrowser()
      .channel('bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' },
        (payload) => {
          // Handle realtime update
        }
      )
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, []);

  return <div>{/* Render bookings */}</div>;
}
```

### Loading Skeleton with HCC Logo

```typescript
import Image from "next/image";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="relative size-16 animate-pulse">
        <Image src="/hcc_logo.svg" alt="Loading" fill className="object-contain" priority />
      </div>
      <div className="mt-8 w-full max-w-4xl space-y-4">
        <div className="h-12 bg-olive-100 rounded-lg animate-pulse" />
        <div className="h-12 bg-olive-100 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}
```

## Bundle Optimization

- Configure `optimizePackageImports` in `next.config.ts` for tree-shaking large barrel exports (lucide-react, date-fns, Radix UI)
- Heavy components lazy-loaded with `next/dynamic`
- Only import large libraries where needed
- CSS scoped to component-level when possible

## Testing

- Test files: `*.test.ts` or `*.test.tsx`
- Run: `npm test`
- Framework: Vitest with Node environment
- Example: `src/server/services/profiles.test.ts`
