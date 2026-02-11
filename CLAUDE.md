# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HCC Portal is a role-aware booking management system for the Holy Cross Centre. It provides distinct interfaces for admin, staff, caterers, and customers to manage bookings, catering, room allocations, and schedules.

## Core Design Pillars

**CRITICAL**: All code changes MUST align with these foundational principles:

### 1. Performance First
- **Target**: Sub-100ms page loads for detail pages, <2s for dashboards
- **Measures**:
  - Minimize HTTP round-trips using parallelization and Postgres RPCs
  - Deduplicate queries with React `cache()` and `unstable_cache()`
  - Filter queries at the database level (never fetch-then-filter client-side)
  - Optimize bundles with tree-shaking and lazy-loading
  - Provide instant perceived feedback with loading skeletons

### 2. Security & Privacy by Default
- **Principle**: Least privilege access at all layers
- **Measures**:
  - Default to RLS-aware `sbServer()` for all user-facing operations
  - Use `sbAdmin()` service-role client ONLY when RLS must be bypassed (profile provisioning, system operations)
  - Never expose service-role credentials to browser bundles
  - Implement atomic transactions with row-level locking for mutations
  - Log privileged operations in audit trail

### 3. Usability & Accessibility
- **Principle**: Intuitive, responsive, and accessible for all users
- **Measures**:
  - Mobile-first responsive design (see `docs/CLAUDE.md`)
  - Loading states with HCC logo on all async operations
  - Clear error messages with actionable guidance
  - Keyboard navigation support
  - ARIA labels for screen readers

## Tech Stack

- **Framework**: Next.js 16 with App Router and Turbopack
- **Backend**: Supabase (PostgreSQL with RLS, Realtime subscriptions, Auth)
- **UI**: Tailwind CSS 4 + Shadcn-inspired components
- **Email**: React Email with Resend
- **Testing**: Vitest
- **Language**: TypeScript (strict mode)

## Development Commands

```bash
# Development
npm run dev              # Start dev server with Turbopack (http://localhost:3000)
npm run build            # Production build with Turbopack
npm run start            # Start production server

# Quality
npm run lint             # ESLint with Next.js config
npm test                 # Run Vitest tests

# Email development
npm run email:dev        # Preview React Email templates (src/emails)
```

## Architecture Overview

### App Router Structure

The app uses Next.js App Router with role-based route groups:

- `/(main)/(public)/login` - Supabase auth entry point
- `/(app)/(admin)/admin/*` - Admin dashboard (bookings, catering, resources, audit, schedule)
- `/(app)/(staff)/staff/*` - Operational views (dashboard, kitchen, run sheets)
- `/(app)/(caterer)/caterer/*` - Caterer dashboard and job management
- `/(app)/(portal)/portal/*` - Customer booking wizard and detail pages

### Authentication & Authorization

- **Middleware** (`middleware.ts`): Enforces role-based access control using Supabase session
- **Roles**: `admin`, `staff`, `caterer`, `customer`
- **Auth helpers**: `src/lib/auth/server.ts`, `src/lib/auth/paths.ts`
- **Profile service**: `src/server/services/profiles.ts` - Handles profile provisioning with service-role permissions

### Supabase Client Pattern

**Two client types with distinct purposes:**

1. **RLS-aware client** (`sbServer()` from `src/lib/supabase-server.ts`):
   - Used in server components, route handlers, and server actions
   - Respects Row Level Security based on authenticated user
   - Created with `createServerClient()` using session cookies
   - Use for: User-scoped queries, customer-facing operations

2. **Service-role client** (`sbAdmin()` from `src/lib/supabase-admin.ts`):
   - Bypasses RLS with elevated permissions
   - **Singleton pattern**: Cached instance reused across all requests (no cookies, stateless)
   - Used in: Profile provisioning, Google Apps Script ingest, admin operations
   - Requires `SUPABASE_SERVICE_ROLE_KEY` environment variable
   - **Never expose to browser bundles**
   - **Security**: Only call from server-side code with `"use server"` directive

### Data Layer Organization

