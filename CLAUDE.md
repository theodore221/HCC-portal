# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.
For detailed patterns and examples, see the referenced docs — read them before making changes in those areas.

## Project Overview

HCC Portal is a role-aware booking management system for the Holy Cross Centre. It provides distinct interfaces for admin, staff, caterers, and customers to manage bookings, catering, room allocations, and schedules.

## Core Design Pillars

**CRITICAL**: All code changes MUST align with these foundational principles:

### 1. Performance First
- **Target**: Sub-100ms detail pages, <2s dashboards
- Minimize HTTP round-trips — use `Promise.all()` and Postgres RPCs
- Deduplicate with React `cache()` and `unstable_cache()`
- Filter at database level (never fetch-then-filter client-side)
- Lazy-load heavy components with `next/dynamic`
- Loading skeletons with HCC logo on all async operations

### 2. Security & Privacy by Default
- Default to RLS-aware `sbServer()` for all user-facing operations
- `sbAdmin()` ONLY when RLS must be bypassed (profile provisioning, system operations)
- Never expose service-role credentials to browser bundles
- Atomic transactions with row-level locking for mutations
- Log privileged operations in audit trail

### 3. Usability & Accessibility
- Mobile-first responsive design (see `docs/frontend/responsive.md`)
- Clear error messages with actionable guidance
- Keyboard navigation + ARIA labels
- Touch targets 44px+ on mobile

## Tech Stack

- **Framework**: Next.js 16 with App Router and Turbopack
- **Backend**: Supabase (PostgreSQL with RLS, Realtime, Auth)
- **UI**: Tailwind CSS 4 + Shadcn-inspired Radix UI components
- **Email**: React Email with Resend
- **Testing**: Vitest
- **Language**: TypeScript (strict mode)

## Development Commands

```bash
npm run dev              # Dev server with Turbopack (http://localhost:3000)
npm run build            # Production build
npm run lint             # ESLint
npm test                 # Vitest tests
npm run email:dev        # Preview email templates
```

## Architecture Overview

### Route Structure

- `/(main)/(public)/login` — Supabase auth entry point
- `/(app)/(admin)/admin/*` — Admin dashboard
- `/(app)/(staff)/staff/*` — Operational views (kitchen, run sheets)
- `/(app)/(caterer)/caterer/*` — Caterer job management
- `/(app)/(portal)/portal/*` — Customer booking wizard

### Authentication & Authorization

- **Middleware** (`middleware.ts`): Role-based access via Supabase session
- **Roles**: `admin`, `staff`, `caterer`, `customer`
- **Auth helpers**: `src/lib/auth/server.ts`, `src/lib/auth/paths.ts`
- **Profile service**: `src/server/services/profiles.ts`

### Supabase Client Pattern

| Client | Factory | When to use |
|--------|---------|-------------|
| **RLS-aware** | `sbServer()` from `src/lib/supabase-server.ts` | Server components, actions, route handlers — respects RLS |
| **Service-role** | `sbAdmin()` from `src/lib/supabase-admin.ts` | Profile provisioning, GAS ingest, admin-only ops — bypasses RLS |
| **Browser** | `sbBrowser()` from `src/lib/supabase-browser.ts` | Client components, Realtime subscriptions |

### Data Layer

- `src/lib/queries/` — Server-side query functions (`.server.ts` for privileged)
- `src/server/services/` — Business logic with elevated permissions
- `src/lib/cache.ts` — Cache tags (`CACHE_TAGS.*`), revalidation helpers
- `src/lib/pricing/` — Booking cost calculation

### Path Aliases

- `@/*` → `src/*`
- `@/server/*` → `src/server/*`

## Key Rules (see `docs/patterns.md` for full examples)

### Data Fetching
- **Always** parallelize independent queries with `Promise.all()`
- **Always** filter in SQL (`.eq()`, `.in()`, `.gte()`) — never fetch-then-filter
- Wrap functions called multiple times during SSR with React `cache()`
- Use `unstable_cache` with tags for slowly changing data
- Use Postgres RPCs for detail pages with 5+ related queries

