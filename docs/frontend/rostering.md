# Rostering Module — Design Reference

Read this before changing any page under `admin/rostering/` or `staff/rostering/`.

---

## Layouts

| Page | Pattern |
|---|---|
| Scheduler | `grid-cols-1 lg:grid-cols-[460px_1fr]` — calendar left, day panel right |
| Timesheets | `grid-cols-1 lg:grid-cols-[420px_1fr]` — list left, detail right |
| Staff | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` card grid |
| Tasks | Vertical `space-y-3` list of job cards |
| My Shifts (staff) | Vertical list, grouped "Upcoming" / "Past" |
| Timesheet (staff) | `grid-cols-1 lg:grid-cols-[380px_1fr]` — form left, history right |

Both admin and staff use the same **pill-tab** nav: `flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 overflow-x-auto` with individual `Link` elements. Active tab: `bg-white text-gray-900 shadow-sm`. Inactive: `text-gray-500 hover:text-gray-700`.

---

## Status Chips

Use `<RosteringStatusChip status={...} />` from `@/components/ui/rostering-status-chip`. All chips use `border-status-{x}/20 bg-status-{x}/10 text-status-{x}`.

| Status | Token |
|---|---|
| Draft | `status-stone` |
| Published | `status-sage` |
| InProgress | `status-slate` |
| Completed / Accepted / Approved | `status-forest` |
| Cancelled / Declined / Rejected | `status-clay` |
| Pending / Submitted | `status-ochre` |
| NoResponse | `status-stone` |

---

## Roster Job Cards

Each job card uses a **4px colored left border** from the job's `color` field:

```jsx
<div
  className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden"
  style={{ borderLeftColor: job.color, borderLeftWidth: "4px" }}
>
```

Task rows sit below a `border-t border-gray-100` divider, separated by `border-b border-gray-100 last:border-0`, with `group hover:bg-gray-50 transition-colors`. The ⋮ action button uses `opacity-0 group-hover:opacity-100 focus:opacity-100` (hover-reveal pattern).

Job color options (8): `#6c8f36 #72a83c #169e66 #2a8a7a #c49910 #d63d2e #8840c4 #6b7280`

---

## Break Rule

30 min per 5-hour work tier: `Math.floor(workMinutes / 300) * 30`

`working_minutes` from RPC is already net (gross − break). Never subtract break again.

---

## Fortnight Anchor

Timesheet periods use 2-week fortnights anchored to **2026-01-10 (Saturday)**. Period is passed as `?start=YYYY-MM-DD` URL param.