- `src/lib/queries/` - Server-side query functions (`.server.ts` suffix for privileged operations)
- `src/server/services/` - Business logic layer with elevated permissions
- `src/server/api/` - API route utilities
- `src/app/api/` - API route handlers

### Key Architectural Patterns

#### Data Fetching & Performance

1. **React cache() for deduplication**: Wrap expensive server functions with `cache()` from React to deduplicate calls within a single render tree.
   ```typescript
   import { cache } from "react";

   async function _getCurrentProfile() { /* ... */ }
   export const getCurrentProfile = cache(_getCurrentProfile);
   ```
   - **Example**: `getCurrentProfile()` is called by both layouts and pages — cache eliminates redundant Supabase calls
   - **When to use**: Any function called multiple times during SSR (auth checks, lookups)

2. **Promise.all parallelization**: Always parallelize independent queries. Never fetch sequentially unless there's a data dependency.
   ```typescript
   // ❌ BAD: Sequential waterfall (slow)
   const booking = await getBooking(id);
   const meals = await getMeals(id);
   const rooms = await getRooms(id);

   // ✅ GOOD: Parallel fetching (fast)
   const [booking, meals, rooms] = await Promise.all([
     getBooking(id),
     getMeals(id),
     getRooms(id),
   ]);
   ```
   - **Critical**: Booking detail pages collapsed from 13 sequential queries to 1 Promise.all (70ms → 12ms)

3. **Postgres RPCs for complex reads**: Use RPCs to collapse multiple HTTP round-trips into a single database call.
   ```typescript
   // RPC returns JSONB with all related data in one call
   const detail = await supabase.rpc('get_booking_detail', { p_booking_id: id });
   ```
   - **Available RPCs**:
     - `get_booking_detail(p_booking_id)` - Returns booking + meal jobs + rooms + dietary profiles + conflicts
     - `get_room_status(p_date)` - Returns rooms + assignments + status logs for a date
     - `get_dietary_meal_attendance(p_booking_id)` - Returns dietary profiles with meal attendance
   - **When to use**: Complex detail pages with 5+ related queries

4. **Query filtering at database level**: Always filter in SQL with `.eq()`, `.gte()`, `.in()` — never fetch entire tables and filter client-side.
   ```typescript
   // ❌ BAD: Fetch all, filter client-side
   const allBookings = await sb.from("bookings").select("*");
   const active = allBookings.filter(b => b.status !== "Cancelled");

   // ✅ GOOD: Filter in database
   const active = await sb.from("bookings").select("*").neq("status", "Cancelled");
   ```
   - **Critical**: Dashboard queries scope auxiliary data (space_reservations, meal_jobs) to fetched booking IDs using `.in("booking_id", ids)`

5. **Tag-based cache revalidation**: Use `unstable_cache` with tags for frequently accessed, slowly changing data.
   ```typescript
   import { unstable_cache } from "next/cache";

   export const getCateringOptions = () =>
     unstable_cache(
       async () => await getCateringOptionsUncached(),
       ["catering-options"],
       { tags: ["catering"], revalidate: 300 } // 5 min TTL
     )();
   ```
   - **Cache tags**: `CACHE_TAGS.BOOKINGS`, `CACHE_TAGS.MEAL_JOBS`, `CACHE_TAGS.SPACE_RESERVATIONS`, etc.
   - **Revalidation**: Call `revalidateTag(tag, {})` in mutations to invalidate caches

6. **Module-level hoisting**: Expensive instantiations (Intl.DateTimeFormat, regex) should be created once at module scope.
   ```typescript
   // ✅ GOOD: Created once
   const dateFormatter = new Intl.DateTimeFormat("en-AU", { ... });

   export function formatDate(date: Date) {
     return dateFormatter.format(date); // Reuse instance
   }
   ```

7. **Bundle optimization**: Configure `optimizePackageImports` in `next.config.ts` for tree-shaking large barrel exports (lucide-react, date-fns, Radix UI).

#### Mutations & Data Integrity