### Mutations
- Multi-step mutations → use RPC transactions (not sequential JS calls)
- Race-prone operations → row-level locking (`FOR UPDATE` in RPCs)
- Server actions in `actions.ts` files with `"use server"` directive
- Always `revalidateTag()` affected cache tags after mutations

### Available RPCs
**Reads**: `get_booking_detail`, `get_room_status`, `get_dietary_meal_attendance`
**Mutations**: `delete_booking_cascade`, `update_meal_job_items`, `allocate_room`, `upsert_booking_snapshot`

### Cache Tags
Defined in `src/lib/cache.ts`: `BOOKINGS`, `MEAL_JOBS`, `SPACE_RESERVATIONS`, `ROOM_ASSIGNMENTS`, `DIETARY_PROFILES`, `CATERERS`, `MENU_ITEMS`, `PROFILES`, `ROOMS`, `SPACES`

### UI Patterns
- Every async route needs `loading.tsx` with HCC logo + skeleton blocks
- Forms validate client-side before submission
- Use `useTransition` for server action pending states
- Toasts via `sonner` for success/error feedback

## Claude for Chrome (QA)

When using `/chrome` to verify UI changes in the browser:

- Use `read_page` to get element refs from the accessibility tree
- Use `find` to locate elements by description
- Click/interact using `ref`, not coordinates
- **NEVER** take screenshots unless explicitly requested by the user
- Focus on: does the component render, are interactive elements accessible, do forms work
- Only check the specific page/component that changed — don't crawl the whole app

### Token-Efficient QA Strategy

Follow this order — stop as soon as the issue is caught:

1. `npx tsc --noEmit` — type errors (free)
2. `npm run lint` — code quality (free)
3. `npm run test` — logic errors (cheap)
4. `/chrome` browser check — UI verification (use sparingly, accessibility tree only)

Use the `/qa-check` slash command for automated tiered checks.

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=         # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Public anon key
SUPABASE_SERVICE_ROLE_KEY=        # Server-only, never expose to browser
RESEND_API_KEY=                   # Email via Resend
PUBLIC_SITE_URL=                  # Magic link target (http://localhost:3000 locally)
```

## Important Files

| File | Purpose |
|------|---------|
| `middleware.ts` | Auth + role-based routing |
| `src/lib/database.types.ts` | Generated Supabase types |
| `src/lib/supabase-server.ts` | RLS-aware client factory |
| `src/lib/supabase-admin.ts` | Service-role client factory |
| `src/lib/cache.ts` | Cache tags + revalidation helpers |
| `src/components/ui/` | Reusable UI primitives |
| `src/emails/` | React Email templates |

## Detailed Documentation

Read these before making changes in the relevant area:

- **`docs/patterns.md`** — Code patterns with full examples (data fetching, mutations, RPCs, caching, components)
- **`docs/frontend/`** — Frontend design system: tokens, components, patterns, states, responsive guidelines, migration reference (read before UI changes)
- **`docs/supabase-integration.md`** — Database schema, RLS policies, GAS integration, deployment sequence

## Common Tasks

### Adding a new role-based route
1. Create route in `src/app/(app)/(role)/role-name/new-page/page.tsx`
2. Middleware enforces access automatically based on route prefix
3. Use `sbServer()` in server components

### Sending an email
1. Create React Email template in `src/emails/`
2. Add send helper in `src/lib/email/`
3. Call from server action or API route

### Modifying the database
1. Write SQL migration in `infra/supabase/migration/`
2. Run in Supabase SQL editor
3. Regenerate types: `supabase gen types typescript --local > src/lib/database.types.ts`

### Performance checklist
- [ ] Independent queries parallelized with `Promise.all()`
- [ ] Queries filter at database level
- [ ] Frequent functions wrapped with `cache()`
- [ ] Slow data uses `unstable_cache` with tags
- [ ] Multi-step mutations use RPC transactions
- [ ] Cache invalidation via `revalidateTag()` for affected tags
- [ ] `loading.tsx` with HCC logo + skeleton
- [ ] Responsive across mobile/tablet/desktop
- [ ] User-facing ops use `sbServer()`, privileged use `sbAdmin()`
