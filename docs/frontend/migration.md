# Migration Reference

## Olive → Gray Mapping

Quick reference when updating existing pages from the old olive palette:

```
text-olive-900   → text-gray-900
text-olive-800   → text-gray-700
text-olive-700   → text-gray-600
text-olive-600   → text-gray-500
text-olive-500   → text-gray-500
text-olive-400   → text-gray-400
text-olive-300   → text-gray-300
bg-olive-50      → bg-gray-50
bg-olive-100     → bg-gray-100
hover:bg-olive-50  → hover:bg-gray-50
hover:bg-olive-100 → hover:bg-gray-100
border-olive-100 → border-gray-200
border-olive-200 → border-gray-200
border-olive-300 → border-gray-300
bg-olive-700     → bg-primary        (active/checked states)
bg-olive-600     → bg-primary        (active/checked states)
bg-olive-500     → bg-primary        (active/checked states)
focus:ring-olive-*           → focus:ring-primary
focus-visible:ring-olive-*   → focus-visible:ring-primary
```

> **Keep olive-*** CSS variables in `:root` and `@theme inline` for backward compatibility until all pages are migrated.

## Status Color Migration

Old hardcoded colors → earth-toned tokens:

```
border-blue-200 bg-blue-100 text-blue-800     → border-status-slate/20 bg-status-slate/10 text-status-slate
border-amber-200 bg-amber-100 text-amber-800   → border-status-ochre/20 bg-status-ochre/10 text-status-ochre
border-emerald-200 bg-emerald-100 text-emerald-800 → border-status-forest/20 bg-status-forest/10 text-status-forest
border-purple-200 bg-purple-100 text-purple-800 → border-status-plum/20 bg-status-plum/10 text-status-plum
border-neutral-200 bg-neutral-100 text-neutral-600 → border-status-stone/20 bg-status-stone/10 text-status-stone
text-amber-600 bg-amber-50 border-amber-100   → text-status-ochre bg-status-ochre/5 border-status-ochre/10
text-green-700 bg-green-50 border-green-100   → text-status-forest bg-status-forest/5 border-status-forest/10
```

## Pages Already on New System (Gray + Earth-Toned)

- `src/app/(app)/(admin)/admin/enquiries/[id]/client.tsx`
- `src/app/(app)/(admin)/admin/enquiries/[id]/quote-builder.tsx`
- `src/app/(app)/(admin)/admin/enquiries/client.tsx`
- `src/app/(app)/(admin)/admin/bookings/client.tsx`
- `src/app/(app)/(admin)/admin/bookings/[id]/client.tsx`
- `src/app/(app)/(admin)/admin/bookings/[id]/space-request-card.tsx`
- `src/app/(app)/(admin)/admin/bookings/[id]/day-meal-card.tsx`
- `src/app/(app)/(admin)/admin/bookings/[id]/_components/accommodation-requests-card.tsx`
- `src/app/(app)/(admin)/admin/bookings/[id]/_components/approval-checklist.tsx`
- `src/app/(app)/(admin)/admin/bookings/[id]/_components/admin-notes-card.tsx`
- `src/app/(app)/(admin)/admin/bookings/[id]/_components/room-allocation-grid.tsx`
- All `src/components/ui/` primitives

## Known Inconsistencies (Not Yet Migrated)

- Room status legend — domain-specific system, separate from booking status
- Schedule page badges (YesNoBadge, catering type) — operational indicators
- Approval checklist pass/fail markers — UI feedback (keep green/red)
- Day meal card completion badges — operational indicators
- Quote accepted/itemized badges — keep for now

## Future Scope

When migrating remaining admin pages:
1. Replace `text-olive-*` with gray equivalents using the mapping above
2. Replace hardcoded status color classes with earth-toned tokens
3. Update stat card accent classes to use `status-*` tokens
4. Remove page from "Known Inconsistencies" list above