8. **Postgres RPCs for atomic mutations**: Use SECURITY DEFINER RPCs for multi-step mutations requiring transactional safety.
   ```sql
   CREATE OR REPLACE FUNCTION delete_booking_cascade(p_booking_id uuid)
   RETURNS jsonb
   LANGUAGE plpgsql
   SECURITY DEFINER
   AS $$
   BEGIN
     -- All deletes in single transaction
     DELETE FROM meal_job_items WHERE meal_job_id IN (...);
     DELETE FROM meal_jobs WHERE booking_id = p_booking_id;
     -- ... 5 more related deletes
     RETURN jsonb_build_object('success', true);
   END;
   $$;
   ```
   - **Available RPCs**:
     - `delete_booking_cascade(p_booking_id)` - Atomic deletion of booking + all related records
     - `update_meal_job_items(p_meal_job_id, p_menu_item_ids)` - Atomic delete-then-insert for meal items
     - `allocate_room(p_booking_id, p_room_id, ...)` - Conflict check + insert with row-level locking
   - **When to use**: Multi-step operations where partial success = data corruption

9. **Row-level locking for race conditions**: Use `FOR UPDATE` in RPCs to prevent concurrent modification issues.
   ```sql
   -- Lock rows during conflict check to prevent TOCTOU races
   SELECT COUNT(*) INTO v_conflict_count
   FROM room_assignments
   WHERE room_id = p_room_id
   FOR UPDATE; -- Other transactions wait
   ```

10. **Server actions for mutations**: Located alongside page components in `actions.ts` files. Use `"use server"` directive and `sbServer()` for RLS-safe operations.

11. **Optimistic UI with Realtime**: Client components subscribe to Supabase Realtime channels for live updates while mutations happen via server actions.

#### User Experience

12. **Loading skeletons with HCC logo**: Every async route has a `loading.tsx` file with the HCC logo + page-specific skeleton blocks.
   ```tsx
   export default function Loading() {
     return (
       <div className="flex flex-col items-center justify-center py-24">
         <div className="relative size-16 animate-pulse">
           <Image src="/hcc_logo.svg" alt="Loading" fill className="object-contain" priority />
         </div>
         {/* Page-specific skeleton blocks */}
       </div>
     );
   }
   ```

13. **Email templates**: React Email components in `src/emails/` sent via Resend API (`src/lib/email/`)

## Important Files & Directories

### Core Infrastructure

- `middleware.ts` - Authentication and role-based routing
- `src/lib/database.types.ts` - Generated Supabase types
- `src/lib/supabase-server.ts` - RLS-aware Supabase client factory
- `src/lib/supabase-admin.ts` - Service-role client factory (privileged)

### Business Logic

- `src/server/services/profiles.ts` - Profile provisioning and management
- `src/lib/queries/bookings.server.ts` - Booking queries with privileged access
- `src/lib/queries/catering.server.ts` - Catering and meal job queries
- `src/lib/pricing/` - Booking cost calculation logic
- `src/lib/cache.ts` - Cache tags, revalidation helpers, cached query wrappers

### UI Components

- `src/components/ui/` - Reusable UI primitives (Button, Card, Dialog, etc.)
- `src/components/layout/` - Layout components (AppHeader, etc.)
- `src/components/catering/` - Catering-specific components
- `src/components/resources/` - Resource management components

### Cache Tags & Revalidation

**Available cache tags** (defined in `src/lib/cache.ts`):
```typescript
export const CACHE_TAGS = {
  BOOKINGS: "bookings",
  MEAL_JOBS: "meal-jobs",
  SPACE_RESERVATIONS: "space-reservations",
  ROOM_ASSIGNMENTS: "room-assignments",
  DIETARY_PROFILES: "dietary-profiles",
  CATERERS: "caterers",
  MENU_ITEMS: "menu-items",
  PROFILES: "profiles",
  ROOMS: "rooms",
  SPACES: "spaces",
};
```

**When to revalidate tags:**
- Booking created/updated → `BOOKINGS`, `SPACE_RESERVATIONS`, `ROOM_ASSIGNMENTS`
- Meal job created/updated → `MEAL_JOBS`, `BOOKINGS`
- Room assignment changed → `ROOM_ASSIGNMENTS`, `BOOKINGS`
- Dietary profile updated → `DIETARY_PROFILES`, `BOOKINGS`
- Caterer info changed → `CATERERS`

