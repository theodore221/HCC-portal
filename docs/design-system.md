# HCC Portal Design System

Unified design reference for all HCC Portal pages. All new UI work must use this system.

## Color Palette

### Primary (Bright Sage Green)
Brand identity — matches the Holy Cross Centre website's sage palette (`#679737`), vivid and natural:

| Token | Value | Usage |
|-------|-------|-------|
| `bg-primary` | #6c8f36 | Buttons, active states, focus rings, checked inputs |
| `bg-primary-light` | #86ad45 | Hover states on primary buttons |
| `bg-primary/10` | #6c8f36 10% | Light primary surface (badges, selected rows) |
| `bg-primary/20` | #6c8f36 20% | Stronger tinted surface |
| `text-primary` | #6c8f36 | Links, accent text |
| `bg-secondary` | #edf6d5 | Light sage background (cards, panels) |

> The HCC website uses `#679737` (its declared sage) and `#65bc7b` (vibrant green). `#6c8f36` sits in the same natural sage family — brighter than the previous `#2F5233` forest green.

### Neutrals (Tailwind Gray)
All chrome/text uses gray — **never olive** for new pages:

| Role | Class | Hex | Usage |
|------|-------|-----|-------|
| Heading | `text-gray-900` | #111827 | Page titles, card headings |
| Body | `text-gray-700` | #374151 | Descriptions, field values |
| Secondary | `text-gray-600` | #4b5563 | Sub-labels, secondary body |
| Label | `text-gray-500` | #6b7280 | Form labels, hints, metadata |
| Muted | `text-gray-400` | #9ca3af | Placeholders, strikethrough |
| Faint | `text-gray-300` | #d1d5db | Empty state icons |
| Surface | `bg-gray-50` | #f9fafb | Page bg, table headers, panel bg |
| Surface alt | `bg-gray-100` | #f3f4f6 | Badges, hover states |
| Border light | `border-gray-100` | #f3f4f6 | Inner row dividers |
| Border | `border-gray-200` | #e5e7eb | Cards, dividers |
| Input border | `border-gray-300` | #d1d5db | Form inputs |

### Semantic Status Colors
Unchanged — use consistently for status indicators:

| Role | Family | Usage |
|------|--------|-------|
| Success | `emerald-*` | Accepted, paid, waived |
| Warning | `amber-*` | Overrides, alerts |
| Error | `red-*` | Destructive, failed |
| Info | `blue-*` | Informational badges |

---

## Typography

**Font**: Geist Sans (loaded via `next/font`), falling back to Inter, Helvetica, Arial.

| Scale | Classes | Usage |
|-------|---------|-------|
| Page title | `text-2xl font-bold text-gray-900` | Main page heading |
| Section heading | `text-lg font-semibold text-gray-900` | Card titles, section headers |
| Body | `text-sm text-gray-700` | Body text, field values |
| Label | `text-xs text-gray-500` | Form labels, metadata |
| Table header | `text-xs font-semibold uppercase tracking-wider text-gray-500` | Column headers |
| Caption | `text-xs text-gray-400` | Timestamps, secondary info |

---

## Component Patterns

### Cards
```
rounded-2xl border border-gray-200 bg-white shadow-sm
```

### Buttons
```
bg-primary text-white rounded-xl           (primary)
border border-gray-300 text-gray-700 rounded-xl  (outline)
```

### Inputs
```
border border-gray-300 focus:border-primary focus:ring-primary/20 rounded-xl bg-white
```

### Collapsible Triggers
```
bg-gray-50 hover:bg-gray-100 text-gray-900
```

### Active Toggle (Preset Buttons)
```
bg-primary text-white border-primary
```

### Inactive Toggle
```
border-gray-300 text-gray-500 hover:bg-gray-50
```

### Focus Rings
```
focus:ring-primary/20    (inputs, focus-visible)
focus-visible:ring-primary  (interactive elements)
```

### Checked Controls (Checkbox, Switch, Radio)
```
bg-primary border-primary
```

### Pricing Preview Panel
```
bg-gray-50 min-h-full
```

---

## Semantic CSS Tokens (globals.css)

These tokens map to Tailwind gray — used by Shadcn primitives:

| Token | Value | Mapped to |
|-------|-------|-----------|
| `bg-muted` | #f3f4f6 | gray-100 |
| `text-muted-foreground` | #6b7280 | gray-500 |
| `border-input` | #d1d5db | gray-300 |
| `ring` / `focus-visible:ring-ring` | #6c8f36 | primary sage green |
| `bg-surface` | #f9fafb | gray-50 |
| `text-surface-foreground` | #111827 | gray-900 |

---

## Migration Mapping (Olive → Gray)

Quick reference when updating existing pages:

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
focus:ring-olive-* → focus:ring-primary
focus-visible:ring-olive-* → focus-visible:ring-primary
```

> **Keep olive-*** CSS variables in `:root` and `@theme inline` for backward compatibility until all pages are migrated.

---

## Pages Already on New System

- `src/app/(app)/(admin)/admin/enquiries/[id]/client.tsx`
- `src/app/(app)/(admin)/admin/enquiries/[id]/quote-builder.tsx`
- All `src/components/ui/` primitives

## Shared Primitives (Updated)

All components in `src/components/ui/` now use semantic tokens or gray-* instead of olive-*:

- `sheet.tsx`, `checkbox.tsx`, `dropdown-menu.tsx`, `select.tsx`
- `tooltip.tsx`, `combobox.tsx`, `scroll-area.tsx`, `loading-overlay.tsx`
- `stepper.tsx`, `room-card.tsx`, `color-picker.tsx`, `data-table-column-header.tsx`
- `navigation-menu.tsx`, `audit-timeline.tsx`