**Helper functions:**
```typescript
import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache";

// Single tag
revalidateTag(CACHE_TAGS.BOOKINGS, {});

// Multiple tags
[CACHE_TAGS.BOOKINGS, CACHE_TAGS.MEAL_JOBS].forEach(tag => revalidateTag(tag, {}));

// Booking-specific cache invalidation (see src/lib/cache.ts)
import { getBookingCacheTags, revalidateBookingCaches } from "@/lib/cache";
revalidateBookingCaches(bookingId); // Invalidates all related tags
```

## Environment Variables

Required variables (add to `.env.local` for local development):

```bash
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Server-only, never expose to browser

# Email (required for approval notifications)
RESEND_API_KEY=re_your-api-key

# App (required for magic links)
PUBLIC_SITE_URL=http://localhost:3000  # Or production URL
```

## Database Schema

The Supabase schema is documented in `docs/supabase-integration.md` and includes:

- **Core tables**: `bookings`, `profiles`, `rooms`, `spaces`, `caterers`, `menu_items`
- **Operations**: `space_reservations`, `room_assignments`, `meal_jobs`, `dietary_profiles`, `staff_tasks`
- **Audit**: `audit_log`, `notifications`, `payments`
- **Row Level Security**: Policies enforce role-based access (see docs)
- **Realtime**: Enabled on bookings, meal_jobs, room_assignments, space_reservations, staff_tasks

### Database RPCs (SECURITY DEFINER Functions)

All RPCs use `SECURITY DEFINER` to run with elevated permissions while maintaining security through input validation.

**Read RPCs** (collapse HTTP round-trips):
- `get_booking_detail(p_booking_id uuid)` - Returns booking + meal jobs + rooms + dietary profiles + conflicts (single query)
- `get_room_status(p_date date)` - Returns rooms + assignments + status logs for a specific date
- `get_dietary_meal_attendance(p_booking_id uuid)` - Returns dietary profiles with meal attendance counts

**Mutation RPCs** (atomic transactions):
- `delete_booking_cascade(p_booking_id uuid)` - Deletes booking + all related records in single transaction
- `update_meal_job_items(p_meal_job_id uuid, p_menu_item_ids uuid[])` - Atomic delete-then-insert for meal items
- `allocate_room(p_booking_id uuid, p_room_id uuid, ...)` - Room allocation with row-level locking to prevent race conditions
- `upsert_booking_snapshot(snap jsonb)` - Google Apps Script integration for form submissions

**Migration files**: `infra/supabase/migration/050_read_rpcs.sql`, `051_mutation_rpcs.sql`

## Development Guidelines

### Responsive Design

**IMPORTANT**: All UI changes must be responsive across mobile, tablet, and desktop. See `docs/CLAUDE.md` for comprehensive responsive design guidelines including:

- Tailwind breakpoint patterns (mobile-first)
- Grid layout best practices
- Spacing conventions
- Testing checklist

### Code Patterns

**Server actions with RLS:**
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

  // Invalidate caches
  revalidateTag(CACHE_TAGS.BOOKINGS, {});

  return result;
}
```

**Privileged operations (service-role singleton):**
```typescript
import { sbAdmin } from "@/lib/supabase-admin";

export async function provisionProfile(userId: string) {
  const sb = sbAdmin(); // Singleton instance, no RLS, elevated permissions

  const { data, error } = await sb
    .from("profiles")
    .insert({ id: userId, ... })
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

**Parallelized server component:**
```typescript
import { Suspense } from "react";
import { getCurrentProfile } from "@/lib/auth/server"; // React cache wrapper
import { getBooking, getMealJobs, getRooms } from "@/lib/queries/bookings.server";

export default async function BookingDetailPage({ params }: { params: { id: string } }) {
  // First fetch (may be needed by subsequent queries)
  const booking = await getBooking(params.id);

  // Parallelize independent queries
  const [meals, rooms, profile] = await Promise.all([
    getMealJobs(booking.id),
    getRooms(booking.id),
    getCurrentProfile(), // Deduplicated via cache()
  ]);

  return <BookingDetail booking={booking} meals={meals} rooms={rooms} />;
}
```

**Using Postgres RPCs:**
```typescript
"use server";
import { sbServer } from "@/lib/supabase-server";

export async function deleteBookingWithCascade(bookingId: string) {
  const supabase: any = await sbServer();

  const { data, error } = await supabase.rpc('delete_booking_cascade', {
    p_booking_id: bookingId
  });

  if (error) throw new Error(`Failed to delete booking: ${error.message}`);

  // Invalidate caches
  revalidateTag(CACHE_TAGS.BOOKINGS, {});

  return data;
}
```

**Client component with Realtime:**
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

**Loading skeleton with HCC logo:**
```typescript
import Image from "next/image";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="relative size-16 animate-pulse">
        <Image
          src="/hcc_logo.svg"
          alt="Loading"
          fill
          className="object-contain"
          priority
        />
      </div>
      {/* Page-specific skeleton blocks */}
      <div className="mt-8 w-full max-w-4xl space-y-4">
        <div className="h-12 bg-olive-100 rounded-lg animate-pulse" />
        <div className="h-12 bg-olive-100 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}
```

### Path Aliases

- `@/*` → `src/*`
- `@/server/*` → `src/server/*`

## Testing

- Test files: `*.test.ts` or `*.test.tsx`
- Run tests: `npm test`
- Framework: Vitest with Node environment
- Example: `src/server/services/profiles.test.ts`

## Related Documentation

- `README.md` - Quick start and Supabase schema blueprint
- `docs/supabase-integration.md` - Detailed API workflow, RLS policies, deployment sequence
- `docs/CLAUDE.md` - Responsive design guidelines (read before UI changes)
- `infra/supabase/migration/` - SQL migrations for schema setup

## Common Tasks

### Adding a new role-based route

1. Create route in appropriate group: `src/app/(app)/(role)/role-name/new-page/page.tsx`
2. Middleware automatically enforces access based on route prefix
3. Use `sbServer()` in server components for RLS-aware queries

### Creating an API route

1. Add route handler: `src/app/api/your-endpoint/route.ts`
2. Authenticate with `sbServer()` to enforce RLS
3. For privileged operations, use service helpers from `src/server/services/`

### Sending an email

1. Create React Email template in `src/emails/`
2. Add send helper in `src/lib/email/`
3. Call from server action or API route with Resend API key

### Modifying the database schema

1. Write SQL migration in `infra/supabase/migration/`
2. Run in Supabase SQL editor
3. Regenerate types: `supabase gen types typescript --local > src/lib/database.types.ts`
4. Update queries in `src/lib/queries/`

### Performance optimization checklist

When building new features, ensure:

**Data fetching:**
- [ ] Independent queries are parallelized with `Promise.all()`
- [ ] Queries filter at database level (`.eq()`, `.in()`, `.gte()`) — never fetch-then-filter
- [ ] Frequently called functions are wrapped with `cache()` for deduplication
- [ ] Slowly changing data uses `unstable_cache` with appropriate TTL and tags
- [ ] Consider using Postgres RPCs for pages with 5+ related queries

**Mutations:**
- [ ] Multi-step mutations use RPC transactions or handle partial failures gracefully
- [ ] Race conditions prevented with row-level locking (`FOR UPDATE` in RPCs)
- [ ] Cache invalidation calls `revalidateTag()` for affected tags
- [ ] Audit log entries created for privileged operations

**User experience:**
- [ ] Loading states have `loading.tsx` with HCC logo + skeleton blocks
- [ ] Error states show actionable error messages
- [ ] Forms validate client-side before submission
- [ ] Responsive design tested on mobile/tablet/desktop

**Security:**
- [ ] User-facing operations use `sbServer()` (RLS-aware)
- [ ] Privileged operations use `sbAdmin()` only when necessary and are never exposed to browser
- [ ] Service-role key never referenced in client components
- [ ] Input validation on all server actions and RPCs

**Bundle size:**
- [ ] Heavy components lazy-loaded with `next/dynamic`
- [ ] Large libraries (icons, calendars) only imported where needed
- [ ] CSS scoped to component-level when possible (avoid globals)
